import type { Root } from "react-dom/client";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { translations } from "./i18n";
import { getSdkClient, joinedSpaces, type SdkClient } from "./space";
import { comboLabel, matchesCombo, parseCombo, type Combo } from "./trigger";
import css from "./ui/checker.css?inline";
import { CheckerOverlay, type ModuleTranslate } from "./ui/CheckerOverlay";

export const CONFIG_KEY = "de.datanauten.room_checker";
const STYLE_ID = "de-datanauten-room-checker-style";
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
        this.api.i18n.register(translations);
        injectStyle();
        window.addEventListener("keydown", this.onKeyDown, { capture: true });
    }

    /** Removes all listeners. Element never unloads modules; this exists for tests and hot reload. */
    public dispose(): void {
        this.close();
        window.removeEventListener("keydown", this.onKeyDown, { capture: true });
    }

    public isOpen(): boolean {
        return Boolean(this.root);
    }

    public open(): void {
        if (this.root) return;
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
                space={readStored(SPACE_STORAGE_KEY)}
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
