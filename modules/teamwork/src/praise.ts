/**
 * Praise: a thank-you card for a colleague. It is a normal text message with a structured field
 * on top, so every Matrix client shows the plain-text version, the person praised gets a mention
 * notification, and Element Web with this module draws it as a card.
 */

export const PRAISE_KEY = "de.datanauten.praise";

export const BADGES = [
    { id: "thank_you", emoji: "🙏" },
    { id: "team_player", emoji: "🤝" },
    { id: "above_and_beyond", emoji: "🚀" },
    { id: "problem_solver", emoji: "🧩" },
    { id: "creative", emoji: "💡" },
    { id: "mentor", emoji: "🌱" },
    { id: "calm", emoji: "🧘" },
    { id: "leader", emoji: "🧭" },
] as const;

export type BadgeId = (typeof BADGES)[number]["id"];

export interface Praise {
    badge: BadgeId;
    recipients: string[];
    note: string;
}

export function badge(id: string): (typeof BADGES)[number] | undefined {
    return BADGES.find((b) => b.id === id);
}

export function parsePraise(content: Record<string, unknown> | undefined): Praise | undefined {
    const p = content?.[PRAISE_KEY] as Partial<Praise> | undefined;
    if (!p || typeof p.badge !== "string" || !badge(p.badge) || !Array.isArray(p.recipients)) return undefined;
    return {
        badge: p.badge as BadgeId,
        recipients: p.recipients.filter((r): r is string => typeof r === "string"),
        note: typeof p.note === "string" ? p.note : "",
    };
}

export function praiseContent(
    praise: Praise,
    names: Record<string, string>,
    badgeLabel: (id: BadgeId) => string,
    forLabel: string,
): Record<string, unknown> {
    const b = badge(praise.badge)!;
    const who = praise.recipients.map((r) => names[r] ?? r);
    const whoHtml = praise.recipients.map((r) => `<a href="https://matrix.to/#/${encodeURIComponent(r)}">${escapeHtml(names[r] ?? r)}</a>`);
    const note = praise.note.trim();
    return {
        msgtype: "m.text",
        body: `${b.emoji} ${badgeLabel(praise.badge)} — ${forLabel} ${who.join(", ")}${note ? `\n${note}` : ""}`,
        format: "org.matrix.custom.html",
        formatted_body:
            `<p>${b.emoji} <strong>${escapeHtml(badgeLabel(praise.badge))}</strong> — ${escapeHtml(forLabel)} ${whoHtml.join(", ")}</p>` +
            (note ? `<blockquote>${escapeHtml(note).replace(/\n/g, "<br>")}</blockquote>` : ""),
        "m.mentions": { user_ids: praise.recipients },
        [PRAISE_KEY]: { badge: praise.badge, recipients: praise.recipients, note },
    };
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
