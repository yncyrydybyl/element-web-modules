/**
 * Turns "@oncall" in a message into ordinary Matrix mentions: the members' user IDs go into
 * `m.mentions.user_ids`, which the default push rule `.m.rule.is_user_mention` matches in every
 * client, and the text shows who was meant ("@oncall (Alice, Bob)", with user pills in the HTML).
 * "@channel" becomes Matrix's own @room (`m.mentions.room`). The tags used are recorded in
 * `de.datanauten.tags`, which only this module reads.
 */

import type { ResolvedTag } from "./tags";

export const CONTENT_KEY = "de.datanauten.tags";
/** Names written into the text; further members are only counted ("+3"). All are mentioned. */
export const NAMES_IN_TEXT = 10;
export const DEFAULT_MAX_MENTIONS = 50;

const TEXT_TYPES = new Set(["m.text", "m.emote", "m.notice"]);
/** "@name" not preceded by a word character (e-mail addresses) and not part of a user ID ("@bob:server"). */
const TOKEN_RE = /(^|[^A-Za-z0-9_@:/.-])@([A-Za-z0-9][A-Za-z0-9_-]{0,31})(?![A-Za-z0-9_:-])/g;
const CODE_RE = /(```[\s\S]*?```|`[^`\n]*`)/;

export interface UsedTag {
    name: string;
    user_ids?: string[];
    room?: boolean;
}

export type SkipReason = "too_many" | "not_allowed" | "empty";

export interface ExpandOptions {
    tags: ResolvedTag[];
    /** Display name of a room member. */
    name(userId: string): string;
    max: number;
}

export interface ExpandResult {
    content: Record<string, unknown>;
    used: ResolvedTag[];
    skipped: { tag: ResolvedTag; reason: SkipReason }[];
}

/** The tag names typed in a text (lower case, first occurrence order), ignoring code. */
export function findTagNames(text: string): string[] {
    const names: string[] = [];
    for (const seg of splitMarkdownCode(text)) {
        if (!seg.replaceable) continue;
        for (const m of seg.text.matchAll(TOKEN_RE)) {
            const n = m[2].toLowerCase();
            if (!names.includes(n)) names.push(n);
        }
    }
    return names;
}

/**
 * Expands the tags in an outgoing message. Returns undefined when the message isn't a text
 * message, is an edit, was already expanded, or mentions no known tag. Mutates nothing.
 */
export function expandContent(content: Record<string, unknown>, opts: ExpandOptions): ExpandResult | undefined {
    if (!TEXT_TYPES.has(String(content.msgtype)) || typeof content.body !== "string") return undefined;
    if (content[CONTENT_KEY] || content["m.new_content"]) return undefined;
    if ((content["m.relates_to"] as { rel_type?: string } | undefined)?.rel_type === "m.replace") return undefined;
    const typed = findTagNames(content.body);
    const tags = typed.map((n) => opts.tags.find((t) => t.name === n)).filter((t): t is ResolvedTag => !!t);
    if (!tags.length) return undefined;

    const used: ResolvedTag[] = [];
    const skipped: ExpandResult["skipped"] = [];
    const userIds = new Set<string>();
    for (const tag of tags) {
        if (!tag.allowed) skipped.push({ tag, reason: "not_allowed" });
        else if (tag.kind === "channel") used.push(tag);
        else if (!tag.members.length) skipped.push({ tag, reason: "empty" });
        else if (new Set([...userIds, ...tag.members]).size > opts.max) skipped.push({ tag, reason: "too_many" });
        else {
            used.push(tag);
            tag.members.forEach((u) => userIds.add(u));
        }
    }
    if (!used.length) return { content, used, skipped };

    const plain = (tag: ResolvedTag): string => {
        if (tag.kind === "channel") return "@room";
        const names = tag.members.slice(0, NAMES_IN_TEXT).map(opts.name);
        const more = tag.members.length - names.length;
        return `@${tag.name} (${names.join(", ")}${more > 0 ? ` +${more}` : ""})`;
    };
    const html = (tag: ResolvedTag): string => {
        if (tag.kind === "channel") return "@room";
        const pills = tag.members
            .slice(0, NAMES_IN_TEXT)
            .map((u) => `<a href="https://matrix.to/#/${escapeHtml(u)}">${escapeHtml(opts.name(u))}</a>`);
        const more = tag.members.length - pills.length;
        return `<strong>@${escapeHtml(tag.name)}</strong> (${pills.join(", ")}${more > 0 ? ` +${more}` : ""})`;
    };

    const byName = new Map(used.map((t) => [t.name, t]));
    const body = replaceFirst(content.body, byName, plain, splitMarkdownCode);
    const isHtml = content.format === "org.matrix.custom.html" && typeof content.formatted_body === "string";
    const baseHtml = isHtml ? (content.formatted_body as string) : escapeHtml(content.body).replace(/\n/g, "<br>");
    const formatted = replaceFirst(baseHtml, byName, html, splitHtml);

    const prev = (content["m.mentions"] ?? {}) as { user_ids?: unknown; room?: unknown };
    const prevIds = Array.isArray(prev.user_ids) ? prev.user_ids.filter((u): u is string => typeof u === "string") : [];
    const mentions: Record<string, unknown> = { ...prev, user_ids: [...new Set([...prevIds, ...userIds])] };
    if (used.some((t) => t.kind === "channel")) mentions.room = true;

    const record: UsedTag[] = used.map((t) => (t.kind === "channel" ? { name: t.name, room: true } : { name: t.name, user_ids: t.members }));
    return {
        content: {
            ...content,
            body,
            format: "org.matrix.custom.html",
            formatted_body: formatted,
            "m.mentions": mentions,
            [CONTENT_KEY]: record,
        },
        used,
        skipped,
    };
}

/** Reads `de.datanauten.tags` from a received message. */
export function parseUsedTags(content: Record<string, unknown> | undefined): UsedTag[] | undefined {
    const raw = content?.[CONTENT_KEY];
    if (!Array.isArray(raw)) return undefined;
    const tags = raw
        .filter((t): t is Record<string, unknown> => !!t && typeof t === "object" && typeof (t as UsedTag).name === "string")
        .map((t) => ({
            name: String(t.name),
            room: t.room === true || undefined,
            user_ids: Array.isArray(t.user_ids) ? t.user_ids.filter((u): u is string => typeof u === "string") : undefined,
        }));
    return tags.length ? tags : undefined;
}

type Segment = { text: string; replaceable: boolean };

/** Splits plain text into code (left alone) and prose. */
function splitMarkdownCode(text: string): Segment[] {
    return text.split(CODE_RE).map((part, i) => ({ text: part, replaceable: i % 2 === 0 }));
}

/** Splits HTML into tags and text; text inside <code>, <pre> and <a> is left alone. */
function splitHtml(html: string): Segment[] {
    const out: Segment[] = [];
    let skipDepth = 0;
    for (const part of html.split(/(<[^>]*>)/)) {
        const tag = /^<(\/?)(code|pre|a)\b/i.exec(part);
        if (tag) skipDepth = Math.max(0, skipDepth + (tag[1] ? -1 : 1));
        out.push({ text: part, replaceable: !part.startsWith("<") && skipDepth === 0 });
    }
    return out;
}

function replaceFirst(
    text: string,
    tags: Map<string, ResolvedTag>,
    render: (tag: ResolvedTag) => string,
    split: (text: string) => Segment[],
): string {
    const done = new Set<string>();
    return split(text)
        .map((seg) =>
            !seg.replaceable
                ? seg.text
                : seg.text.replace(TOKEN_RE, (whole, pre: string, name: string) => {
                      const tag = tags.get(name.toLowerCase());
                      if (!tag || done.has(tag.name)) return whole;
                      done.add(tag.name);
                      return pre + render(tag);
                  }),
        )
        .join("");
}

export function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
