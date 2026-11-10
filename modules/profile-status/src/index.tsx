import type { Api, Module, ModuleFactory, Watchable } from "@element-hq/element-web-module-api";
import type { Root } from "react-dom/client";

import { AutoReplier, SETTINGS_TYPE, type Settings } from "./autoReply";
import { CallWatcher, getElementCallStore } from "./callWatcher";
import { dmPartner, getSdkClient, hasProfileApi, type SdkClient } from "./client";
import { P, translations, type ModuleTranslate } from "./i18n";
import { DomWatcher, INLINE_CLASS, scan } from "./inject";
import { ProfileStore } from "./profileStore";
import {
    buildStatusContent,
    CALL_FIELD,
    CARD_FIELD_KEYS,
    CARD_FIELDS,
    inputFromStatus,
    parseStatus,
    present,
    STATUS_FIELD,
    StatusInputError,
    type CardField,
    type ProfileCard,
    type ProfileInfo,
} from "./status";
import { CardDialog, type CardDialogProps } from "./ui/CardDialog";
import { Badge, describe, formatDay } from "./ui/common";
import { DmHeaderChip } from "./ui/DmHeaderChip";
import { PersonDialog, PersonView, type PersonViewProps } from "./ui/PersonView";
import { SetStatusDialog, type SetStatusDialogProps, type SetStatusResult } from "./ui/SetStatusDialog";
import css from "./ui/styles.css?inline";

const LOG = "[profile-status]";
const STYLE_ID = "de-datanauten-profile-status-style";
export const CONFIG_KEY = "de.datanauten.profile_status";

/** `config.json` → `"de.datanauten.profile_status"`. Everything is optional. */
export interface ProfileStatusConfig {
    /** Profile card fields users may edit themselves; the rest are managed by the admin. Default: all. */
    editable_fields?: CardField[];
    /** Offer the out-of-office auto-reply (each user still has to turn it on). Default: true. */
    auto_reply?: boolean;
    /** Status badges next to sender names in the timeline. Default: true. */
    timeline?: boolean;
    /** Status badges in the member list. Default: true. */
    member_list?: boolean;
}

declare module "@element-hq/element-web-module-api" {
    interface Config {
        [CONFIG_KEY]?: ProfileStatusConfig;
    }
}

export class ProfileStatusModule implements Module {
    // 2.0.0 is the first release with `openDialog`, `extras` and `client.accountData`.
    public static readonly moduleApiVersion = "^2.0.0";

    public readonly store = new ProfileStore({ client: getSdkClient });
    private readonly calls: CallWatcher;
    private readonly replier: AutoReplier;
    private readonly dom = new DomWatcher(() => this.decorate());
    private readonly roots = new Map<HTMLElement, Root>();
    private started?: SdkClient;
    private startTimer?: ReturnType<typeof setInterval>;
    private expiryTimer?: ReturnType<typeof setTimeout>;
    private settings?: Watchable<unknown>;
    private config: ProfileStatusConfig = {};

    public constructor(private readonly api: Api) {
        this.calls = new CallWatcher({
            store: getElementCallStore,
            enabled: () => !this.elementOwnsStatus() && this.getSettings().call_status !== false && this.store.supported,
            write: (inCall) => this.writeCall(inCall),
        });
        this.replier = new AutoReplier({
            client: getSdkClient,
            settings: () => this.getSettings(),
            saveSettings: (patch) => this.updateSettings(patch),
            ooo: () => {
                const me = this.me();
                const p = me ? present(this.store.get(me), Date.now()) : undefined;
                return { active: p?.availability === "ooo", until: p?.oooUntil };
            },
            message: (until) => this.getSettings().auto_reply_text?.trim() || this.defaultReply(until),
            allowed: () => this.config.auto_reply !== false,
        });
    }

    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        injectStyle();
        this.config = readConfig(this.api);

        this.api.extras.addRoomHeaderButtonCallback((roomId) => {
            // The header exists only once someone is logged in, which is when the client is usable.
            this.start();
            const client = getSdkClient();
            const partner = client ? dmPartner(client, roomId) : undefined;
            return <DmHeaderChip key="profile-status" t={this.t} store={this.store} userId={partner} open={this.openPerson} />;
        });

        this.store.subscribe(this.onProfileChanged);
        this.dom.start();

        // `waitForClientStarted` exists from module API 2.4 on; older Elements (1.12.33) get a poll.
        const client = this.api.client as { waitForClientStarted?: () => Promise<void> };
        void client.waitForClientStarted?.().then(() => this.start());
        this.startTimer = setInterval(() => {
            this.start();
            // Element creates its CallStore listener during login; keep trying until it's there.
            if (this.started && this.calls.attach() && this.startTimer) clearInterval(this.startTimer);
        }, 2000);
    }

    /** Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.dom.stop();
        this.calls.detach();
        this.replier.detach();
        this.store.dispose();
        if (this.startTimer) clearInterval(this.startTimer);
        if (this.expiryTimer) clearTimeout(this.expiryTimer);
        this.roots.forEach((r) => r.unmount());
        this.roots.clear();
    }

    /** Attaches to the logged-in client once. */
    private start(): void {
        const client = getSdkClient();
        if (!client || this.started === client) return;
        if (client.isInitialSyncComplete && !client.isInitialSyncComplete()) return;
        if (!hasProfileApi(client)) {
            console.warn(`${LOG} This Element's matrix-js-sdk has no extended profile API; the module is off`);
            this.store.supported = false;
            this.started = client;
            return;
        }
        try {
            this.settings = this.api.client.accountData.get(SETTINGS_TYPE);
            this.settings.watch(() => this.dom.schedule());
        } catch {
            return; // not logged in after all; the next attempt tries again
        }
        this.started = client;
        void (async () => {
            const supported = (await client.doesServerSupportExtendedProfiles?.().catch(() => false)) ?? true;
            this.store.supported = supported;
            if (!supported) {
                console.info(`${LOG} The homeserver has no extended profiles (MSC4133); statuses are off`);
                return;
            }
            const me = client.getUserId();
            const mine = me ? await this.store.refresh(me) : undefined;
            this.calls.attach();
            await this.calls.cleanUp(mine?.callSince);
            this.replier.attach(client);
        })();
    }

    private me(): string | undefined {
        return getSdkClient()?.getUserId() ?? undefined;
    }

    /** Element's own MSC4426 implementation (labs flag `feature_user_status`) is active. */
    private elementOwnsStatus(): boolean {
        try {
            return this.api.settings?.getValue?.("feature_user_status") === true;
        } catch {
            return false;
        }
    }

    private onProfileChanged = (userId: string): void => {
        this.dom.schedule();
        if (userId === this.me()) this.scheduleExpiry();
    };

    /** Clears one's own status when its "clear after" time (or the out-of-office return day) is reached. */
    private scheduleExpiry(): void {
        if (this.expiryTimer) clearTimeout(this.expiryTimer);
        const me = this.me();
        const expires = me ? this.store.get(me)?.status?.expiresTs : undefined;
        if (!me || expires === undefined) return;
        const delay = Math.max(0, Math.min(expires - Date.now(), 2 ** 31 - 1));
        this.expiryTimer = setTimeout(() => void this.expireOwnStatus(me, expires), delay);
    }

    private async expireOwnStatus(me: string, expires: number): Promise<void> {
        if (Date.now() < expires) return this.scheduleExpiry();
        // Another device may have set a new status meanwhile; only delete the one that ran out.
        const fresh = await this.store.refresh(me);
        if (fresh?.status?.expiresTs !== expires) return;
        try {
            await this.deleteField(STATUS_FIELD);
            this.store.set(me, { ...fresh, status: undefined });
        } catch (e) {
            console.warn(`${LOG} Clearing the expired status failed`, e);
        }
    }

    // ----- Writing -----

    private client(): SdkClient {
        const client = getSdkClient();
        if (!client || !hasProfileApi(client)) throw new Error("Not logged in");
        return client;
    }

    private async deleteField(key: string): Promise<void> {
        try {
            await this.client().deleteExtendedProfileProperty!(key);
        } catch (e) {
            if ((e as { httpStatus?: number }).httpStatus !== 404) throw e;
        }
    }

    private async writeCall(inCall: boolean): Promise<void> {
        const me = this.me();
        if (inCall) await this.client().setExtendedProfileProperty!(CALL_FIELD, { call_joined_ts: Math.floor(Date.now() / 1000) });
        else await this.deleteField(CALL_FIELD);
        if (me) this.store.set(me, { ...this.ownInfo(), callSince: inCall ? Date.now() : undefined });
    }

    private ownInfo(): ProfileInfo {
        const me = this.me();
        return (me && this.store.get(me)) || { card: {} };
    }

    private saveStatus = async (r: SetStatusResult): Promise<void> => {
        const me = this.me();
        let content: Record<string, unknown> | null;
        try {
            content = buildStatusContent(r, { availability: (a) => this.t(`${P}avail_${a}`), oooBack: (date) => this.t(`${P}ooo_back`, { date: formatDay(date) }) }, new Date());
        } catch (e) {
            if (e instanceof StatusInputError) throw new Error(this.t(e.message === "past_date" ? `${P}past_date` : `${P}too_long`));
            throw e;
        }
        if (content) await this.client().setExtendedProfileProperty!(STATUS_FIELD, content);
        else await this.deleteField(STATUS_FIELD);
        if (me) this.store.set(me, { ...this.ownInfo(), status: content ? parseStatus(content) : undefined });

        const s = this.getSettings();
        const patch: Settings = {};
        if (!!s.auto_reply !== r.autoReply) patch.auto_reply = r.autoReply;
        if ((s.auto_reply_text ?? "") !== r.autoReplyText) patch.auto_reply_text = r.autoReplyText;
        if ((s.call_status !== false) !== r.callStatus) patch.call_status = r.callStatus;
        if (Object.keys(patch).length) await this.updateSettings(patch);
        // Turned off while in a call: take "In a call" down now.
        if (!r.callStatus && this.ownInfo().callSince && !this.elementOwnsStatus()) await this.writeCall(false);
    };

    private clearStatus = async (): Promise<void> => {
        await this.deleteField(STATUS_FIELD);
        const me = this.me();
        if (me) this.store.set(me, { ...this.ownInfo(), status: undefined });
    };

    private saveCard = async (card: ProfileCard): Promise<void> => {
        const client = this.client();
        for (const f of this.editableFields()) {
            const v = card[f]?.trim();
            if (v) await client.setExtendedProfileProperty!(CARD_FIELD_KEYS[f], v);
            else await this.deleteField(CARD_FIELD_KEYS[f]);
        }
        const me = this.me();
        if (me) await this.store.refresh(me);
    };

    // ----- Dialogs -----

    private openSetStatus = (): void => {
        this.start();
        const me = this.me();
        const info = me ? this.store.get(me) : undefined;
        const s = this.getSettings();
        const status = info?.status && present({ card: {}, status: info.status }, Date.now()) ? info.status : undefined;
        this.api.openDialog<SetStatusResult, SetStatusDialogProps>({ title: this.t(`${P}dialog_title`) }, SetStatusDialog, {
            t: this.t,
            initial: { ...inputFromStatus(status), autoReply: !!s.auto_reply, autoReplyText: s.auto_reply_text ?? "", callStatus: s.call_status !== false },
            canAutoReply: this.config.auto_reply !== false,
            canCallStatus: !!getElementCallStore() && !this.elementOwnsStatus(),
            supported: this.store.supported,
            defaultReply: (until) => this.defaultReply(until),
            submit: this.saveStatus,
            clear: this.clearStatus,
        });
        if (me) void this.store.refresh(me);
    };

    private openCard = async (): Promise<void> => {
        this.start();
        const me = this.me();
        const info = me ? await this.store.refresh(me) : undefined;
        this.api.openDialog<ProfileCard, CardDialogProps>({ title: this.t(`${P}card_title`) }, CardDialog, {
            t: this.t,
            initial: info?.card ?? {},
            editable: this.editableFields(),
            submit: this.saveCard,
        });
    };

    private openPerson = (userId: string): void => {
        const name = getSdkClient()?.getRooms?.().map((r) => r.getMember(userId)?.name).find(Boolean) ?? userId;
        this.api.openDialog<void, PersonViewProps>({ title: name }, PersonDialog, {
            t: this.t,
            store: this.store,
            userId,
        });
    };

    // ----- Decorating Element's DOM -----

    private decorate(): void {
        // Roots of panels Element has removed would keep their timers running.
        for (const [el, root] of this.roots) {
            if (!el.isConnected) {
                root.unmount();
                this.roots.delete(el);
            }
        }
        const client = getSdkClient();
        if (!client || !this.started || !this.store.supported) return;
        const elementOwns = this.elementOwnsStatus();
        scan(
            document,
            {
                userMenu: (menu, template) => this.decorateUserMenu(menu, template),
                userMenuTrigger: (button) => !elementOwns && this.decorateTrigger(button),
                userInfo: (profile, anchor, userId) => this.decorateUserInfo(profile, anchor, userId, elementOwns),
                inline: (name, userId, eventId) => this.decorateInline(client, name, userId, eventId),
            },
            {
                // With Element's own MSC4426 feature on, it draws the emoji next to names itself.
                timeline: this.config.timeline !== false && !elementOwns,
                memberList: this.config.member_list !== false && !elementOwns,
                eventSender: (eventId) => findEvent(client, eventId)?.getSender(),
            },
        );
    }

    private decorateUserMenu(menu: HTMLElement, template: HTMLElement | null): void {
        const me = this.me();
        const p = me ? present(this.store.request(me), Date.now()) : undefined;
        const dot = document.createElement("span");
        dot.className = "ps-menu-icon";
        const root = this.api.createRoot(dot);
        this.roots.set(dot, root);
        root.render(p ? <Badge p={p} t={this.t} /> : <span className="ps-dot ps-dot--none" />);
        const status = this.menuItem(template, p ? describe(p, this.t) : this.t(`${P}menu_set_status`), "ps-menu-item--status", dot, this.openSetStatus);
        const card = this.menuItem(template, this.t(`${P}menu_edit_card`), "ps-menu-item--card", CARD_ICON, () => void this.openCard());
        const anchor = template ?? menu.lastElementChild;
        if (anchor?.parentElement) {
            anchor.parentElement.insertBefore(status, anchor);
            anchor.parentElement.insertBefore(card, anchor);
        } else {
            menu.append(status, card);
        }
    }

    /**
     * An entry styled like the menu's own items: a copy of the first one (without its React
     * handlers, which `cloneNode` doesn't copy) with our label and icon, or a plain button if there is none.
     */
    private menuItem(template: HTMLElement | null, label: string, cls: string, icon: HTMLElement | string, onClick: () => void): HTMLElement {
        let item: HTMLElement;
        if (template) {
            item = template.cloneNode(true) as HTMLElement;
            const svg = item.querySelector("svg");
            if (svg && typeof icon === "string") svg.innerHTML = icon;
            else if (svg && typeof icon !== "string") svg.replaceWith(icon);
            item.querySelectorAll("svg ~ svg").forEach((s) => s.remove()); // a submenu chevron, if any
            const labelEl = [...item.querySelectorAll<HTMLElement>("span, div")].find((e) => e.children.length === 0 && e.textContent?.trim());
            if (labelEl) labelEl.textContent = label;
            else item.textContent = label;
            item.removeAttribute("id");
            item.removeAttribute("data-highlighted");
        } else {
            item = document.createElement("button");
            item.setAttribute("role", "menuitem");
            item.textContent = label;
        }
        item.classList.add("ps-menu-item", cls);
        item.setAttribute("data-testid", cls.replace("ps-menu-item--", "profile-status-menu-"));
        item.setAttribute("title", label);
        item.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            closeMenu(item);
            onClick();
        });
        return item;
    }

    private decorateTrigger(button: HTMLElement): void {
        const me = this.me();
        const p = me ? present(this.store.request(me), Date.now()) : undefined;
        let badge = button.querySelector<HTMLElement>(":scope > .ps-trigger-badge, .ps-trigger-badge");
        if (!p) {
            badge?.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "ps-trigger-badge";
            (button.firstElementChild ?? button).appendChild(badge);
        }
        renderInlineBadge(badge, p, this.t);
    }

    private decorateUserInfo(profile: HTMLElement, anchor: HTMLElement, userId: string, elementOwns: boolean): void {
        let host = profile.querySelector<HTMLElement>(":scope > .ps-userinfo") ?? profile.querySelector<HTMLElement>(".ps-userinfo");
        if (host?.dataset.userId === userId) return;
        if (!host) {
            host = document.createElement("div");
            host.className = "ps-userinfo";
            anchor.insertAdjacentElement("afterend", host);
        }
        host.dataset.userId = userId;
        let root = this.roots.get(host);
        if (!root) {
            root = this.api.createRoot(host);
            this.roots.set(host, root);
        }
        const self = userId === this.me();
        root.render(
            <PersonView
                key={userId}
                t={this.t}
                store={this.store}
                userId={userId}
                hideStatus={elementOwns}
                onEditStatus={self ? this.openSetStatus : undefined}
                onEditCard={self ? () => void this.openCard() : undefined}
            />,
        );
    }

    private decorateInline(client: SdkClient, name: HTMLElement, userId: string, eventId?: string): void {
        let badge = name.querySelector<HTMLElement>(`.${INLINE_CLASS}`);
        let p = present(this.store.request(userId), Date.now());
        // MSC4426: don't show a status in the timeline once the person has left the room.
        if (p && eventId) {
            const room = findEventRoom(client, eventId);
            const membership = room?.getMember(userId)?.membership;
            if (membership && membership !== "join") p = undefined;
        }
        if (!p) {
            badge?.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement("span");
            badge.className = INLINE_CLASS;
            const displayName = name.firstElementChild;
            if (displayName) displayName.insertAdjacentElement("afterend", badge);
            else name.appendChild(badge);
        }
        badge.dataset.userId = userId;
        renderInlineBadge(badge, p, this.t);
    }

    // ----- Settings & config -----

    private getSettings(): Settings {
        const v = this.settings?.value;
        return v && typeof v === "object" ? (v as Settings) : {};
    }

    private async updateSettings(patch: Settings): Promise<void> {
        await this.api.client.accountData.set(SETTINGS_TYPE, { ...this.getSettings(), ...patch });
    }

    private editableFields(): CardField[] {
        const e = this.config.editable_fields;
        return Array.isArray(e) ? CARD_FIELDS.filter((f) => e.includes(f)) : [...CARD_FIELDS];
    }

    private defaultReply(until?: string): string {
        return until ? this.t(`${P}auto_reply_default_until`, { date: formatDay(until) }) : this.t(`${P}auto_reply_default`);
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables as Record<string, string>);
}

/** An ID card (24×24, `currentColor`), for "Edit profile card". */
const CARD_ICON =
    '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v12h16V6H4Zm2 9.5c0-1.4 1.8-2.5 3-2.5s3 1.1 3 2.5V16H6v-.5ZM9 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5 1h4v2h-4V9Zm0 4h4v2h-4v-2Z"/>';

/** Plain DOM (no React root per name): the timeline and member list can show hundreds of these. */
export function renderInlineBadge(el: HTMLElement, p: NonNullable<ReturnType<typeof present>>, t: ModuleTranslate): void {
    const label = describe(p, t);
    const cls = p.availability ? `ps-dot ps-dot--${p.availability}` : "ps-emoji";
    const text = p.availability ? "" : p.emoji;
    let inner = el.firstElementChild as HTMLElement | null;
    if (!inner) {
        inner = document.createElement("span");
        inner.setAttribute("role", "img");
        inner.setAttribute("data-testid", "profile-status-badge");
        el.appendChild(inner);
    }
    if (inner.className !== cls) inner.className = cls;
    if (inner.textContent !== text) inner.textContent = text;
    if (inner.getAttribute("aria-label") !== label) {
        inner.setAttribute("aria-label", label);
        el.title = label;
    }
    el.dataset.availability = p.availability ?? "";
}

function findEvent(client: SdkClient, eventId: string): { getSender(): string | undefined } | undefined {
    return findEventRoom(client, eventId)?.findEventById?.(eventId);
}

function findEventRoom(client: SdkClient, eventId: string): ReturnType<SdkClient["getRoom"]> {
    const open = /^#\/room\/(![^/?]+)/.exec(window.location.hash)?.[1];
    const room = open ? client.getRoom(decodeURIComponent(open)) : null;
    if (room?.findEventById?.(eventId)) return room;
    return client.getRooms?.().find((r) => r.findEventById?.(eventId)) ?? null;
}

/** Radix menus close on Escape. */
function closeMenu(item: HTMLElement): void {
    const menu = item.closest<HTMLElement>('[role="menu"]');
    menu?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
}

function readConfig(api: Api): ProfileStatusConfig {
    try {
        const raw = (api.config.get() as unknown as Record<string, unknown>)[CONFIG_KEY];
        return raw && typeof raw === "object" ? (raw as ProfileStatusConfig) : {};
    } catch {
        return {};
    }
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default ProfileStatusModule satisfies ModuleFactory;
