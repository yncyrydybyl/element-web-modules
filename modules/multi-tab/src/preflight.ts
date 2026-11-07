import { el, type StoredSession, storedSession } from "./hooks";

export type Preflight = { ok: true; session: StoredSession | null } | { ok: false; reason: string };

/**
 * Checks everything the module relies on before it patches anything. If one check fails the module stays off
 * and Element behaves exactly as without it (one log line says why).
 */
export function preflight(w: Window = window): Preflight {
    const nav = w.navigator as Navigator & { locks?: LockManager };
    if (!nav.locks || typeof nav.locks.request !== "function") return { ok: false, reason: "no Web Locks" };
    if (typeof (w as unknown as { BroadcastChannel?: unknown }).BroadcastChannel !== "function") return { ok: false, reason: "no BroadcastChannel" };
    if ((w as unknown as { electron?: unknown }).electron) {
        return { ok: false, reason: "Element Desktop runs a single instance already" };
    }

    const e = el();
    const peg = e.mxMatrixClientPeg;
    if (!peg || typeof peg.set !== "function" || typeof peg.get !== "function") {
        return { ok: false, reason: "window.mxMatrixClientPeg missing" };
    }
    const platform = e.mxPlatformPeg?.get();
    if (!platform || typeof platform.getSessionLock !== "function" || typeof platform.checkSessionLockFree !== "function") {
        return { ok: false, reason: "platform session lock missing" };
    }
    if (peg.get()) return { ok: false, reason: "client already created before the module loaded" };

    try {
        if (e.mxSettingsStore?.getValue("feature_simplified_sliding_sync")) {
            return { ok: false, reason: "sliding sync is on" };
        }
        if (e.mxSettingsStore?.getValue("lowBandwidth")) return { ok: false, reason: "low bandwidth mode is on" };
    } catch {
        // settings not readable yet: the defaults (both off) apply
    }

    let session: StoredSession | null = null;
    try {
        session = storedSession(w.localStorage);
    } catch {
        return { ok: false, reason: "localStorage unavailable" };
    }
    return { ok: true, session };
}

/**
 * Identifies one Element session on one device and build. Tabs only talk to tabs with the same fingerprint, so a
 * tab of another account, device, homeserver or build is never served by the engine. (A device id is never
 * reused across logins, so it also tells logins apart.)
 */
export function fingerprint(session: StoredSession, build: string): string {
    return [session.userId, session.deviceId, session.hsUrl.replace(/\/+$/, ""), build].join("\n");
}
