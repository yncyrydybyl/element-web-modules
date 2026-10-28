import { useSyncExternalStore, type JSX } from "react";
import type { Root } from "react-dom/client";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { buildCatalog, CATEGORIES, SHOW_OVERLAY_ID, type Shortcut } from "./catalog";
import { CONFIG_KEY, parseConfig, type ExtraShortcut, type KeyboardShortcutsConfig } from "./config";
import { translations } from "./i18n";
import { KeyboardController, type Alias } from "./keyboard";
import { parseCombo, type KeyCombo, type Translate } from "./keys";
import { IS_ELECTRON, IS_MAC } from "./platform";
import { OverrideStore } from "./store";
import { Overlay, type Entry, type ModuleTranslate, type Section } from "./ui/Overlay";
import css from "./ui/overlay.css?inline";

const STYLE_ID = "de-datanauten-keyboard-shortcuts-style";

export class KeyboardShortcutsModule implements Module {
    // 2.0.0 is the first release with `client.accountData`, `settings` and `createRoot` as used here.
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: KeyboardShortcutsConfig;
    private trigger!: KeyCombo;
    private catalog: Shortcut[] = [];
    private store!: OverrideStore;
    private controller?: KeyboardController;
    private aliases: Alias[] = [];
    private container?: HTMLElement;
    private root?: Root;
    private restoreFocus?: HTMLElement | null;

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        try {
            this.config = parseConfig(this.api.config.get(CONFIG_KEY));
        } catch (e) {
            console.error(`[keyboard-shortcuts] Invalid "${CONFIG_KEY}" config`, e);
            throw new Error(`Errors in module configuration for the keyboard shortcuts module`);
        }
        this.trigger = parseCombo(this.config.trigger_key);
        this.api.i18n.register(translations);
        injectStyle();

        // Platform-dependent combos don't change at runtime, so the catalog for aliases is built once.
        this.catalog = buildCatalog({ isMac: IS_MAC, isElectron: IS_ELECTRON, ctrlEnterToSend: false });

        this.store = new OverrideStore(this.api);
        this.store.subscribe(() => this.updateAliases());
        this.updateAliases();
        this.store.start();

        this.controller = new KeyboardController({
            isMac: IS_MAC,
            trigger: this.trigger,
            getAliases: () => this.aliases,
            isOverlayOpen: () => this.root !== undefined,
            isInOverlay: (target) => target instanceof Node && Boolean(this.container?.contains(target)),
            toggleOverlay: () => (this.root ? this.close() : this.open()),
            closeOverlay: () => this.close(),
        });
        this.controller.start();
    }

    /** Removes all listeners. Element never unloads modules; this exists for tests and hot reload. */
    public dispose(): void {
        this.close();
        this.controller?.stop();
        this.store?.stop();
    }

    public open(): void {
        if (this.root) return;
        this.restoreFocus = document.activeElement as HTMLElement | null;
        this.container = document.createElement("div");
        this.container.className = "de-datanauten-keyboard-shortcuts";
        document.body.appendChild(this.container);
        // Keys typed in the overlay must not reach Element's document-level shortcut handlers.
        // React's own listener sits on this same node, so it still runs before propagation stops.
        this.container.addEventListener("keydown", (ev) => ev.stopPropagation());
        this.root = this.api.createRoot(this.container);
        this.root.render(<this.App />);
    }

    public close(): void {
        this.root?.unmount();
        this.container?.remove();
        this.root = undefined;
        this.container = undefined;
        this.restoreFocus?.focus?.();
    }

    private updateAliases(): void {
        if (!this.config.allow_customisation) {
            this.aliases = [];
            return;
        }
        const overrides = this.store.getAll();
        this.aliases = this.catalog
            .filter((s) => s.remappable && overrides[s.id])
            .map((s) => ({ from: parseCombo(overrides[s.id]), to: s.combo }));
    }

    private translateKey: Translate = (key, fallback) => {
        const result = this.api.i18n.translate(key);
        // Element returns the key itself when it doesn't know it (e.g. older Element versions).
        return result && result !== key ? result : fallback;
    };

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);

    private localise(text: ExtraShortcut["label"]): string {
        if (typeof text === "string") return text;
        const lang = this.api.i18n.language;
        return text[lang] ?? text[lang.split("-")[0]] ?? text.en ?? Object.values(text)[0] ?? "";
    }

    private showLabs(): boolean {
        const config = this.api.config.get() as { show_labs_settings?: boolean };
        return Boolean(config.show_labs_settings || this.api.settings?.getValue<boolean>("developerMode"));
    }

    /** What the overlay shows. Recomputed on each render so setting changes are picked up. */
    private buildView(): { sections: Section[]; entries: Entry[] } {
        const hiddenCategories = new Set(this.config.hidden_categories);
        if (!this.showLabs()) hiddenCategories.add("labs");
        const hiddenShortcuts = new Set(this.config.hidden_shortcuts);
        const overrides = this.store.getAll();
        const ctrlEnterToSend = Boolean(this.api.settings?.getValue<boolean>("MessageComposerInput.ctrlEnterToSend"));

        const builtIn: Entry[] = buildCatalog({ isMac: IS_MAC, isElectron: IS_ELECTRON, ctrlEnterToSend })
            .filter((s) => !hiddenShortcuts.has(s.id))
            .map((s) => ({
                id: s.id,
                category: s.category,
                label: this.translateKey(s.labelKey, s.fallback),
                combo: s.id === SHOW_OVERLAY_ID ? this.trigger : s.combo,
                custom: this.config.allow_customisation && s.remappable && overrides[s.id] ? parseCombo(overrides[s.id]) : undefined,
                remappable: s.remappable,
            }));

        const known = new Set(CATEGORIES.map((c) => c.id as string));
        const extras: Entry[] = this.config.extra_shortcuts.map((x, i) => {
            const label = this.localise(x.label);
            return {
                id: `extra:${x.id ?? label ?? i}`,
                category: x.category && known.has(x.category) ? x.category : "custom",
                label,
                combo: parseCombo(x.keys),
                remappable: false,
            };
        });

        const entries = [...builtIn, ...extras].filter((e) => !hiddenCategories.has(e.category));
        const sections = CATEGORIES.filter((c) => !hiddenCategories.has(c.id)).map((c) => ({
            id: c.id,
            label: this.translateKey(c.labelKey, c.fallback),
        }));
        return { sections, entries };
    }

    private App = (): JSX.Element => {
        // Re-render when the user's custom shortcuts change (here or on another device).
        useSyncExternalStore(
            (cb) => this.store.subscribe(cb),
            () => this.store.getAll(),
        );
        const { sections, entries } = this.buildView();
        return (
            <Overlay
                sections={sections}
                entries={entries}
                isMac={IS_MAC}
                trigger={this.trigger}
                allowCustomisation={this.config.allow_customisation}
                t={this.t}
                translateKey={this.translateKey}
                onSetCustom={(id, combo) => this.store.set(id, combo).catch(reportSaveError)}
                onResetAll={() => this.store.clear().catch(reportSaveError)}
                onClose={() => this.close()}
            />
        );
    };
}

function reportSaveError(e: unknown): void {
    console.error("[keyboard-shortcuts] Saving custom shortcuts to account data failed", e);
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default KeyboardShortcutsModule satisfies ModuleFactory;
