/**
 * win311 enhancer: makes the Program Manager chrome interactive.
 *  - application title "Element – [<room>]" (via the --w-app-title custom property, drawn by shared.css)
 *  - an interactive menu bar (File / Options / Window / Help) over the static ::after fallback
 *  - the application control-menu box (system menu: Minimize, Close = back to the previous theme, Switch To…)
 *    double-click = Close, like Windows 3.1
 *  - Help ▸ About: a Win 3.1 "About" dialog
 * Everything lives in ctx.root; unmount() removes it all. Never throws into Element.
 */
import type { Enhancer, EnhancerContext } from "../../src/types";

type Item = { label: string; key?: string; disabled?: boolean; sep?: boolean; run?: () => void };

let ctx: EnhancerContext | null = null;
let bar: HTMLElement | null = null;
let ctlBox: HTMLElement | null = null;
let openMenu: HTMLElement | null = null;
let about: HTMLElement | null = null;
const cleanups: Array<() => void> = [];

function safe(fn: () => void): void {
    try {
        fn();
    } catch (e) {
        ctx?.log("win311 enhancer error", e);
    }
}

function dispatch(payload: Record<string, unknown>): void {
    const d = (window as unknown as { mxDispatcher?: { dispatch(p: unknown): void } }).mxDispatcher;
    d?.dispatch(payload);
}

function roomName(): string {
    const h = document.querySelector(".mx_RoomHeader .mx_RoomHeader_heading");
    const t = h?.textContent?.trim();
    if (t) return t;
    if (document.querySelector(".mx_HomePage")) return "Home";
    return "";
}

function updateTitle(): void {
    const n = roomName();
    const title = n ? `Element – [${n}]` : "Element";
    document.documentElement.style.setProperty("--w-app-title", JSON.stringify(title));
    // VGA Night City: DOS prompt with an 8.3 directory name, e.g. C:\ELEMENT\SHOWCASE>
    const dir = n.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const dos = dir ? `C:\\ELEMENT\\${dir.length > 8 ? dir.slice(0, 6) + "~1" : dir}>` : "C:\\ELEMENT>";
    document.documentElement.style.setProperty("--w-dos-prompt", JSON.stringify(dos));
}

function clickHeaderButton(label: string): void {
    const b = document.querySelector<HTMLElement>(`.mx_RoomHeader [aria-label="${label}"]`);
    b?.click();
}

function backToPreviousTheme(): void {
    if (!ctx) return;
    const prev = ctx.previousTheme();
    ctx.switchTheme(prev && !prev.startsWith("win311") ? prev : null);
}

function openSwitcher(): void {
    document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "T", code: "KeyT", altKey: true, shiftKey: true, bubbles: true }),
    );
}

function closeMenu(): void {
    openMenu?.remove();
    openMenu = null;
    bar?.querySelectorAll("[aria-expanded=true]").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function showMenu(anchor: HTMLElement, items: Item[]): void {
    closeMenu();
    const m = document.createElement("div");
    m.className = "w311-menu";
    m.setAttribute("role", "menu");
    for (const it of items) {
        if (it.sep) {
            const s = document.createElement("div");
            s.className = "w311-menu-sep";
            s.setAttribute("role", "separator");
            m.appendChild(s);
            continue;
        }
        const b = document.createElement("button");
        b.type = "button";
        b.className = "w311-menu-item";
        b.setAttribute("role", "menuitem");
        b.disabled = !!it.disabled;
        const l = document.createElement("span");
        l.innerHTML = it.label.replace(/&(.)/, "<u>$1</u>");
        b.appendChild(l);
        if (it.key) {
            const k = document.createElement("span");
            k.className = "w311-menu-key";
            k.textContent = it.key;
            b.appendChild(k);
        }
        b.addEventListener("click", () => {
            closeMenu();
            if (it.run) safe(it.run);
        });
        m.appendChild(b);
    }
    m.addEventListener("keydown", (e) => {
        const btns = [...m.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const i = btns.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === "ArrowDown") btns[(i + 1) % btns.length]?.focus();
        else if (e.key === "ArrowUp") btns[(i - 1 + btns.length) % btns.length]?.focus();
        else if (e.key === "Escape") {
            closeMenu();
            anchor.focus();
        } else return;
        e.preventDefault();
        e.stopPropagation();
    });
    const r = anchor.getBoundingClientRect();
    m.style.left = `${Math.round(r.left)}px`;
    m.style.top = `${Math.round(r.bottom)}px`;
    ctx?.root.appendChild(m);
    openMenu = m;
    anchor.setAttribute("aria-expanded", "true");
    m.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
}

function showAbout(): void {
    about?.remove();
    const d = document.createElement("div");
    d.className = "w311-about";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-label", "About Element");
    const variant = ctx?.variant.id ?? "win311";
    d.innerHTML = `
      <div class="w311-about-title"><span class="w311-about-ctl" aria-hidden="true"></span>About Element</div>
      <div class="w311-about-body">
        <img class="w311-about-icon" alt="" src="${ctx?.asset("assets/icon-group.svg") ?? ""}">
        <div class="w311-about-text">
          <p><b>Element for Workgroups</b><br>Version 3.11 (${variant})</p>
          <p>Copyright © 1992-2026 the Matrix.org community.<br>Theme by the datanauten Theme Lab.</p>
          <p>This product is licensed to:<br><b>You</b></p>
          <hr>
          <p>386 Enhanced Mode<br>Memory: 640 KB Free<br>System Resources: 85% Free</p>
        </div>
        <button type="button" class="w311-about-ok">OK</button>
      </div>`;
    const close = (): void => {
        d.remove();
        about = null;
    };
    d.querySelector("button")?.addEventListener("click", close);
    d.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || e.key === "Enter") {
            e.preventDefault();
            close();
        }
    });
    ctx?.root.appendChild(d);
    about = d;
    d.querySelector<HTMLButtonElement>("button")?.focus();
}

function menus(): Record<string, Item[]> {
    return {
        "&File": [
            { label: "&New Room…", run: () => dispatch({ action: "view_create_room" }) },
            { label: "&Properties…", key: "Alt+Enter", run: () => clickHeaderButton("Room info") },
            { label: "&Settings…", run: () => dispatch({ action: "view_user_settings" }) },
            { sep: true, label: "" },
            { label: "E&xit Windows…", run: backToPreviousTheme },
        ],
        "&Options": [
            { label: "&Change Theme…", key: "Alt+Shift+T", run: openSwitcher },
            { label: "&Auto Arrange", disabled: true },
            { label: "&Minimize on Use", disabled: true },
        ],
        "&Window": [
            { label: "&Threads", run: () => clickHeaderButton("Threads") },
            { label: "&Room Info", run: () => clickHeaderButton("Room info") },
            { sep: true, label: "" },
            { label: "&1 Rooms", run: () => document.querySelector<HTMLElement>(".mx_RoomListItemView")?.focus() },
            {
                label: `&2 ${roomName() || "Home"}`,
                run: () => document.querySelector<HTMLElement>(".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content")?.focus(),
            },
        ],
        "&Help": [
            { label: "&Contents", key: "F1", run: () => window.open("https://element.io/help", "_blank", "noopener") },
            { label: "&Keyboard", run: () => dispatch({ action: "view_user_settings", initialTabId: "USER_KEYBOARD_TAB" }) },
            { sep: true, label: "" },
            { label: "&About Element…", run: showAbout },
        ],
    };
}

function systemMenu(): Item[] {
    return [
        { label: "&Restore", disabled: true },
        { label: "&Move", disabled: true },
        { label: "&Size", disabled: true },
        { label: "Mi&nimize", disabled: true },
        { label: "Ma&ximize", disabled: true },
        { sep: true, label: "" },
        { label: "&Close", key: "Alt+F4", run: backToPreviousTheme },
        { sep: true, label: "" },
        { label: "S&witch To…", key: "Ctrl+Esc", run: openSwitcher },
    ];
}

function place(): void {
    const mc = document.querySelector<HTMLElement>(".mx_MatrixChat");
    if (!mc || !bar || !ctlBox) {
        if (bar) bar.style.display = "none";
        if (ctlBox) ctlBox.style.display = "none";
        return;
    }
    const r = mc.getBoundingClientRect();
    const titleH = 18;
    bar.style.display = "";
    ctlBox.style.display = "";
    // inside the 1px border: title bar 18px + 1px line, then the 20px menu bar
    bar.style.left = `${r.left + 1}px`;
    bar.style.top = `${r.top + 1 + titleH + 1}px`;
    bar.style.width = `${r.width - 2}px`;
    ctlBox.style.left = `${r.left + 1}px`;
    ctlBox.style.top = `${r.top + 1}px`;
}

const enhancer: Enhancer = {
    mount(c: EnhancerContext): void {
        safe(() => {
            ctx = c;
            const html = document.documentElement;
            html.setAttribute("data-w311-menus", "");

            bar = document.createElement("div");
            bar.className = "w311-menubar";
            bar.setAttribute("role", "menubar");
            bar.setAttribute("aria-label", "Program Manager menu");
            for (const [label, items] of Object.entries(menus())) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "w311-menubar-item";
                b.setAttribute("aria-haspopup", "menu");
                b.setAttribute("aria-expanded", "false");
                b.innerHTML = label.replace(/&(.)/, "<u>$1</u>");
                b.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (openMenu && b.getAttribute("aria-expanded") === "true") closeMenu();
                    else showMenu(b, menus()[label] ?? items);
                });
                b.addEventListener("mouseenter", () => {
                    if (openMenu && b.getAttribute("aria-expanded") !== "true") showMenu(b, menus()[label] ?? items);
                });
                bar.appendChild(b);
            }

            const cb = document.createElement("button");
            cb.type = "button";
            ctlBox = cb;
            ctlBox.className = "w311-ctlbox";
            ctlBox.setAttribute("aria-label", "Control menu (double-click: close)");
            ctlBox.setAttribute("aria-haspopup", "menu");
            let lastClick = 0;
            ctlBox.addEventListener("click", (e) => {
                e.stopPropagation();
                const now = Date.now();
                if (now - lastClick < 452) {
                    // DoubleClickSpeed=452 (WIN.INI default)
                    closeMenu();
                    backToPreviousTheme();
                    return;
                }
                lastClick = now;
                if (openMenu) closeMenu();
                else if (ctlBox) showMenu(ctlBox, systemMenu());
            });

            c.root.append(bar, ctlBox);
            place();
            updateTitle();

            const onDoc = (e: MouseEvent): void => {
                if (openMenu && !openMenu.contains(e.target as Node)) closeMenu();
            };
            const onKey = (e: KeyboardEvent): void => {
                if (e.key === "Escape" && openMenu) closeMenu();
            };
            document.addEventListener("mousedown", onDoc, true);
            document.addEventListener("keydown", onKey, true);
            window.addEventListener("resize", place);
            // scrollIntoView() of a timeline tile can scroll the (overflow:hidden) viewport by a few px — undo it
            const onScroll = (): void => {
                if (document.documentElement.scrollTop || document.documentElement.scrollLeft) window.scrollTo(0, 0);
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            cleanups.push(() => window.removeEventListener("scroll", onScroll));
            cleanups.push(() => document.removeEventListener("mousedown", onDoc, true));
            cleanups.push(() => document.removeEventListener("keydown", onKey, true));
            cleanups.push(() => window.removeEventListener("resize", place));

            // room changes → title; layout changes → menubar position (cheap: throttled to one rAF)
            let queued = false;
            const mo = new MutationObserver(() => {
                if (queued) return;
                queued = true;
                requestAnimationFrame(() => {
                    queued = false;
                    safe(() => {
                        updateTitle();
                        place();
                    });
                });
            });
            const titleEl = document.querySelector("title");
            if (titleEl) mo.observe(titleEl, { childList: true, characterData: true, subtree: true });
            const mx = document.getElementById("matrixchat");
            if (mx) mo.observe(mx, { childList: true, subtree: false });
            cleanups.push(() => mo.disconnect());
            const iv = window.setInterval(() => safe(() => {
                updateTitle();
                place();
            }), 1500);
            cleanups.push(() => window.clearInterval(iv));
        });
    },
    unmount(): void {
        safe(() => {
            closeMenu();
            for (const f of cleanups.splice(0)) safe(f);
            bar?.remove();
            ctlBox?.remove();
            about?.remove();
            bar = ctlBox = about = null;
            document.documentElement.removeAttribute("data-w311-menus");
            document.documentElement.style.removeProperty("--w-app-title");
            document.documentElement.style.removeProperty("--w-dos-prompt");
            ctx = null;
        });
    },
};

export default enhancer;
