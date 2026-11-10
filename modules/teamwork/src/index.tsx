import type { Api, ComposerApiTarget, Module, ModuleFactory, Watchable } from "@element-hq/element-web-module-api";

import { ActionBarInjector } from "./actionBar";
import { findRoomOfEvent, getSdkClient, openEvent, type SdkClient } from "./client";
import { clearComposer, readComposer } from "./composer";
import { P, translations, type ModuleTranslate } from "./i18n";
import { parsePraise, praiseContent, type BadgeId, type Praise } from "./praise";
import { ensureUrgentRule, priorityOf, SETTINGS_TYPE, UrgentReminders, withPriority, withUrgentMentions, type Priority, type Reminder } from "./priority";
import { loadMessage, SavedMessages, type SavedRef } from "./saved";
import { cancelScheduled, listScheduled, ScheduleError, scheduleMessage, sendScheduledNow, supportsScheduling, type ScheduledMessage } from "./schedule";
import { registerSuiteRenderer } from "./suiteRender";
import { ComposeDialog, type ComposeDialogProps, type ComposeResult } from "./ui/ComposeDialog";
import { HeaderButtons } from "./ui/HeaderButtons";
import { PraiseCard } from "./ui/PraiseCard";
import { PraiseDialog, type PraiseDialogProps } from "./ui/PraiseDialog";
import { PriorityMessage } from "./ui/PriorityMessage";
import { SavedDialog, type SavedDialogProps } from "./ui/SavedDialog";
import { ScheduledDialog, type ScheduledDialogProps } from "./ui/ScheduledDialog";
import css from "./ui/styles.css?inline";
import { UrgentToasts } from "./ui/UrgentToast";
import { CalendarIcon, ImportantIcon, TrophyIcon } from "./ui/icons";

const LOG = "[teamwork]";
const STYLE_ID = "de-datanauten-teamwork-style";
/** How often the scheduled-message counts in room headers are refreshed. */
const POLL_MS = 60 * 1000;

interface Settings {
    reminders?: boolean;
    urgent_rule_offered?: boolean;
}

export class TeamworkModule implements Module {
    // 2.0.0 is the first release with `composer`, `openDialog`, `extras` and `client.accountData`.
    public static readonly moduleApiVersion = "^2.0.0";

    private readonly saved: SavedMessages;
    private readonly reminders: UrgentReminders;
    private injector?: ActionBarInjector;
    private settings?: Watchable<unknown>;
    private scheduled?: ScheduledMessage[];
    private canSchedule = false;
    private started?: SdkClient;
    private pollTimer?: ReturnType<typeof setInterval>;
    private startTimer?: ReturnType<typeof setInterval>;
    private readonly listeners = new Set<() => void>();
    private toasts: Reminder[] = [];
    private toastRoot?: { render(node: React.ReactNode): void };

    public constructor(private readonly api: Api) {
        this.saved = new SavedMessages(api);
        this.reminders = new UrgentReminders({
            client: getSdkClient,
            enabled: () => this.getSettings().reminders !== false,
            show: this.showReminder,
            hide: this.hideReminder,
        });
    }

    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        injectStyle();

        this.api.composer.addFileUploadOption({
            type: "de.datanauten.teamwork.schedule",
            label: this.t(`${P}menu_schedule`),
            icon: CalendarIcon,
            onSelected: (roomId, view, relation) => this.openCompose(roomId, view, relation, { startScheduled: true }),
        });
        this.api.composer.addFileUploadOption({
            type: "de.datanauten.teamwork.priority",
            label: this.t(`${P}menu_priority`),
            icon: ImportantIcon,
            onSelected: (roomId, view, relation) => this.openCompose(roomId, view, relation, { priority: "important" }),
        });
        this.api.composer.addFileUploadOption({
            type: "de.datanauten.teamwork.praise",
            label: this.t(`${P}menu_praise`),
            icon: TrophyIcon,
            onSelected: (roomId) => this.openPraise(roomId),
        });

        registerSuiteRenderer(this.api.customComponents, {
            id: "teamwork/praise",
            filter: (ev) => ev.type === "m.room.message" && !!parsePraise(ev.content),
            render: (props) => <PraiseCard t={this.t} praise={parsePraise(props.mxEvent.content)!} names={this.names(props.mxEvent.roomId)} />,
            replaces: true,
        });
        registerSuiteRenderer(this.api.customComponents, {
            id: "teamwork/priority",
            filter: (ev) => ev.type === "m.room.message" && !!priorityOf(ev.content),
            render: (props) => (
                <PriorityMessage t={this.t} priority={priorityOf(props.mxEvent.content)!} body={String(props.mxEvent.content.body ?? "")} />
            ),
            replaces: true,
        });

        this.api.extras.addRoomHeaderButtonCallback((roomId) => {
            // The header exists only once someone is logged in, which is when the client is usable.
            this.start();
            return (
                <HeaderButtons
                    key="teamwork"
                    t={this.t}
                    roomId={roomId}
                    scheduledCount={(id) => (this.canSchedule ? (this.scheduled?.filter((s) => s.roomId === id).length ?? 0) : undefined)}
                    subscribe={this.subscribe}
                    openSaved={this.openSaved}
                    openScheduled={this.openScheduled}
                />
            );
        });

        this.injector = new ActionBarInjector({
            optionsLabel: () => this.api.i18n.translate("common|options"),
            label: (saved) => this.t(`${P}${saved ? "unsave" : "save"}`),
            isSaved: (eventId) => this.saved.has(eventId),
            onClick: (eventId) => void this.toggleSaved(eventId),
        });
        this.injector.start();
        this.saved.subscribe(() => this.injector?.refresh());

        // Start as soon as someone is logged in, not only when a room header renders: reminders must
        // also work on the home page. `waitForClientStarted` exists from module API 2.4 on; older
        // Elements (1.12.33) get a poll.
        const api = this.api.client as { waitForClientStarted?: () => Promise<void> };
        void api.waitForClientStarted?.().then(() => this.start());
        this.startTimer = setInterval(() => {
            this.start();
            if (this.started && this.startTimer) clearInterval(this.startTimer);
        }, 2000);
    }

    /** Removes the buttons and listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.injector?.stop();
        this.reminders.detach();
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.startTimer) clearInterval(this.startTimer);
    }

    /** Attaches to the logged-in client once: reminders, the urgent push rule, scheduled messages. */
    private start(): void {
        const client = getSdkClient();
        if (!client || this.started === client) return;
        // Account data (whether the urgent rule was offered before) is only complete after the first sync.
        if (client.isInitialSyncComplete && !client.isInitialSyncComplete()) return;
        this.started = client;
        this.saved.attach();
        this.saved.subscribe(this.notify);
        try {
            this.settings = this.api.client.accountData.get(SETTINGS_TYPE);
            this.settings.watch(this.notify);
        } catch {
            // Not logged in after all; the next attempt tries again.
            this.started = undefined;
            return;
        }
        this.reminders.attach(client);
        ensureUrgentRule(client, !!this.getSettings().urgent_rule_offered)
            .then(async (added) => {
                if (added) await this.updateSettings({ urgent_rule_offered: true });
            })
            .catch((e) => console.warn(`${LOG} Adding the urgent push rule failed`, e));
        void supportsScheduling(client).then((ok) => {
            this.canSchedule = ok;
            if (!ok) return;
            void this.refreshScheduled();
            this.pollTimer = setInterval(() => void this.refreshScheduled(), POLL_MS);
        });
    }

    private async refreshScheduled(): Promise<ScheduledMessage[]> {
        const client = getSdkClient();
        if (!client || !this.canSchedule) return [];
        try {
            this.scheduled = await listScheduled(client);
            this.notify();
        } catch (e) {
            console.warn(`${LOG} Listing scheduled messages failed`, e);
        }
        return this.scheduled ?? [];
    }

    private openCompose(
        roomId: string | undefined,
        view: ComposerApiTarget | undefined,
        relation: { inReplyToEventId?: string; relType?: string } | undefined,
        opts: { startScheduled?: boolean; priority?: Priority },
    ): void {
        const client = getSdkClient();
        if (!client || !roomId) return;
        this.start();
        const threadId = view?.view === "thread" ? ((view as { threadId?: string }).threadId ?? null) : null;
        const composerView = view?.view === "thread" ? "thread" : "room";
        const me = client.getUserId();
        const members =
            client
                .getRoom(roomId)
                ?.getJoinedMembers()
                .filter((m) => m.userId !== me)
                .map((m) => ({ userId: m.userId, name: m.name })) ?? [];
        const submit = async ({ text, priority, sendAt, notify }: ComposeResult): Promise<void> => {
            let content: Record<string, unknown> = expandTags(roomId, { msgtype: "m.text", body: text });
            if (relation?.inReplyToEventId) content["m.relates_to"] = { "m.in_reply_to": { event_id: relation.inReplyToEventId } };
            content = withPriority(content as { body: string }, priority, (p) => this.t(`${P}${p}`));
            if (priority === "urgent") content = withUrgentMentions(content, notify ?? []);
            if (sendAt === undefined) await client.sendEvent(roomId, threadId, "m.room.message", content);
            else {
                try {
                    await scheduleMessage(client, roomId, content, sendAt, threadId);
                } catch (e) {
                    throw e instanceof ScheduleError ? new Error(this.t(`${P}no_crypto`)) : e;
                }
                void this.refreshScheduled();
            }
            void clearComposer(composerView);
        };
        this.api.openDialog<ComposeResult, ComposeDialogProps>({ title: this.t(`${P}compose_title`) }, ComposeDialog, {
            t: this.t,
            initialText: readComposer(composerView),
            initialPriority: opts.priority,
            startScheduled: !!opts.startScheduled,
            canSchedule: this.canSchedule,
            members,
            formatTime,
            submit,
        });
    }

    private openPraise(roomId: string | undefined): void {
        const client = getSdkClient();
        const room = roomId ? client?.getRoom(roomId) : null;
        if (!client || !room || !roomId) return;
        const me = client.getUserId();
        const members = room.getJoinedMembers().filter((m) => m.userId !== me).map((m) => ({ userId: m.userId, name: m.name }));
        const submit = async (praise: Praise): Promise<void> => {
            const content = praiseContent(
                praise,
                Object.fromEntries(members.map((m) => [m.userId, m.name])),
                (id: BadgeId) => this.t(`${P}badge_${id}`),
                this.t(`${P}praise_for`),
            );
            await client.sendEvent(roomId, "m.room.message", content);
        };
        this.api.openDialog<Praise, PraiseDialogProps>({ title: this.t(`${P}praise_title`) }, PraiseDialog, { t: this.t, members, submit });
    }

    private openSaved = (): void => {
        const client = getSdkClient();
        if (!client) return;
        this.api.openDialog<void, SavedDialogProps>({ title: this.t(`${P}saved_title`) }, SavedDialog, {
            t: this.t,
            refs: this.saved.list(),
            formatTime,
            load: (ref: SavedRef) => loadMessage(client, ref),
            open: (ref: SavedRef) => openEvent(ref.room_id, ref.event_id),
            remove: async (ref: SavedRef) => void (await this.saved.toggle(ref.room_id, ref.event_id)),
        });
    };

    private openScheduled = (roomId: string): void => {
        const client = getSdkClient();
        if (!client) return;
        this.api.openDialog<void, ScheduledDialogProps>({ title: this.t(`${P}scheduled_title`) }, ScheduledDialog, {
            t: this.t,
            roomId,
            roomName: (id) => client.getRoom(id)?.name ?? id,
            formatTime,
            list: () => this.refreshScheduled(),
            sendNow: (id) => sendScheduledNow(client, id),
            cancel: (id) => cancelScheduled(client, id),
        });
    };

    private async toggleSaved(eventId: string): Promise<void> {
        const client = getSdkClient();
        const roomId = client && findRoomOfEvent(client, eventId);
        if (!roomId) return;
        try {
            await this.saved.toggle(roomId, eventId);
        } catch (e) {
            console.warn(`${LOG} Saving the message failed`, e);
        }
    }

    private showReminder = (r: Reminder): void => {
        this.toasts = [...this.toasts.filter((x) => x.eventId !== r.eventId), { ...r }];
        this.renderToasts();
        // A system notification for reminders after the first; Element already notified for the first one.
        if (r.count > 1 && typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(this.t(`${P}reminder_title`, { sender: r.sender }), { body: r.text, tag: r.eventId, renotify: true } as NotificationOptions);
        }
    };

    private hideReminder = (eventId: string): void => {
        this.toasts = this.toasts.filter((x) => x.eventId !== eventId);
        this.renderToasts();
    };

    private renderToasts(): void {
        if (!this.toastRoot) {
            const el = document.createElement("div");
            el.id = "teamwork-toasts";
            document.body.appendChild(el);
            this.toastRoot = this.api.createRoot(el);
        }
        this.toastRoot.render(
            <UrgentToasts
                t={this.t}
                reminders={this.toasts}
                open={(r) => {
                    openEvent(r.roomId, r.eventId);
                    this.reminders.dismiss(r.eventId);
                }}
                dismiss={(r) => this.reminders.dismiss(r.eventId)}
                turnOff={() => {
                    void this.updateSettings({ reminders: false });
                    this.toasts.forEach((r) => this.reminders.dismiss(r.eventId));
                }}
            />,
        );
    }

    private getSettings(): Settings {
        const v = this.settings?.value;
        return v && typeof v === "object" ? (v as Settings) : {};
    }

    private async updateSettings(patch: Settings): Promise<void> {
        await this.api.client.accountData.set(SETTINGS_TYPE, { ...this.getSettings(), ...patch });
    }

    private names(roomId: string): Record<string, string> {
        const room = getSdkClient()?.getRoom(roomId);
        return new Proxy({} as Record<string, string>, {
            get: (_t, userId: string) => room?.getMember(userId)?.name ?? userId,
        });
    }

    private subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    };

    private notify = (): void => this.listeners.forEach((l) => l());

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables as Record<string, string>);
}

/** Expands @tags when the tag-mentions module of the suite is loaded (it registers on `window`). */
function expandTags(roomId: string, content: Record<string, unknown>): Record<string, unknown> {
    const suite = (window as unknown as { deDatanautenTeamsSuite?: Record<string, { expand?: unknown } | undefined> }).deDatanautenTeamsSuite;
    const expand = suite?.["tag-mentions"]?.expand;
    if (typeof expand !== "function") return content;
    try {
        return (expand as (r: string, c: Record<string, unknown>) => Record<string, unknown>)(roomId, content);
    } catch (e) {
        console.warn(`${LOG} Expanding tags failed; sending unchanged`, e);
        return content;
    }
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default TeamworkModule satisfies ModuleFactory;
