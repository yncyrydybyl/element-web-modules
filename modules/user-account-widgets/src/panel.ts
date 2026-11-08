import type { SdkClient } from "./client";
import { isSameOriginAsElement, WidgetHost, type Approve } from "./host";
import type { UserWidget } from "./widgets";

const WIDTH_KEY = "de.datanauten.user_account_widgets.width";
const SELECTED_KEY = "de.datanauten.user_account_widgets.selected";
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 280;

export interface PanelDeps {
    t: (key: string, vars?: Record<string, string>) => string;
    client: () => SdkClient | undefined;
    approve: Approve;
    /** Opens the "My apps" dialog. */
    manage: () => void;
}

/**
 * The side panel: docked to the right edge of the window below the room header, over the
 * timeline. It shows one of the user's widgets for the room being viewed and starts it afresh
 * whenever the room changes, so a widget only ever sees one room.
 */
export class Panel {
    private readonly root: HTMLElement;
    private readonly select: HTMLSelectElement;
    private readonly body: HTMLElement;
    private widgets: UserWidget[] = [];
    private roomId: string | null = null;
    private isOpen = false;
    private selectedId: string | null = load(SELECTED_KEY);
    private host?: { key: string; host?: WidgetHost };
    private readonly listeners = new Set<() => void>();

    public constructor(private readonly deps: PanelDeps) {
        const { t } = deps;
        this.root = el("aside", "uaw-panel");
        this.root.setAttribute("aria-label", t("panel_label"));
        this.root.hidden = true;
        this.root.style.width = `${clampWidth(Number(load(WIDTH_KEY)) || DEFAULT_WIDTH)}px`;

        const handle = el("div", "uaw-resize");
        handle.setAttribute("role", "separator");
        handle.setAttribute("aria-orientation", "vertical");
        handle.addEventListener("pointerdown", this.onResizeStart);

        const header = el("div", "uaw-header");
        this.select = el("select", "uaw-select");
        this.select.setAttribute("aria-label", t("select_label"));
        this.select.addEventListener("change", () => this.show(this.select.value));
        const manage = iconButton("uaw-icon-button", t("manage"), GEAR);
        manage.addEventListener("click", () => deps.manage());
        const close = iconButton("uaw-icon-button", t("close"), CROSS);
        close.addEventListener("click", () => this.close());
        header.append(this.select, manage, close);

        this.body = el("div", "uaw-body");
        this.root.append(handle, header, this.body);
        window.addEventListener("resize", this.place);
    }

    /**
     * Element stacks its overlays as isolated containers after `#matrixchat`, in this order:
     * persisted widgets, dialogs, context menus. The panel gets a container of its own just before
     * them, so it covers the app but every dialog (including our consent prompt) and menu covers it.
     */
    public mount(): void {
        if (this.root.isConnected) return;
        const container = el("div");
        container.id = "uaw-container";
        container.style.isolation = "isolate";
        container.appendChild(this.root);
        const firstLayer = document.getElementById("mx_PersistedElement_container") ?? document.getElementById("mx_Dialog_StaticContainer");
        document.body.insertBefore(container, firstLayer);
    }

    public get open(): boolean {
        return this.isOpen;
    }

    public get selected(): UserWidget | undefined {
        return this.widgets.find((w) => w.id === this.selectedId) ?? this.widgets[0];
    }

    public subscribe(cb: () => void): () => void {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    public toggle(): void {
        if (this.isOpen) this.close();
        else this.show();
    }

    /** Opens the panel, with the given widget or the last one used. */
    public show(widgetId?: string): void {
        if (widgetId) {
            this.selectedId = widgetId;
            save(SELECTED_KEY, widgetId);
        }
        this.isOpen = true;
        this.render();
    }

    public close(): void {
        this.isOpen = false;
        this.render();
    }

    public setWidgets(widgets: UserWidget[]): void {
        this.widgets = widgets;
        this.render();
    }

    public setRoom(roomId: string | null): void {
        if (roomId === this.roomId) return;
        this.roomId = roomId;
        this.render();
    }

    public dispose(): void {
        this.stopHost();
        window.removeEventListener("resize", this.place);
        (this.root.parentElement ?? this.root).remove();
    }

    private render(): void {
        const visible = this.isOpen && this.roomId !== null;
        this.root.hidden = !visible;
        this.renderSelect();
        if (!visible) {
            this.stopHost();
        } else {
            this.place();
            this.renderBody();
        }
        for (const cb of this.listeners) cb();
    }

    private renderSelect(): void {
        const selected = this.selected;
        this.select.replaceChildren(
            ...this.widgets.map((w) => {
                const option = el("option");
                option.value = w.id;
                option.textContent = w.name;
                option.selected = w.id === selected?.id;
                return option;
            }),
        );
        this.select.hidden = this.widgets.length === 0;
    }

    private renderBody(): void {
        const widget = this.selected;
        const client = this.deps.client();
        if (!widget || !client || !this.roomId) {
            this.stopHost();
            this.message(this.deps.t("empty"), this.deps.t("add_app"), () => this.deps.manage());
            return;
        }
        const key = `${widget.id}\n${widget.url}\n${this.roomId}`;
        if (this.host?.key === key) return;
        this.stopHost();
        if (isSameOriginAsElement(widget.url)) {
            this.message(this.deps.t("same_origin", { url: widget.url }));
            this.host = { key };
            return;
        }
        this.body.replaceChildren();
        this.host = { key, host: new WidgetHost(widget, this.roomId, this.body, client, this.deps.approve) };
    }

    private message(text: string, action?: string, onAction?: () => void): void {
        const box = el("div", "uaw-message");
        const p = el("p");
        p.textContent = text;
        box.append(p);
        if (action && onAction) {
            const button = el("button", "uaw-button uaw-button--primary");
            button.type = "button";
            button.textContent = action;
            button.addEventListener("click", onAction);
            box.append(button);
        }
        this.body.replaceChildren(box);
    }

    private stopHost(): void {
        this.host?.host?.stop();
        this.host = undefined;
    }

    /** Below Element's room header, so the header buttons (ours included) stay reachable. */
    private readonly place = (): void => {
        const header = document.querySelector(".mx_RoomHeader");
        const top = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
        this.root.style.top = `${top}px`;
        this.root.style.width = `${clampWidth(parseFloat(this.root.style.width) || DEFAULT_WIDTH)}px`;
    };

    private readonly onResizeStart = (down: PointerEvent): void => {
        down.preventDefault();
        const startX = down.clientX;
        const startWidth = this.root.getBoundingClientRect().width;
        // The iframe would swallow pointer events while the pointer is over it.
        this.root.classList.add("uaw-panel--resizing");
        const move = (ev: PointerEvent): void => {
            this.root.style.width = `${clampWidth(startWidth + startX - ev.clientX)}px`;
        };
        const up = (): void => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            this.root.classList.remove("uaw-panel--resizing");
            save(WIDTH_KEY, String(Math.round(this.root.getBoundingClientRect().width)));
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };
}

function clampWidth(width: number): number {
    const max = Math.max(MIN_WIDTH, window.innerWidth - 240);
    return Math.min(max, Math.max(MIN_WIDTH, Math.round(width)));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
}

function iconButton(className: string, label: string, svg: string): HTMLButtonElement {
    const button = el("button", className);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = svg;
    return button;
}

function load(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function save(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Private mode or blocked storage: the panel just forgets.
    }
}

const GEAR =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M10.3 2h3.4l.5 2.6c.6.2 1.1.5 1.6.9l2.5-.9 1.7 3-2 1.7a6.6 6.6 0 0 1 0 1.8l2 1.7-1.7 3-2.5-.9c-.5.4-1 .7-1.6.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.1-.5-1.6-.9l-2.5.9-1.7-3 2-1.7a6.6 6.6 0 0 1 0-1.8l-2-1.7 1.7-3 2.5.9c.5-.4 1-.7 1.6-.9l.5-2.6Zm1.6 2-.4 2.2-.6.2c-.8.2-1.4.6-2 1.1l-.5.4-2.1-.7-.5.8 1.7 1.4-.1.7a4.6 4.6 0 0 0 0 1.4l.1.7-1.7 1.4.5.8 2.1-.7.5.4c.6.5 1.2.9 2 1.1l.6.2.4 2.2h.2l.4-2.2.6-.2c.8-.2 1.4-.6 2-1.1l.5-.4 2.1.7.5-.8-1.7-1.4.1-.7a4.6 4.6 0 0 0 0-1.4l-.1-.7 1.7-1.4-.5-.8-2.1.7-.5-.4c-.6-.5-1.2-.9-2-1.1l-.6-.2-.4-2.2h-.2Z"/></svg>';
const CROSS =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M6.3 6.3a1 1 0 0 1 1.4 0L12 10.6l4.3-4.3a1 1 0 1 1 1.4 1.4L13.4 12l4.3 4.3a1 1 0 0 1-1.4 1.4L12 13.4l-4.3 4.3a1 1 0 0 1-1.4-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 0-1.4Z"/></svg>';
