import { storedSession } from "./hooks";
import { showNotice } from "./toast";

/**
 * Logged out, several tabs open: one tab shows Element's login, the others wait behind a notice and follow
 * (reload) as soon as a session exists. Without this, every extra tab would show Element's "open in another
 * window" screen, and a second login there would create a second device in the same storage.
 *
 *   no session ──▶ login lock free? ──yes──▶ LOGIN tab: stock Element; holds the engine lock, and is the engine
 *                        │                         once signed in (no reload)
 *                        │ no
 *                        ▼
 *                  WAITING tab: notice; reloads when a session appears or the login tab closes
 */

export const LOGIN_LOCK = "de.datanauten.multi_tab.login";

/** Element is coming back from an SSO or OIDC login: it must run as usual to finish it. */
export function isLoginCallback(loc: Location): boolean {
    return /[?&#](loginToken|code)=/.test(loc.search + loc.hash);
}

export type LoginRole = "login" | "waiting";

export function claimLoginTab(locks: LockManager): Promise<LoginRole> {
    return new Promise((resolve) => {
        locks
            .request(LOGIN_LOCK, { ifAvailable: true }, (lock) => {
                if (!lock) {
                    resolve("waiting");
                    return undefined;
                }
                resolve("login");
                return new Promise<void>(() => {});
            })
            .catch(() => {});
    });
}

/**
 * Blocks this tab's Element start (the returned promise never settles) and reloads when there is something to do:
 * a session appeared (it will be elected engine or mirror), or the login tab went away (this one takes its place).
 */
export function waitForLogin(locks: LockManager, local: Storage): Promise<never> {
    showNotice("You're signed out. Sign in in your other Element tab: this tab will follow by itself.");
    const reload = (): void => location.reload();
    window.addEventListener("storage", (e) => {
        if (e.storageArea === local && storedSession(local)) setTimeout(reload, 500);
    });
    locks.request(LOGIN_LOCK, () => reload()).catch(() => {});
    return new Promise<never>(() => {});
}
