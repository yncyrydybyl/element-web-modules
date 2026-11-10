import type { JSX } from "react";
import type { Root } from "react-dom/client";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { HistoryStore } from "./history";
import { P, translations } from "./i18n";
import { checkRoom } from "./policies";
import { checkedRoom, effectiveRules, getSdkClient, joinedSpaces, readPolicies, type SdkClient } from "./space";
import { comboLabel, matchesCombo, parseCombo, type Combo } from "./trigger";
import css from "./ui/checker.css?inline";
import { CheckerOverlay, type ModuleTranslate } from "./ui/CheckerOverlay";

export const CONFIG_KEY = "de.datanauten.room_checker";
const STYLE_ID = "de-datanauten-room-checker-style";
/** Set while one copy is loaded: Element may list the module twice (config plus the image's /modules). */
const LOADED_KEY = "__deDatanautenRoomChecker";
const SPACE_STORAGE_KEY = "de.datanauten.room_checker.space";
/** Room state arrives in bursts while syncing: check again once it settles. */
const RECHECK_MS = 300;

export interface RoomCheckerConfig {
    /** Combo that opens and closes the checker. */
    trigger_key: string;
}

export function parseConfig(value: unknown): RoomCheckerConfig {
    const raw = (value ?? {}) as Partial<Record<keyof RoomCheckerConfig, unknown>>;
    if (typeof raw !== "object") throw new Error("expected an object");
    const config: RoomCheckerConfig = { trigger_key: "Alt+R" };
    if (raw.trigger_key !== undefined) {
        if (typeof raw.trigger_key !== "string") throw new Error("trigger_key must be a string");
        config.trigger_key = raw.trigger_key;
    }
    parseCombo(config.trigger_key);
    return config;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: Partial<RoomCheckerConfig>;
    }
}

export class RoomCheckerModule implements Module {
    public static readonly moduleApiVersion = "^2.0.0";

    private trigger!: Combo;
    private container?: HTMLElement;
    private root?: Root;
    private client?: SdkClient;
    private revision = 0;
    private recheckTimer?: ReturnType<typeof setTimeout>;
    private restoreFocus?: HTMLElement | null;
    private history?: HistoryStore;
    /** What to open on: from the room header. */
    private target?: { space: string; room: string };

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        let config: RoomCheckerConfig;
        try {
            config = parseConfig(this.api.config.get(CONFIG_KEY));
        } catch (e) {
            console.error(`[room-checker] Invalid "${CONFIG_KEY}" config`, e);
            throw new Error(`Errors in module configuration for the room checker module`);
        }
        this.trigger = parseCombo(config.trigger_key);
        const w = window as unknown as Record<string, unknown>;
        if (w[LOADED_KEY]) {
            console.warn("[room-checker] Loaded twice; the second copy does nothing");
            return;
        }
        w[LOADED_KEY] = this;
        this.api.i18n.register(translations);
        injectStyle();
        this.history = new HistoryStore(this.api);
        window.addEventListener("keydown", this.onKeyDown, { capture: true });
        // Alpha API: without it, there's just no room header badge.
        this.api.extras?.addRoomHeaderButtonCallback?.((roomId) => this.headerBadge(roomId));
    }

    /** Removes all listeners. Element never unloads modules; this exists for tests and hot reload. */
    public dispose(): void {
        this.close();
        window.removeEventListener("keydown", this.onKeyDown, { capture: true });
        const w = window as unknown as Record<string, unknown>;
        if (w[LOADED_KEY] === this) delete w[LOADED_KEY];
    }

    public isOpen(): boolean {
        return Boolean(this.root);
    }

    /** `target`: open on that room's details, in that space. */
    public open(target?: { space: string; room: string }): void {
        if (this.root) return;
        this.target = target;
        const client = getSdkClient();
        // Without Element's client there's no room state to check: the module API has none.
        if (!client?.getUserId?.()) {
            console.warn("[room-checker] Element's Matrix client isn't available");
            return;
        }
        this.client = client;
        client.on?.("RoomState.events", this.onStateEvent);
        this.restoreFocus = document.activeElement as HTMLElement | null;
        this.container = document.createElement("div");
        this.container.className = "de-datanauten-room-checker";
        document.body.appendChild(this.container);
        // Keys typed in the checker must not reach Element's document-level shortcut handlers.
        this.container.addEventListener("keydown", (ev) => ev.stopPropagation());
        this.root = this.api.createRoot(this.container);
        this.render();
    }

    public close(): void {
        if (!this.root) return;
        clearTimeout(this.recheckTimer);
        this.client?.removeListener?.("RoomState.events", this.onStateEvent);
        this.root.unmount();
        this.container?.remove();
        this.root = undefined;
        this.container = undefined;
        this.client = undefined;
        this.target = undefined;
        this.restoreFocus?.focus?.();
        this.restoreFocus = undefined;
    }

    private render(): void {
        const client = this.client;
        if (!this.root || !client) return;
        this.root.render(
            <CheckerOverlay
                client={client}
                spaces={joinedSpaces(client)}
                space={this.target?.space ?? readStored(SPACE_STORAGE_KEY)}
                room={this.target?.room}
                history={this.history}
                revision={this.revision}
                language={this.api.i18n.language}
                triggerLabel={comboLabel(this.trigger)}
                t={this.t}
                onSpaceChange={(id) => writeStored(SPACE_STORAGE_KEY, id)}
                onOpenRoom={(id) => this.openRoom(id)}
                onRoomSettings={(id) => this.openRoomSettings(id)}
                onClose={() => this.close()}
            />,
        );
    }

    /** Live: the checks run again when any room's state changes, a fix of ours included. */
    private onStateEvent = (): void => {
        clearTimeout(this.recheckTimer);
        this.recheckTimer = setTimeout(() => {
            this.revision++;
            this.render();
        }, RECHECK_MS);
    };

    /**
     * For admins only: a room that fails the policies of a space it's in (one you may change the
     * policies of) shows how many in its header. Nothing for everyone else, nor for rooms that pass.
     */
    private headerBadge(roomId: string): JSX.Element | undefined {
        try {
            const client = getSdkClient();
            const me = client?.getUserId?.();
            const room = client?.getRoom(roomId);
            if (!client || !me || !room || room.getMyMembership() !== "join" || room.isSpaceRoom()) return undefined;
            const spaces = joinedSpaces(client);
            for (const s of spaces) {
                const space = client.getRoom(s.id);
                const listed = space?.currentState.getStateEvents("m.space.child", roomId)?.getContent().via;
                if (!Array.isArray(listed) || !listed.length) continue;
                const rules = effectiveRules(client, s.id, spaces);
                if (!readPolicies(client, rules.source).canEdit) continue;
                const report = checkRoom(checkedRoom(room, s.id), rules.policies, rules.exceptions);
                const count = report.errors + report.warnings;
                if (!count) continue;
                const label = this.t(`${P}badge`, { count: String(count), space: s.name });
                return (
                    <button
                        type="button"
                        className={`rc-badge rc-badge--${report.errors ? "error" : "warning"}`}
                        aria-label={label}
                        title={label}
                        onClick={() => this.open({ space: s.id, room: roomId })}
                    >
                        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                            <path d="M8 1.5 2.5 3.5v4c0 3.3 2.3 6 5.5 7 3.2-1 5.5-3.7 5.5-7v-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <span>{count}</span>
                    </button>
                );
            }
        } catch (e) {
            console.warn("[room-checker] Room header badge failed", e);
        }
        return undefined;
    }

    private onKeyDown = (ev: KeyboardEvent): void => {
        if (ev.isComposing || ev.defaultPrevented || !matchesCombo(ev, this.trigger)) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (this.root) this.close();
        else this.open();
    };

    private openRoom(roomId: string): void {
        this.close();
        this.api.navigation.openRoom(roomId);
    }

    /** Element's room settings dialog: the module API can't open it, Element's dispatcher can. */
    private openRoomSettings(roomId: string): void {
        this.close();
        this.api.navigation.openRoom(roomId);
        const dis = (window as { mxDispatcher?: { dispatch(action: Record<string, unknown>): void } }).mxDispatcher;
        // After the room has opened; without the dispatcher, the room it is.
        setTimeout(() => dis?.dispatch({ action: "open_room_settings", room_id: roomId }), 0);
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);
}

function readStored(key: string): string | undefined {
    try {
        return localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
}

function writeStored(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Not remembering it is fine.
    }
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default RoomCheckerModule satisfies ModuleFactory;
