/**
 * Global keyboard handling: the "?" trigger and replaying custom shortcuts as Element's defaults.
 *
 * Element Web has no API for rebinding keys, so a custom shortcut is an alias: a capture-phase
 * listener on `window` (which runs before any of Element's listeners) swallows the custom combo
 * and dispatches a synthetic keydown with the default combo on the same target. Element's
 * handlers can't tell the difference, so the action runs exactly as if the default was pressed.
 */

import { comboToEventInit, matchesCombo, hasModifier, type KeyCombo } from "./keys";

export interface Alias {
    from: KeyCombo;
    to: KeyCombo;
}

export interface KeyboardControllerOptions {
    isMac: boolean;
    trigger: KeyCombo;
    /** Current aliases; called on every keydown so changes apply immediately. */
    getAliases(): Alias[];
    isOverlayOpen(): boolean;
    /** Whether the event target is inside the overlay (which handles its own keys). */
    isInOverlay(target: EventTarget | null): boolean;
    toggleOverlay(): void;
    closeOverlay(): void;
}

const synthetic = new WeakSet<Event>();

export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
    if (target instanceof HTMLInputElement) {
        return !["button", "checkbox", "radio", "range", "reset", "submit", "color", "file", "image"].includes(target.type);
    }
    return target.getAttribute("role") === "textbox";
}

function isElementDialogOpen(): boolean {
    return document.querySelector("#mx_Dialog_Container > *, #mx_Dialog_StaticContainer > *") !== null;
}

/**
 * A bare printable trigger such as "?" is matched on the character produced, ignoring Shift,
 * because which modifiers produce "?" depends on the keyboard layout.
 */
export function matchesTrigger(ev: KeyboardEvent, trigger: KeyCombo, isMac: boolean): boolean {
    if (!hasModifier(trigger) && trigger.key.length === 1) {
        return ev.key === trigger.key && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
    }
    return matchesCombo(ev, trigger, isMac);
}

export class KeyboardController {
    public constructor(private readonly options: KeyboardControllerOptions) {}

    public start(): void {
        window.addEventListener("keydown", this.onKeyDown, { capture: true });
    }

    public stop(): void {
        window.removeEventListener("keydown", this.onKeyDown, { capture: true });
    }

    private onKeyDown = (ev: KeyboardEvent): void => {
        if (synthetic.has(ev) || ev.isComposing || ev.defaultPrevented) return;
        const { options } = this;

        if (options.isOverlayOpen()) {
            // Keys typed inside the overlay (search box, shortcut recorder) are handled there.
            if (options.isInOverlay(ev.target)) return;
            if (ev.key === "Escape" || matchesTrigger(ev, options.trigger, options.isMac)) {
                swallow(ev);
                options.closeOverlay();
            }
            return;
        }

        if (
            matchesTrigger(ev, options.trigger, options.isMac) &&
            !isEditableTarget(ev.target) &&
            !isElementDialogOpen()
        ) {
            swallow(ev);
            options.toggleOverlay();
            return;
        }

        for (const alias of options.getAliases()) {
            if (matchesCombo(ev, alias.from, options.isMac)) {
                swallow(ev);
                replay(ev.target, alias.to, options.isMac);
                return;
            }
        }
    };
}

function swallow(ev: KeyboardEvent): void {
    ev.preventDefault();
    ev.stopImmediatePropagation();
}

function replay(target: EventTarget | null, combo: KeyCombo, isMac: boolean): void {
    const el = target instanceof Node && target.isConnected ? target : (document.activeElement ?? document.body);
    const event = new KeyboardEvent("keydown", comboToEventInit(combo, isMac));
    synthetic.add(event);
    el.dispatchEvent(event);
}
