import type { Api, ComposerApiTarget, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { getSdkClient, roomIdFromHash, type SdkClient, type SdkRoom } from "./client";
import { DEFAULT_MAX_MENTIONS, expandContent, parseUsedTags, type ExpandResult } from "./expand";
import { P, translations, type ModuleTranslate } from "./i18n";
import { installSendHook } from "./sendHook";
import { ComposerSuggest, type SuggestState } from "./suggest";
import { registerSuiteRenderer } from "./suiteRender";
import { definitionsFor, parentSpaces, resolveTags, TAG_EVENT, tagContent, tagsIn, type ResolvedTag } from "./tags";
import { HeaderButton, TagIcon } from "./ui/icons";
import { ManageDialog, type ManageDialogProps, type Scope } from "./ui/ManageDialog";
import { PickerDialog, type PickerDialogProps } from "./ui/PickerDialog";
import { SkippedDialog, type SkippedDialogProps } from "./ui/SkippedDialog";
import css from "./ui/styles.css?inline";
import { Suggestions } from "./ui/Suggestions";
import { TagFooter } from "./ui/TagFooter";

const STYLE_ID = "de-datanauten-tag-mentions-style";
const CONFIG_KEY = "de.datanauten.tag_mentions";
/** How often to look for a (new) logged-in client: module API 2.3.0 has no `waitForClientStarted`. */
const START_POLL_MS = 2000;

interface ModuleConfig {
    /** Most people one message may mention through tags (default 50). */
    max_mentions?: number;
}

export class TagMentionsModule implements Module {
    // 2.0.0 is the first release with `composer`, `openDialog`, `extras` and `customComponents`.
    public static readonly moduleApiVersion = "^2.0.0";

    private client?: SdkClient;
    private unhook?: () => void;
    private startTimer?: ReturnType<typeof setInterval>;
    private readonly suggest: ComposerSuggest;
    private suggestRoot?: { render(node: React.ReactNode): void };
    private readonly listeners = new Set<() => void>();
    private max = DEFAULT_MAX_MENTIONS;

    public constructor(private readonly api: Api) {
        this.suggest = new ComposerSuggest({
            tagsForComposer: () => {
                const client = getSdkClient();
                const roomId = client && roomIdFromHash(client, window.location.hash);
                return client && roomId && this.client === client ? resolveTags(client, roomId) : [];
            },
            render: this.renderSuggestions,
        });
    }

    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        this.max = readMax(this.api);
        injectStyle();

        this.api.composer.addFileUploadOption({
            type: "de.datanauten.tag_mentions.insert",
            label: this.t(`${P}menu_insert`),
            icon: TagIcon,
            onSelected: (roomId, view) => this.openPicker(roomId, view),
        });

        registerSuiteRenderer(this.api.customComponents, {
            id: "tag-mentions/footer",
            filter: (ev) => ev.type === "m.room.message" && !!parseUsedTags(ev.content),
            render: (props, inner) => (
                <>
                    {inner()}
                    <TagFooter t={this.t} tags={parseUsedTags(props.mxEvent.content)!} name={this.nameIn(props.mxEvent.roomId)} />
                </>
            ),
        });

        this.api.extras.addRoomHeaderButtonCallback((roomId) => {
            this.start();
            return <HeaderButton key="tag-mentions" label={this.t(`${P}header_button`)} onClick={() => this.openManage(roomId)} />;
        });

        // Lets sibling suite modules that send messages themselves (teamwork's dialog) expand tags too.
        const suite = ((window as unknown as { deDatanautenTeamsSuite?: Record<string, unknown> }).deDatanautenTeamsSuite ??= {});
        suite["tag-mentions"] = {
            version: 1,
            expand: (roomId: string, content: Record<string, unknown>) => {
                this.start();
                return this.transform(roomId, content) ?? content;
            },
        };

        this.suggest.start();
        this.startTimer = setInterval(() => this.start(), START_POLL_MS);
    }

    /** Element never unloads modules; this exists for tests. */
    public dispose(): void {
        if (this.startTimer) clearInterval(this.startTimer);
        this.suggest.stop();
        this.detach();
    }

    /** Hooks the logged-in client once its first sync is done; again after a new login. */
    private start(): void {
        const client = getSdkClient();
        if (client === this.client) return;
        this.detach();
        if (!client || (client.isInitialSyncComplete && !client.isInitialSyncComplete())) return;
        this.client = client;
        this.unhook = installSendHook(client, this.transform);
        client.on("RoomState.events", this.notify);
    }

    private detach(): void {
        this.unhook?.();
        this.unhook = undefined;
        this.client?.off("RoomState.events", this.notify);
        this.client = undefined;
    }

    /** Runs inside `sendMessage`, before the local echo and encryption. */
    private transform = (roomId: string, content: Record<string, unknown>): Record<string, unknown> | undefined => {
        const client = this.client;
        if (!client) return undefined;
        const result = expandContent(content, { tags: resolveTags(client, roomId), name: this.nameIn(roomId), max: this.max });
        if (!result) return undefined;
        if (result.skipped.length) setTimeout(() => this.showSkipped(result), 0);
        return result.used.length ? result.content : undefined;
    };

    private showSkipped(result: ExpandResult): void {
        const lines = result.skipped.map(({ tag, reason }) => this.t(`${P}skip_${reason}`, { name: tag.name, max: this.max }));
        this.api.openDialog<void, SkippedDialogProps>({ title: this.t(`${P}skipped_title`) }, SkippedDialog, { t: this.t, lines });
    }

    private openPicker(roomId: string | undefined, view: ComposerApiTarget | undefined): void {
        this.start();
        const client = getSdkClient();
        if (!client || !roomId || !client.getRoom(roomId)) return;
        const target: ComposerApiTarget = view ?? { view: "room" };
        const threadId = target.view === "thread" ? ((target as { threadId?: string }).threadId ?? null) : null;
        this.api.openDialog<string, PickerDialogProps>({ title: this.t(`${P}picker_title`) }, PickerDialog, {
            t: this.t,
            tags: resolveTags(client, roomId),
            name: this.nameIn(roomId),
            max: this.max,
            // Without the hook on sendMessage, a tag typed into the composer wouldn't be expanded.
            mode: this.unhook ? "insert" : "send",
            insert: (tag: ResolvedTag) => {
                const before = composerText(target.view === "thread" ? "thread" : "room");
                const text = `${before && !/\s$/.test(before) ? " " : ""}@${tag.name} `;
                this.api.composer.insertPlaintextIntoComposer(text, target);
            },
            send: async (tag: ResolvedTag, text: string) => {
                const content = { msgtype: "m.text", body: `@${tag.name} ${text.trim()}`.trim() };
                const result = expandContent(content, { tags: resolveTags(client, roomId), name: this.nameIn(roomId), max: this.max });
                await client.sendEvent(roomId, threadId, "m.room.message", result?.used.length ? result.content : content);
            },
            openManage: () => this.openManage(roomId),
        });
    }

    private openManage(roomId: string): void {
        this.start();
        const client = getSdkClient();
        const room = client?.getRoom(roomId);
        const me = client?.getUserId();
        if (!client || !room || !me) return;
        const scopeOf = (r: SdkRoom): Scope => ({
            id: r.roomId,
            name: r.name,
            isSpace: !!r.isSpaceRoom?.(),
            canEdit: r.currentState.maySendStateEvent(TAG_EVENT, me),
            level: requiredLevel(r),
        });
        const scopes = [scopeOf(room), ...parentSpaces(client, room).map(scopeOf)];
        this.api.openDialog<void, ManageDialogProps>({ title: this.t(`${P}manage_title`) }, ManageDialog, {
            t: this.t,
            scopes,
            tagsIn: (id: string) => {
                const r = client.getRoom(id);
                return r ? tagsIn(r) : [];
            },
            inherited: () => definitionsFor(client, room).filter((d) => d.sourceId !== room.roomId),
            members: async (id: string) => {
                const r = client.getRoom(id);
                if (!r) return [];
                await r.loadMembersIfNeeded?.().catch(() => false);
                return r.getJoinedMembers().map((m) => ({ userId: m.userId, name: m.name }));
            },
            name: this.nameIn(roomId),
            save: async (id: string, name: string, label: string, userIds: string[]) => {
                await client.sendStateEvent(id, TAG_EVENT, tagContent(label, userIds), name);
            },
            remove: async (id: string, name: string) => {
                await client.sendStateEvent(id, TAG_EVENT, {}, name);
            },
            subscribe: this.subscribe,
            max: this.max,
        });
    }

    private renderSuggestions = (state: SuggestState | null, pick: (tag: ResolvedTag) => void): void => {
        if (!this.suggestRoot) {
            if (!state) return;
            const el = document.createElement("div");
            el.id = "tag-mentions-suggest";
            document.body.appendChild(el);
            this.suggestRoot = this.api.createRoot(el);
        }
        const roomId = roomIdFromHash(getSdkClient(), window.location.hash) ?? "";
        this.suggestRoot.render(state ? <Suggestions t={this.t} state={state} name={this.nameIn(roomId)} max={this.max} pick={pick} /> : null);
    };

    /** Display names: the room's members first, then the spaces' (for people not in the room). */
    private nameIn(roomId: string): (userId: string) => string {
        return (userId: string) => {
            const client = getSdkClient();
            const room = client?.getRoom(roomId);
            const name = room?.getMember(userId)?.name;
            if (name) return name;
            for (const space of client && room ? parentSpaces(client, room) : []) {
                const n = space.getMember(userId)?.name;
                if (n) return n;
            }
            return userId;
        };
    }

    private subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    };

    private notify = (): void => this.listeners.forEach((l) => l());

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables as Record<string, string>);
}

function readMax(api: Api): number {
    try {
        const cfg = (api.config.get as (key: string) => unknown)(CONFIG_KEY) as ModuleConfig | undefined;
        const n = cfg?.max_mentions;
        if (typeof n === "number" && Number.isInteger(n) && n > 0) return n;
    } catch {
        // No config: the default.
    }
    return DEFAULT_MAX_MENTIONS;
}

/** The power level needed to send tag state events in a room. */
function requiredLevel(room: SdkRoom): number {
    const pl = room.currentState.getStateEvents("m.room.power_levels", "")?.getContent() as
        | { events?: Record<string, number>; state_default?: number }
        | undefined;
    return pl?.events?.[TAG_EVENT] ?? pl?.state_default ?? 50;
}

/** The composer's current text (DOM), to put a space before an inserted tag if needed. */
function composerText(view: "room" | "thread"): string {
    const sel = view === "thread" ? ".mx_ThreadView .mx_BasicMessageComposer_input" : ".mx_RoomView_body .mx_BasicMessageComposer_input";
    return document.querySelector<HTMLElement>(sel)?.innerText.replace(/\n$/, "") ?? "";
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default TagMentionsModule satisfies ModuleFactory;
