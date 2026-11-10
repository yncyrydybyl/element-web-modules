import type { Api, Module, ModuleFactory, Watchable } from "@element-hq/element-web-module-api";

import { version } from "../package.json";
import {
    canOpenSettings,
    getSdkClient,
    getSecureStatus,
    joinSpace,
    membershipOf,
    openSettings,
    runSecureAction,
    type SdkClient,
    type SecureAction,
} from "./client";
import { CONFIG_KEY, parseConfig, type StepId, type WelcomeConfig } from "./config";
import { makeTranslate, P, translations, type ModuleTranslate } from "./i18n";
import { ACCOUNT_DATA_TYPE, mergeState, parseState, shouldAutoOpen, type WelcomeState } from "./state";
import { isSiblingLoaded, registerInSuite } from "./suite";
import { Guide, type GuideServices, type ProfileState, type SpaceState } from "./ui/Guide";
import css from "./ui/styles.css?inline";
import { UtdHint } from "./ui/UtdHint";
import { UserMenuInjector } from "./userMenu";
import { UtdWatcher } from "./utd";

/** On <html> while the guide is docked; on wide screens Element then makes room for it (styles.css). */
const DOCKED_CLASS = "twl-docked";
const LOG = "[teams-welcome]";
const STYLE_ID = "de-datanauten-teams-welcome-style";
/** The guide as a page: `#/teams-welcome`, e.g. for a link in the organisation's help pages. */
export const PAGE_PATH = "teams-welcome";
/** How long after the first sync the guide opens by itself, so Element's own first-run UI settles. */
const AUTO_OPEN_DELAY_MS = 1500;
const PROFILE_TTL_MS = 5000;

type Root = { render(node: React.ReactNode): void; unmount?(): void };

export class TeamsWelcomeModule implements Module {
    // 2.0.0 is the first release with `client.accountData` and `createRoot`; navigation and
    // settings are feature-checked.
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: WelcomeConfig;
    private t!: ModuleTranslate;
    private started?: SdkClient;
    private startTimer?: ReturnType<typeof setInterval>;
    private stateWatch?: Watchable<unknown>;
    private panelRoot?: Root;
    private panelOpen = false;
    private utdRoot?: Root;
    private readonly menu: UserMenuInjector;
    private readonly utd: UtdWatcher;
    private readonly roomIds = new Map<string, string>();
    private profileCache?: { at: number; userId: string; value: ProfileState };

    public constructor(private readonly api: Api) {
        this.menu = new UserMenuInjector({ label: () => this.t(`${P}menu_item`), onSelect: () => this.openPanel() });
        this.utd = new UtdWatcher(() => this.showUtdHint());
    }

    public async load(): Promise<void> {
        const raw = (this.api.config.get as (key: string) => unknown)(CONFIG_KEY);
        this.config = parseConfig(raw, (msg) => console.warn(`${LOG} config ${CONFIG_KEY}: ${msg}`));
        this.api.i18n.register(translations);
        this.t = makeTranslate((key, vars) => this.api.i18n.translate(key, vars as Record<string, string>), this.config.language);
        injectStyle();
        registerInSuite("teams-welcome", version);

        this.menu.start();
        const navigation = this.api.navigation as Partial<Api["navigation"]> | undefined;
        navigation?.registerLocationRenderer?.(PAGE_PATH, () => (
            <div className="twl-page-scroll">
                <Guide t={this.t} config={this.config} services={this.services} variant="page" />
            </div>
        ));

        // Start as soon as someone is logged in. `waitForClientStarted` exists from module API 2.4
        // on; older Elements (1.12.33 ships 2.3.0) get a poll, which also notices a later re-login.
        const client = this.api.client as { waitForClientStarted?: () => Promise<void> };
        void client.waitForClientStarted?.().then(() => this.start());
        this.startTimer = setInterval(() => this.start(), 2000);
    }

    /** Removes everything. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.menu.stop();
        this.utd.detach();
        if (this.startTimer) clearInterval(this.startTimer);
        this.stateWatch?.unwatch(this.onStateChange);
        this.panelRoot?.unmount?.();
        this.utdRoot?.unmount?.();
    }

    /** Attaches to the logged-in client once per login. */
    private start(): void {
        const client = getSdkClient();
        if (!client) {
            if (this.started) this.stop();
            return;
        }
        if (this.started === client) return;
        // Account data (whether the guide was dismissed) is only complete after the first sync.
        if (client.isInitialSyncComplete && !client.isInitialSyncComplete()) return;
        try {
            this.stateWatch?.unwatch(this.onStateChange);
            this.stateWatch = this.api.client.accountData.get(ACCOUNT_DATA_TYPE);
        } catch {
            return; // Not logged in after all; the next attempt tries again.
        }
        this.started = client;
        this.roomIds.clear();
        this.profileCache = undefined;
        this.stateWatch.watch(this.onStateChange);
        const state = this.state();
        if (this.config.utdHint && !state.utd_hint_off) this.utd.attach(client);
        if (shouldAutoOpen(state, this.config.autoOpen) && this.config.steps.length) {
            setTimeout(() => {
                if (this.started === client && shouldAutoOpen(this.state(), this.config.autoOpen)) this.openPanel();
            }, AUTO_OPEN_DELAY_MS);
        }
    }

    /** Logged out: close what's open. */
    private stop(): void {
        this.started = undefined;
        this.utd.detach();
        this.closePanel(false);
        this.hideUtdHint();
    }

    private onStateChange = (): void => {
        if (this.state().utd_hint_off) {
            this.utd.detach();
            this.hideUtdHint();
        }
    };

    private state(): WelcomeState {
        return parseState(this.stateWatch?.value);
    }

    private async saveState(patch: WelcomeState): Promise<void> {
        try {
            await this.api.client.accountData.set(ACCOUNT_DATA_TYPE, mergeState(this.stateWatch?.value, patch));
        } catch (e) {
            console.warn(`${LOG} Saving ${ACCOUNT_DATA_TYPE} failed`, e);
        }
    }

    public openPanel(step?: StepId): void {
        if (!this.config.steps.length || !getSdkClient()) return;
        this.hideUtdHint();
        this.panelRoot ??= this.api.createRoot(mountPoint("teams-welcome-root")) as Root;
        this.panelOpen = true;
        document.documentElement.classList.add(DOCKED_CLASS);
        this.panelRoot.render(
            <div className="twl-panel-frame">
                <Guide
                    // A new key per opening: start at the requested step with fresh checks.
                    key={Date.now()}
                    t={this.t}
                    config={this.config}
                    services={this.services}
                    variant="panel"
                    initialStep={step}
                    onClose={() => this.closePanel(true)}
                />
            </div>,
        );
    }

    private closePanel(remember: boolean): void {
        if (!this.panelOpen) return;
        this.panelOpen = false;
        document.documentElement.classList.remove(DOCKED_CLASS);
        this.panelRoot?.render(null);
        if (remember && !this.state().dismissed) void this.saveState({ dismissed: true, dismissed_at: Date.now() });
    }

    private showUtdHint(): void {
        const client = getSdkClient();
        // The open guide already explains it; try again with the next failure.
        if (!client || this.panelOpen || this.state().utd_hint_off) {
            this.utd.rearm();
            return;
        }
        this.utdRoot ??= this.api.createRoot(mountPoint("teams-welcome-utd-root")) as Root;
        this.utdRoot.render(
            <UtdHint
                t={this.t}
                loadStatus={() => getSecureStatus(client)}
                canAct={canOpenSettings()}
                act={(action: SecureAction) => {
                    this.hideUtdHint();
                    runSecureAction(action);
                }}
                learnMore={() => {
                    this.hideUtdHint();
                    this.openPanel(this.config.steps.includes("secure") ? "secure" : undefined);
                }}
                dismiss={() => this.hideUtdHint()}
                never={() => {
                    this.hideUtdHint();
                    void this.saveState({ utd_hint_off: true });
                }}
            />,
        );
    }

    private hideUtdHint(): void {
        this.utdRoot?.render(null);
    }

    private readonly services: GuideServices = {
        secureStatus: async () => {
            const client = getSdkClient();
            return client ? getSecureStatus(client) : {};
        },
        runSecure: (action) => void runSecureAction(action),
        canOpenSettings,
        openSettings: (tab) => void openSettings(tab),
        profile: () => this.profile(),
        notificationsOn: () => {
            const settings = this.api.settings as Partial<Api["settings"]> | undefined;
            let enabled: boolean | undefined;
            try {
                enabled = settings?.getValue?.<boolean>("notificationsEnabled");
            } catch {
                enabled = undefined;
            }
            const permission = typeof Notification === "undefined" ? "denied" : Notification.permission;
            return !!enabled && permission === "granted";
        },
        spaces: () => this.spaces(),
        joinSpace: async (alias) => {
            const client = getSdkClient();
            if (!client) throw new Error("not logged in");
            const roomId = await joinSpace(client, alias, this.config.joinSuggestedRooms);
            this.roomIds.set(alias, roomId);
        },
        openSpace: (space) => {
            const navigation = this.api.navigation as Partial<Api["navigation"]> | undefined;
            if (navigation?.openRoom) navigation.openRoom(space.roomId ?? space.alias);
            else window.location.hash = `#/room/${encodeURIComponent(space.roomId ?? space.alias)}`;
        },
        isLoaded: isSiblingLoaded,
    };

    private async profile(): Promise<ProfileState | undefined> {
        const client = getSdkClient();
        const userId = client?.getUserId();
        if (!client || !userId) return undefined;
        const cached = this.profileCache;
        if (cached && cached.userId === userId && Date.now() - cached.at < PROFILE_TTL_MS) return cached.value;
        const info = (await client.getProfileInfo?.(userId).catch(() => undefined)) ?? {};
        const localpart = userId.replace(/^@/, "").split(":")[0];
        const value: ProfileState = {
            userId,
            displayName: info.displayname,
            hasName: !!info.displayname && info.displayname !== localpart && info.displayname !== userId,
            hasAvatar: !!info.avatar_url,
        };
        this.profileCache = { at: Date.now(), userId, value };
        return value;
    }

    private async spaces(): Promise<SpaceState[]> {
        const client = getSdkClient();
        return Promise.all(
            this.config.spaces.map(async (s) => {
                let roomId = s.alias.startsWith("!") ? s.alias : this.roomIds.get(s.alias);
                if (!roomId && client?.getRoomIdForAlias) {
                    try {
                        roomId = (await client.getRoomIdForAlias(s.alias)).room_id;
                        this.roomIds.set(s.alias, roomId);
                    } catch {
                        // Unknown alias or offline: shown with its configured name; joining will say why.
                    }
                }
                const room = roomId ? client?.getRoom(roomId) : null;
                const membership = client ? membershipOf(client, roomId) : "none";
                return {
                    alias: s.alias,
                    roomId,
                    name: (membership === "join" && room?.name) || s.name || room?.name || s.alias,
                    description: s.description,
                    membership,
                };
            }),
        );
    }
}

/** Element's containers for dialogs and menus. They isolate their z-indexes, so DOM order decides. */
const ELEMENT_LAYERS = "#mx_Dialog_StaticContainer, #mx_Dialog_Container, #mx_ContextualMenu_Container";

/**
 * A fixed-position element that paints above Element's app but below its dialogs and menus: it goes
 * into <body> before their containers (Element creates them on first use, after this, otherwise).
 */
export function mountPoint(id: string): HTMLElement {
    const el = document.createElement("div");
    el.id = id;
    const layer = document.querySelector(ELEMENT_LAYERS);
    if (layer?.parentElement === document.body) document.body.insertBefore(el, layer);
    else document.body.appendChild(el);
    return el;
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default TeamsWelcomeModule satisfies ModuleFactory;
