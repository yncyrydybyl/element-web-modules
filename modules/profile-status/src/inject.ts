/**
 * The places where the module API (2.3.0) has no extension point: the user menu, the user info
 * panel, member list tiles and sender names in the timeline. All of them are found by Element's
 * DOM (class names and test IDs of Element Web v1.12.33). If a selector stops matching, that spot
 * simply shows nothing; nothing else depends on it.
 */

import { findUserId } from "./client";

export const SEL = {
    /** The user menu is a Compound (Radix) menu in a portal; it's the menu that shows the user ID. */
    userMenu: '[role="menu"]',
    userMenuUserId: '[data-testid="userId"]',
    userMenuItem: '[role="menuitem"]',
    userMenuTrigger: ".mx_UserMenu button",
    userInfoProfile: ".mx_UserInfo_profile",
    userInfoMxid: ".mx_UserInfo_profile_mxid",
    memberTile: ".mx_MemberTileView",
    memberAvatar: ".mx_MemberTileView_avatar [title]",
    memberName: ".mx_MemberTileView_name .mx_DisambiguatedProfile",
    eventTile: ".mx_EventTile[data-event-id]",
    senderProfile: ".mx_DisambiguatedProfile",
    eventAvatar: ".mx_EventTile_avatar [title]",
    /** Element's own MSC4426 emoji (labs): when it's there, ours is not added. */
    elementStatus: ".mx_DisambiguatedProfile_userStatus",
} as const;

export const INLINE_CLASS = "ps-inline";

export interface InjectorHooks {
    /** Adds the module's entries to an open user menu. */
    userMenu(menu: HTMLElement, template: HTMLElement | null): void;
    /** The avatar button of the user menu (for one's own status dot). */
    userMenuTrigger(button: HTMLElement): void;
    /** A user info panel for `userId`; `anchor` is the element to insert after. */
    userInfo(profile: HTMLElement, anchor: HTMLElement, userId: string): void;
    /** A name next to which a status badge belongs. `roomEventId` is set for timeline senders. */
    inline(nameEl: HTMLElement, userId: string, roomEventId?: string): void;
}

/** One pass over the document: calls the hooks for every place that needs (re-)decorating. */
export function scan(root: ParentNode, hooks: InjectorHooks, opts: { timeline: boolean; memberList: boolean; eventSender?(eventId: string): string | undefined }): void {
    root.querySelectorAll<HTMLElement>(SEL.userMenu).forEach((menu) => {
        if (!menu.querySelector(SEL.userMenuUserId)) return;
        if (menu.querySelector(".ps-menu-item")) return;
        hooks.userMenu(menu, menu.querySelector<HTMLElement>(SEL.userMenuItem));
    });

    root.querySelectorAll<HTMLElement>(SEL.userMenuTrigger).forEach((b) => hooks.userMenuTrigger(b));

    root.querySelectorAll<HTMLElement>(SEL.userInfoProfile).forEach((profile) => {
        const mxid = profile.querySelector<HTMLElement>(SEL.userInfoMxid);
        const userId = findUserId(mxid?.textContent);
        if (mxid && userId) hooks.userInfo(profile, mxid, userId);
    });

    if (opts.memberList) {
        root.querySelectorAll<HTMLElement>(SEL.memberTile).forEach((tile) => {
            const name = tile.querySelector<HTMLElement>(SEL.memberName);
            const userId = findUserId(tile.querySelector(SEL.memberAvatar)?.getAttribute("title")) ?? findUserId(name?.getAttribute("title"));
            if (!name || dropIfElementShowsStatus(name)) return;
            if (userId) hooks.inline(name, userId);
        });
    }

    if (opts.timeline) {
        root.querySelectorAll<HTMLElement>(SEL.eventTile).forEach((tile) => {
            const name = tile.querySelector<HTMLElement>(SEL.senderProfile);
            if (!name || dropIfElementShowsStatus(name) || name.closest(".mx_ReplyTile")) return;
            const eventId = tile.getAttribute("data-event-id") ?? undefined;
            const userId = (eventId && opts.eventSender?.(eventId)) || findUserId(tile.querySelector(SEL.eventAvatar)?.getAttribute("title"));
            if (userId) hooks.inline(name, userId, eventId);
        });
    }
}

/**
 * Watches the DOM and runs `scan` at most once per animation frame. Element re-renders often;
 * hooks must therefore be idempotent (check for their own element before adding it).
 */
export class DomWatcher {
    private observer?: MutationObserver;
    private scheduled = false;

    public constructor(private readonly run: () => void) {}

    public start(): void {
        if (this.observer || typeof MutationObserver === "undefined") return;
        this.observer = new MutationObserver((records) => {
            // Our own insertions would otherwise trigger an endless loop of scans.
            if (records.every((r) => isOwn(r.target) && [...r.addedNodes].every(isOwn))) return;
            this.schedule();
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.schedule();
    }

    public stop(): void {
        this.observer?.disconnect();
        this.observer = undefined;
    }

    public schedule(): void {
        if (this.scheduled) return;
        this.scheduled = true;
        const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb: () => void) => setTimeout(cb, 16);
        raf(() => {
            this.scheduled = false;
            try {
                this.run();
            } catch (e) {
                console.warn("[profile-status] Decorating the page failed", e);
            }
        });
    }
}

/** Element's own MSC4426 emoji is there (it may appear after ours): remove ours. */
function dropIfElementShowsStatus(name: HTMLElement): boolean {
    if (!name.querySelector(SEL.elementStatus)) return false;
    name.querySelectorAll(`.${INLINE_CLASS}`).forEach((e) => e.remove());
    return true;
}

function isOwn(node: Node): boolean {
    const el = node instanceof Element ? node : node.parentElement;
    return !!el?.closest('[class^="ps-"], [class*=" ps-"]');
}
