import { describe, expect, it, vi } from "vitest";

import {
    CLAIM_KEY,
    type Claim,
    dropPromoteMark,
    elect,
    freshClaim,
    type ElectionDeps,
    holdForLogin,
    PROMOTE_MARK,
    queueForPromotion,
    stealForTakeover,
} from "./election";

/** A Web Locks implementation for one exclusive lock name, with the semantics the election relies on. */
class FakeLocks {
    private holder: { release(): void; abort(e: Error): void } | null = null;
    private queue: Array<() => void> = [];

    public request(name: string, a: any, b?: any): Promise<unknown> {
        const opts = typeof a === "function" ? {} : a;
        const cb = (typeof a === "function" ? a : b) as (lock: unknown) => unknown;
        return new Promise((resolve, reject) => {
            const grant = (): void => {
                let released = false;
                const release = (): void => {
                    if (released) return;
                    released = true;
                    this.holder = null;
                    this.queue.shift()?.();
                };
                this.holder = {
                    release,
                    abort: (e) => {
                        released = true;
                        reject(e);
                    },
                };
                Promise.resolve(cb({ name })).then(
                    (v) => {
                        release();
                        resolve(v);
                    },
                    (e) => {
                        release();
                        reject(e);
                    },
                );
            };
            if (opts.steal) {
                const old = this.holder;
                this.holder = null;
                old?.abort(Object.assign(new Error("stolen"), { name: "AbortError" }));
                grant();
            } else if (!this.holder) grant();
            else if (opts.ifAvailable) {
                Promise.resolve(cb(null)).then(resolve, reject);
            } else this.queue.push(grant);
        });
    }

    /** Simulates the holder's tab closing. */
    public closeHolder(): void {
        this.holder?.release();
    }
}

class MemStorage implements Storage {
    private m = new Map<string, string>();
    public get length(): number {
        return this.m.size;
    }
    public clear(): void {
        this.m.clear();
    }
    public getItem(k: string): string | null {
        return this.m.get(k) ?? null;
    }
    public key(i: number): string | null {
        return [...this.m.keys()][i] ?? null;
    }
    public removeItem(k: string): void {
        this.m.delete(k);
    }
    public setItem(k: string, v: string): void {
        this.m.set(k, v);
    }
}

function tab(locks: FakeLocks, local: Storage, now = () => 1000): ElectionDeps {
    return { locks: locks as unknown as LockManager, local, session: new MemStorage(), now };
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe("elect", () => {
    it("makes the first tab the engine and resolves without waiting for the lock to be released", async () => {
        const locks = new FakeLocks();
        const r = await elect(tab(locks, new MemStorage()), "a", { onPromote: vi.fn(), onLockLost: vi.fn() });
        expect(r.role).toBe("engine");
    });

    it("makes later tabs mirrors", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        await elect(tab(locks, local), "a", { onPromote: vi.fn(), onLockLost: vi.fn() });
        const r = await elect(tab(locks, local), "b", { onPromote: vi.fn(), onLockLost: vi.fn() });
        expect(r.role).toBe("mirror");
    });

    it("promotes exactly one mirror when the engine closes, even with many waiting (no ping-pong)", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        await elect(tab(locks, local), "engine", { onPromote: vi.fn(), onLockLost: vi.fn() });
        const promoted: string[] = [];
        for (const id of ["m1", "m2", "m3", "m4"]) {
            const deps = tab(locks, local);
            const cb = { onPromote: (c: Claim) => promoted.push(c.tabId), onLockLost: vi.fn() };
            await elect(deps, id, cb);
            queueForPromotion(deps, id, cb);
        }
        locks.closeHolder();
        await tick();
        expect(promoted).toEqual(["m1"]);
        // m1 reloads: its lock is released while it is gone. Others get the lock but see the fresh claim.
        locks.closeHolder();
        await tick();
        expect(promoted).toEqual(["m1"]);
        const claim = JSON.parse(local.getItem(CLAIM_KEY)!) as Claim;
        expect(claim.tabId).toBe("m1");
    });

    it("lets the reloaded promoted tab take the lock back with steal", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        // Someone else got hold of the lock while m1 reloaded (e.g. a queued mirror before it saw the claim).
        const lostOther = vi.fn();
        await elect(tab(locks, local), "x", { onPromote: vi.fn(), onLockLost: lostOther });
        local.setItem(CLAIM_KEY, JSON.stringify({ tabId: "m1", until: 5000 }));
        const deps = tab(locks, local);
        deps.session.setItem(PROMOTE_MARK, "m1");
        const r = await elect(deps, "m1-reloaded", { onPromote: vi.fn(), onLockLost: vi.fn() });
        expect(r.role).toBe("engine");
        expect(r.claim?.tabId).toBe("m1");
        expect(deps.session.getItem(PROMOTE_MARK)).toBeNull();
        await tick();
        expect(lostOther).toHaveBeenCalled();
    });

    it("doesn't take the lock that is free only while a promoted tab reloads", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        local.setItem(CLAIM_KEY, JSON.stringify({ tabId: "m1", until: 5000 }));
        const r = await elect(tab(locks, local), "fresh", { onPromote: vi.fn(), onLockLost: vi.fn() });
        expect(r.role).toBe("mirror");
    });

    it("ignores a stale claim", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        local.setItem(CLAIM_KEY, JSON.stringify({ tabId: "m1", until: 500 }));
        const deps = tab(locks, local, () => 1000);
        deps.session.setItem(PROMOTE_MARK, "m1");
        const r = await elect(deps, "t", { onPromote: vi.fn(), onLockLost: vi.fn() });
        expect(r.role).toBe("engine");
        expect(r.claim).toBeUndefined();
    });

    it("fences an engine whose lock is stolen by a forced takeover", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        const lost = vi.fn();
        await elect(tab(locks, local), "engine", { onPromote: vi.fn(), onLockLost: lost });
        const promote = vi.fn();
        stealForTakeover(tab(locks, local), { tabId: "m", until: 5000 }, { onPromote: promote, onLockLost: vi.fn() });
        await tick();
        expect(lost).toHaveBeenCalledOnce();
        expect(promote).toHaveBeenCalledOnce();
    });

    it("after a logout, the login tab becomes the engine of the next session despite a void promotion", async () => {
        const locks = new FakeLocks();
        const local = new MemStorage();
        // Old engine A and mirror B; A reloads for the logout, B's queued request wins and B promotes.
        await elect(tab(locks, local), "a", { onPromote: vi.fn(), onLockLost: vi.fn() });
        const b = tab(locks, local);
        queueForPromotion(b, "b", { onPromote: vi.fn(), onLockLost: vi.fn() });
        locks.closeHolder();
        await tick();
        expect(local.getItem(CLAIM_KEY)).not.toBeNull();
        expect(b.session.getItem(PROMOTE_MARK)).toBe("b");

        // A comes back signed out and shows the login: it queues behind B, which reloads into "waiting".
        let held = false;
        void holdForLogin(tab(locks, local), { onPromote: vi.fn(), onLockLost: vi.fn() }).then(() => (held = true));
        await tick();
        expect(held).toBe(false);
        dropPromoteMark(b.session);
        locks.closeHolder();
        await tick();
        expect(held).toBe(true);
        expect(local.getItem(CLAIM_KEY)).toBeNull();

        // After the login B reloads with the session and no mark: it mirrors A.
        const r = await elect(b, "b2", { onPromote: vi.fn(), onLockLost: vi.fn() });
        expect(r.role).toBe("mirror");
    });

    it("caps a claim that claims to last too long (forged, or a clock jump)", () => {
        const local = new MemStorage();
        local.setItem(CLAIM_KEY, JSON.stringify({ tabId: "x", until: 1000 + 10 * 60_000 }));
        expect(freshClaim({ local, now: () => 1000 })!.until).toBe(1000 + 30_000);
        local.setItem(CLAIM_KEY, "not json");
        expect(freshClaim({ local, now: () => 1000 })).toBeNull();
    });
});
