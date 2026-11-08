import type { Api, Module, ModuleFactory, Watchable } from "@element-hq/element-web-module-api";
import type { Capability } from "matrix-widget-api";

import { APPROVALS_TYPE, classify, parseApprovals, pending, withApproval, withoutApproval } from "./capabilities";
import { getSdkClient, onViewedRoomChange, viewedRoomId } from "./client";
import { CONFIG_KEY, parseConfig, type UserAccountWidgetsConfig } from "./config";
import { P, translations, type ModuleTranslate } from "./i18n";
import { Panel } from "./panel";
import { ConsentDialog, type ConsentDialogProps, type ConsentResult } from "./ui/ConsentDialog";
import { ManageDialog, type ManageDialogProps } from "./ui/ManageDialog";
import { MyAppsButton } from "./ui/MyAppsButton";
import css from "./ui/styles.css?inline";
import { newWidgetId, parseUserWidgets, USER_WIDGETS_TYPE, withoutWidget, withWidget, type UserWidget } from "./widgets";

const LOG = "[user-account-widgets]";
const STYLE_ID = "de-datanauten-user-account-widgets-style";

export class UserAccountWidgetsModule implements Module {
    // 2.0.0 is the first release with `openDialog` and `client.accountData`.
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: UserAccountWidgetsConfig;
    private panel!: Panel;
    private widgets?: Watchable<unknown>;
    private approvals?: Watchable<unknown>;
    private stopRoomWatch?: () => void;
    /** One consent dialog at a time; a second widget waits for the first answer. */
    private consentQueue: Promise<unknown> = Promise.resolve();

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        this.config = parseConfig(this.api.config.get(CONFIG_KEY));
        if (typeof this.api.extras?.addRoomHeaderButtonCallback !== "function") {
            console.warn(`${LOG} this Element has no room header buttons; the module stays off`);
            return;
        }
        injectStyle();
        this.panel = new Panel({
            t: this.t as (key: string, vars?: Record<string, string>) => string,
            client: getSdkClient,
            approve: this.approve,
            manage: this.openManageDialog,
        });
        this.api.extras.addRoomHeaderButtonCallback(() => {
            // The header exists only once someone is logged in, which is when account data works.
            if (!this.start()) return undefined;
            return (
                <MyAppsButton
                    key="user-account-widgets"
                    t={this.t}
                    isOpen={() => this.panel.open}
                    subscribe={this.subscribe}
                    onClick={this.onButton}
                />
            );
        });
    }

    /** Removes the panel and listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.stopRoomWatch?.();
        this.widgets?.unwatch(this.onWidgets);
        this.panel?.dispose();
    }

    private start(): boolean {
        if (this.widgets) return true;
        if (!getSdkClient()) return false;
        try {
            this.widgets = this.api.client.accountData.get(USER_WIDGETS_TYPE);
            this.approvals = this.api.client.accountData.get(APPROVALS_TYPE);
        } catch (e) {
            console.warn(`${LOG} account data is not available yet`, e);
            return false;
        }
        this.widgets.watch(this.onWidgets);
        // Watching keeps the value current when another device changes it.
        this.approvals.watch(noop);
        this.panel.mount();
        this.onWidgets();
        this.stopRoomWatch = onViewedRoomChange(() => this.panel.setRoom(viewedRoomId()));
        this.panel.setRoom(viewedRoomId());
        return true;
    }

    private readonly onWidgets = (): void => this.panel.setWidgets(this.list());

    private list(): UserWidget[] {
        return parseUserWidgets(this.current(USER_WIDGETS_TYPE, this.widgets));
    }

    /**
     * Account data as the client has it now. Element's watchable copies the value when it is
     * created, which can be before the cached sync has delivered it; it is used for change events.
     */
    private current(type: string, watchable?: Watchable<unknown>): unknown {
        const fromClient = getSdkClient()?.getAccountData?.(type)?.getContent();
        return fromClient ?? watchable?.value;
    }

    private readonly subscribe = (cb: () => void): (() => void) => {
        const unsubscribe = this.panel.subscribe(cb);
        this.widgets?.watch(cb);
        return () => {
            unsubscribe();
            this.widgets?.unwatch(cb);
        };
    };

    private readonly onButton = (): void => {
        if (this.list().length === 0 && !this.panel.open) this.openManageDialog();
        else this.panel.toggle();
    };

    private readonly openManageDialog = (): void => {
        this.api.openDialog<void, ManageDialogProps>({ title: this.t("manage_title") }, ManageDialog, {
            t: this.t,
            widgets: () => this.list(),
            subscribe: this.subscribe,
            suggested: this.config.suggested,
            add: this.add,
            remove: this.remove,
            open: (id) => this.panel.show(id),
        });
    };

    private readonly add = async (name: string, url: string): Promise<string> => {
        const userId = getSdkClient()?.getUserId();
        if (!userId || !this.widgets) throw new Error("not logged in");
        const id = newWidgetId();
        await this.api.client.accountData.set(USER_WIDGETS_TYPE, withWidget(this.current(USER_WIDGETS_TYPE, this.widgets), userId, name, url, id));
        // Resolve once the echo is in, so the panel opens the new widget and not the first one.
        await until(this.widgets, () => this.list().some((w) => w.id === id));
        return id;
    };

    private readonly remove = async (id: string): Promise<void> => {
        if (!this.widgets) return;
        await this.api.client.accountData.set(USER_WIDGETS_TYPE, withoutWidget(this.current(USER_WIDGETS_TYPE, this.widgets), id));
        const approvals = this.current(APPROVALS_TYPE, this.approvals);
        if (parseApprovals(approvals)[id]) {
            await this.api.client.accountData.set(APPROVALS_TYPE, withoutApproval(approvals, id));
        }
    };

    private readonly approve = (widget: UserWidget, requested: Set<Capability>): Promise<Set<Capability>> => {
        const next = this.consentQueue.then(() => this.decide(widget, requested));
        this.consentQueue = next.catch(noop);
        return next;
    };

    private async decide(widget: UserWidget, requested: Set<Capability>): Promise<Set<Capability>> {
        const { auto, ask, unsupported } = classify(requested);
        if (unsupported.length) console.info(`${LOG} ${widget.name}: not offered here`, unsupported);
        const approval = parseApprovals(this.current(APPROVALS_TYPE, this.approvals))[widget.id];
        const open = pending(ask, widget.url, approval, this.config.approvePrefixes);
        const granted = new Set([...auto, ...ask.filter((c) => !open.includes(c))]);
        if (open.length === 0) return granted;

        const { finished } = this.api.openDialog<ConsentResult, ConsentDialogProps>(
            { title: this.t("consent_title", { name: widget.name }) },
            ConsentDialog,
            { t: this.t, url: widget.url, capabilities: open },
        );
        const { ok, model } = await finished;
        if (!ok || !model) return granted;
        for (const cap of model.approved) granted.add(cap);
        if (model.remember && model.approved.length) {
            await this.api.client.accountData
                .set(APPROVALS_TYPE, withApproval(this.current(APPROVALS_TYPE, this.approvals), widget.id, widget.url, model.approved))
                .catch((e) => console.warn(`${LOG} remembering the approval failed`, e));
        }
        return granted;
    }

    private t: ModuleTranslate = (key, vars) => this.api.i18n.translate(P + key, vars);
}

/** Resolves when the watchable's value satisfies `ok`, or after `timeoutMs` regardless. */
function until(watchable: Watchable<unknown>, ok: (value: unknown) => boolean, timeoutMs = 10_000): Promise<void> {
    if (ok(watchable.value)) return Promise.resolve();
    return new Promise((resolve) => {
        const done = (): void => {
            clearTimeout(timer);
            watchable.unwatch(check);
            resolve();
        };
        const check = (value: unknown): void => {
            if (ok(value)) done();
        };
        const timer = setTimeout(done, timeoutMs);
        watchable.watch(check);
    });
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

function noop(): void {}

export default UserAccountWidgetsModule satisfies ModuleFactory;
