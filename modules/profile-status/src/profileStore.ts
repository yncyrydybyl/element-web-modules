import { hasProfileApi, type SdkClient } from "./client";
import { parseProfile, type ProfileInfo } from "./status";

const LOG = "[profile-status]";

/** How old a cached profile may be before it is fetched again when someone looks at it. */
export const BACKGROUND_MAX_AGE = 2 * 60 * 1000;
/** For places where one person is in focus (DM header, user info). */
export const FOCUS_MAX_AGE = 30 * 1000;

interface Entry {
    info?: ProfileInfo;
    fetchedAt: number;
    queued?: boolean;
    pending?: Promise<ProfileInfo | undefined>;
}

interface Options {
    client(): SdkClient | undefined;
    now?(): number;
    concurrency?: number;
}

/**
 * Profiles of the people currently on screen. There is no push for profile fields without MSC4429
 * (sync filters are Element's, a module can't add to them), so profiles are fetched when someone is
 * shown and again when the cached copy is older than the caller allows. Fetches go through a small
 * queue that honours `429 retry_after_ms`, because Synapse limits profile lookups (`rc_profile`,
 * 1/s sustained by default).
 */
export class ProfileStore {
    private readonly entries = new Map<string, Entry>();
    private readonly listeners = new Set<(userId: string) => void>();
    private readonly queue: string[] = [];
    private running = 0;
    private pausedUntil = 0;
    private resumeTimer?: ReturnType<typeof setTimeout>;
    /** Turns false when the server can't do extended profiles; then nothing is fetched any more. */
    public supported = true;

    public constructor(private readonly opts: Options) {}

    private now(): number {
        return this.opts.now?.() ?? Date.now();
    }

    /** The cached profile, without fetching. */
    public get(userId: string): ProfileInfo | undefined {
        return this.entries.get(userId)?.info;
    }

    /** The cached profile; queues a fetch if there is none or it is older than `maxAge`. */
    public request(userId: string, maxAge = BACKGROUND_MAX_AGE): ProfileInfo | undefined {
        const e = this.entries.get(userId);
        if (!e || (!e.pending && !e.queued && this.now() - e.fetchedAt > maxAge)) this.enqueue(userId);
        return e?.info;
    }

    /** Fetches now (skipping the queue) and resolves with the fresh profile. */
    public refresh(userId: string): Promise<ProfileInfo | undefined> {
        const e = this.entries.get(userId);
        if (e?.pending) return e.pending;
        return this.load(userId);
    }

    /** Puts a value into the cache, e.g. right after the user changed their own status. */
    public set(userId: string, info: ProfileInfo): void {
        this.entries.set(userId, { ...this.entries.get(userId), info, fetchedAt: this.now() });
        this.emit(userId);
    }

    public subscribe(cb: (userId: string) => void): () => void {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    public dispose(): void {
        if (this.resumeTimer) clearTimeout(this.resumeTimer);
        this.queue.length = 0;
    }

    private emit(userId: string): void {
        this.listeners.forEach((l) => l(userId));
    }

    private enqueue(userId: string): void {
        if (!this.supported) return;
        const e = this.entries.get(userId) ?? { fetchedAt: 0 };
        e.queued = true;
        this.entries.set(userId, e);
        this.queue.push(userId);
        this.pump();
    }

    private pump(): void {
        const max = this.opts.concurrency ?? 3;
        const wait = this.pausedUntil - this.now();
        if (wait > 0) {
            if (!this.resumeTimer) {
                this.resumeTimer = setTimeout(() => {
                    this.resumeTimer = undefined;
                    this.pump();
                }, wait);
            }
            return;
        }
        while (this.running < max && this.queue.length) {
            const userId = this.queue.shift()!;
            const e = this.entries.get(userId);
            if (e) e.queued = false;
            this.running++;
            void this.load(userId).finally(() => {
                this.running--;
                this.pump();
            });
        }
    }

    private load(userId: string): Promise<ProfileInfo | undefined> {
        const client = this.opts.client();
        if (!client || !hasProfileApi(client) || !this.supported) return Promise.resolve(this.get(userId));
        const entry = this.entries.get(userId) ?? { fetchedAt: 0 };
        this.entries.set(userId, entry);
        const p = (async (): Promise<ProfileInfo | undefined> => {
            try {
                const raw = await client.getExtendedProfile!(userId);
                entry.info = parseProfile(raw);
            } catch (e) {
                const err = e as { httpStatus?: number; errcode?: string; data?: { retry_after_ms?: number }; message?: string };
                if (err.httpStatus === 404 || err.errcode === "M_NOT_FOUND") {
                    entry.info = parseProfile({});
                } else if (err.httpStatus === 429 || err.errcode === "M_LIMIT_EXCEEDED") {
                    this.pausedUntil = this.now() + (err.data?.retry_after_ms ?? 5000);
                    // Try again after the pause; the old value (if any) stays meanwhile.
                    entry.pending = undefined;
                    this.enqueue(userId);
                    return entry.info;
                } else if (/does not support extended profiles/i.test(err.message ?? "")) {
                    this.supported = false;
                    console.info(`${LOG} The homeserver has no extended profiles (MSC4133); statuses are off`);
                } else if (err.httpStatus === 403) {
                    // Not allowed to see this profile (limit_profile_requests_to_users_who_share_rooms).
                    entry.info = parseProfile({});
                } else {
                    console.warn(`${LOG} Fetching the profile of ${userId} failed`, e);
                }
            }
            entry.fetchedAt = this.now();
            entry.pending = undefined;
            this.emit(userId);
            return entry.info;
        })();
        entry.pending = p;
        return p;
    }
}
