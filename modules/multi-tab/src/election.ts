import { quietly } from "./util";

/**
 * Decides which tab is the engine, with a Web Lock that the browser releases when the holder closes or crashes.
 *
 *   load()                       granted at once? ──yes──▶ ENGINE (holds the lock until the tab dies)
 *     │                                │
 *     │                                no
 *     ▼                                ▼
 *   "promote" mark in            MIRROR, and (once the engine answered) queue for the lock
 *   sessionStorage?                    │ granted later (engine gone)
 *     │ yes                            ▼
 *     ▼                         fresh claim by another tab? ──yes──▶ release, queue again
 *   request with steal:true            │ no
 *   ──▶ ENGINE                         ▼
 *                               write claim + mark, keep holding, reload ──▶ (comes back via the mark)
 *
 * The claim stops the ping-pong where every queued mirror, granted the lock in turn while the promoted tab
 * reloads, would promote and reload as well. `steal` lets the reloaded tab take the lock back from whoever got
 * it in between.
 */

export const LOCK_NAME = "de.datanauten.multi_tab.engine";
export const CLAIM_KEY = "de.datanauten.multi_tab.claim";
export const PROMOTE_MARK = "de.datanauten.multi_tab.promote";
/** How long a promotion claim stays valid: the reload plus Element's start must fit in it. */
export const CLAIM_TTL_MS = 15_000;
/** No claim is valid longer than this (a takeover's is 30 s): a forged one or a clock jump can't block tabs for long. */
export const MAX_CLAIM_MS = 30_000;
/** How long a claim stays valid once the promoting page has unloaded for its reload. */
const RELOAD_GRACE_MS = 5_000;
/** How long a mirror waits before it queues again after stepping back for someone else's claim. */
const REQUEUE_DELAY_MS = 500;

export interface Claim {
    tabId: string;
    until: number;
    /** Element's session-lock owner id of the engine that went away, see `clearDeadEngineLock`. */
    deadOwner?: string;
}

export interface ElectionDeps {
    locks: LockManager;
    local: Storage;
    session: Storage;
    now(): number;
}

export interface Election {
    role: "engine" | "mirror";
    /** For a reloaded promotion: the claim it was promoted under. */
    claim?: Claim;
}

export interface ElectionCallbacks {
    /** A mirror won the lock: it must become the engine (the caller reloads the page). */
    onPromote(claim: Claim): void;
    /** The engine lost its lock (stolen by a forced takeover): it must stop at once. */
    onLockLost(): void;
}

function readClaim(local: Storage): Claim | null {
    return quietly(() => {
        const raw = local.getItem(CLAIM_KEY);
        return raw ? (JSON.parse(raw) as Claim) : null;
    }, null);
}

export function freshClaim(deps: Pick<ElectionDeps, "local" | "now">, notTab?: string): Claim | null {
    const claim = readClaim(deps.local);
    const now = deps.now();
    if (!claim || typeof claim.until !== "number" || claim.until < now || claim.tabId === notTab) return null;
    return { ...claim, until: Math.min(claim.until, now + MAX_CLAIM_MS) };
}

/**
 * Requests the lock and keeps it until the page goes away. Resolves as soon as the role is known; never awaits
 * the lock request itself, whose promise only settles when the lock is released.
 */
export function elect(deps: ElectionDeps, tabId: string, cb: ElectionCallbacks): Promise<Election> {
    let promoted: Claim | undefined;
    try {
        const mark = deps.session.getItem(PROMOTE_MARK);
        deps.session.removeItem(PROMOTE_MARK);
        const claim = mark ? readClaim(deps.local) : null;
        if (claim && claim.tabId === mark && claim.until >= deps.now()) promoted = claim;
    } catch {
        // sessionStorage unavailable: elect normally
    }

    return new Promise<Election>((resolve) => {
        const holdAsEngine = (claim?: Claim): Promise<void> => {
            resolve({ role: "engine", claim });
            return new Promise<void>(() => {});
        };
        const onRequestEnd = (e: unknown): void => {
            // A held lock's request only ends when someone steals it.
            if ((e as Error)?.name === "AbortError") cb.onLockLost();
        };

        if (promoted) {
            const claim = promoted;
            deps.locks.request(LOCK_NAME, { steal: true }, () => holdAsEngine(claim)).catch(onRequestEnd);
            return;
        }

        deps.locks
            .request(LOCK_NAME, { ifAvailable: true }, (lock) => {
                // Free only because a promoted tab is reloading: leave it to that tab.
                if (lock && !freshClaim(deps, tabId)) return holdAsEngine();
                resolve({ role: "mirror" });
                return undefined;
            })
            .catch(onRequestEnd);
    });
}

/**
 * A mirror waits in the queue for the lock, to become the engine when the current one goes away. Called once the
 * mirror knows it is compatible with the running engine (same session and build).
 */
export function queueForPromotion(deps: ElectionDeps, tabId: string, cb: ElectionCallbacks): void {
    deps.locks
        .request(LOCK_NAME, () => {
            if (freshClaim(deps, tabId)) {
                // Someone else is already becoming the engine. Step back and wait in the queue again.
                setTimeout(() => queueForPromotion(deps, tabId, cb), REQUEUE_DELAY_MS);
                return undefined;
            }
            const claim: Claim = { tabId, until: deps.now() + CLAIM_TTL_MS };
            return promoteHolding(deps, claim, cb);
        })
        .catch(() => {});
}

/** Writes the claim and the mark, then hands over to the caller (who reloads) while still holding the lock. */
function promoteHolding(deps: ElectionDeps, claim: Claim, cb: ElectionCallbacks): Promise<void> {
    try {
        deps.local.setItem(CLAIM_KEY, JSON.stringify(claim));
        deps.session.setItem(PROMOTE_MARK, claim.tabId);
    } catch (e) {
        console.warn("[multi-tab] Can't store the promotion claim", e);
    }
    cb.onPromote(claim);
    return new Promise<void>(() => {});
}

/**
 * Forced takeover from an engine that holds the lock but no longer answers (frozen tab). The engine notices the
 * theft (its request rejects with AbortError) and stops before it syncs again.
 */
export function stealForTakeover(deps: ElectionDeps, claim: Claim, cb: ElectionCallbacks): void {
    deps.locks.request(LOCK_NAME, { steal: true }, () => promoteHolding(deps, claim, cb)).catch(() => {});
}

/**
 * Signed out, this tab shows the login: it becomes the engine after the login, whatever happened to the lock
 * during the logout. There is no session, so no engine can be running; a promotion that a mirror started while
 * everyone reloaded for the logout is void (its claim and mark are dropped). The lock is queued for, not taken
 * with `ifAvailable`: the old engine may still hold it for a few seconds while Element deletes its stores.
 * Resolves once this tab holds the lock.
 */
export function holdForLogin(deps: ElectionDeps, cb: ElectionCallbacks): Promise<void> {
    const dropClaim = (): void => quietly(() => deps.local.removeItem(CLAIM_KEY), undefined);
    dropClaim();
    return new Promise<void>((resolve) => {
        deps.locks
            .request(LOCK_NAME, () => {
                dropClaim();
                resolve();
                return new Promise<void>(() => {});
            })
            .catch((e: unknown) => {
                if ((e as Error)?.name === "AbortError") cb.onLockLost();
            });
    });
}

/** A signed-out tab must not come back as the engine of the next session through a mark left by a void promotion. */
export function dropPromoteMark(session: Storage): void {
    quietly(() => session.removeItem(PROMOTE_MARK), undefined);
}

/**
 * A promoting tab that is closed instead of reloading must not leave its claim behind, or every tab opened in the
 * next seconds would wait for an engine that never comes.
 */
export function dropClaimUnlessReloading(local: Storage, tabId: string, reloading: () => boolean): void {
    window.addEventListener("pagehide", () => {
        if (!reloading()) return clearClaim(local, tabId);
        // Reloading: the new page asks for the lock within a second or two. If the tab is closed instead,
        // the claim must not hold others up for long.
        const claim = readClaim(local);
        if (claim?.tabId === tabId) {
            claim.until = Math.min(claim.until, Date.now() + RELOAD_GRACE_MS);
            quietly(() => local.setItem(CLAIM_KEY, JSON.stringify(claim)), undefined);
        }
    });
}

export function clearClaim(local: Storage, tabId: string): void {
    if (readClaim(local)?.tabId === tabId) quietly(() => local.removeItem(CLAIM_KEY), undefined);
}
