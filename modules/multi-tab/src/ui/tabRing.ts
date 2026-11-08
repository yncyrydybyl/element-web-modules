import { injectStyle } from "./tabsSection";
import type { TabInfo } from "../tabs";

/**
 * A coloured ring around your avatar (top left), one colour per tab, while more than one Element tab is open:
 * so you can tell the tabs apart, and find this one in Settings → Preferences → Open tabs (same colour).
 *
 * Element 1.12's user menu is a shared component with generated class names; `.mx_UserMenu` is the stable hook
 * and the avatar inside it is matched by the start of its class name. Older Element has `.mx_UserMenu_userAvatar`.
 */

const AVATAR_SELECTORS = [".mx_UserMenu [class*='_avatarWrapper_']", ".mx_UserMenu [class*='_avatar_']", ".mx_UserMenu_userAvatar"];
const RING_ATTR = "data-mt-ring";
const REFRESH_MS = 5_000;
/** After a colour change, look again soon: a tab that opened at the same moment may have taken it too. */
const RECHECK_MS = 1_000;

interface Ring {
    colour: number;
    title: string;
}

export class TabRing {
    private observer?: MutationObserver;
    private avatar: HTMLElement | null = null;
    private ring: Ring | null = null;
    private timer?: ReturnType<typeof setTimeout>;

    public constructor(
        private readonly list: () => Promise<TabInfo[]>,
        /** Settles this tab's colour against the others' and returns it. */
        private readonly settle: (others: TabInfo[]) => number,
    ) {}

    public start(): void {
        injectStyle();
        this.observer = new MutationObserver(() => this.apply());
        this.observer.observe(document.body, { childList: true, subtree: true });
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") this.schedule(0);
        });
        this.schedule(0);
    }

    private schedule(ms: number): void {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void this.refresh(), ms);
    }

    private async refresh(): Promise<void> {
        // A background tab's ring isn't seen; it settles when the tab comes to the front.
        if (document.visibilityState !== "visible") return;
        let next = REFRESH_MS;
        try {
            const tabs = await this.list();
            const me = tabs.find((t) => t.isThis);
            const others = tabs.filter((t) => !t.isThis);
            const before = this.ring?.colour;
            const colour = this.settle(others);
            this.ring = others.length ? { colour, title: title(me, tabs.length) } : null;
            if (colour !== before) next = RECHECK_MS;
        } catch (e) {
            console.warn("[multi-tab] Couldn't list the open tabs", e);
        }
        this.apply();
        this.schedule(next);
    }

    /** Puts the ring on the avatar Element shows right now (React may have replaced it), or takes it off. */
    private apply(): void {
        const avatar = this.avatar?.isConnected ? this.avatar : findAvatar();
        if (!avatar) return;
        this.avatar = avatar;
        const want = this.ring ? String(this.ring.colour) : null;
        if (avatar.getAttribute(RING_ATTR) === want && (!this.ring || avatar.title === this.ring.title)) return;
        if (this.ring) {
            avatar.setAttribute(RING_ATTR, String(this.ring.colour));
            avatar.title = this.ring.title;
        } else {
            avatar.removeAttribute(RING_ATTR);
            avatar.removeAttribute("title");
        }
    }
}

function findAvatar(): HTMLElement | null {
    for (const selector of AVATAR_SELECTORS) {
        const found = document.querySelector<HTMLElement>(selector);
        if (found) return found;
    }
    return null;
}

function title(me: TabInfo | undefined, open: number): string {
    const which = me?.role === "engine" ? "This is the main tab" : "This tab gets everything through the main tab";
    return `${which}. ${open} Element tabs are open: Settings → Preferences → Open tabs`;
}
