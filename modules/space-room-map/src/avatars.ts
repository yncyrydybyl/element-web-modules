/**
 * Avatar thumbnails as `blob:` URLs, for the result list and the map's WebGL textures.
 *
 * Matrix 1.11 media needs the access token in a header, which an `<img>` or a texture load can't
 * send. Element's service worker adds it to Element's own requests, but Element doesn't always use
 * those endpoints, and the worker isn't always there. So the module fetches thumbnails itself:
 * the authenticated endpoint first, the legacy one if that fails. Element's CSP allows `blob:` images.
 */

export interface AvatarClient {
    mxcUrlToHttp?(
        mxcUrl: string,
        width?: number,
        height?: number,
        resizeMethod?: string,
        allowDirectLinks?: boolean,
        allowRedirects?: boolean,
        useAuthentication?: boolean,
    ): string | null;
    getAccessToken?(): string | null;
}

/** Cache Storage bucket for avatars kept between sessions (see `persist`). */
export const PERSIST_CACHE = "de.datanauten.space_room_map.avatars";

/** Enough for a 48 px circle on a 2x screen. */
const SIZE = 96;
const CONCURRENCY = 6;
/** Arrivals are announced together, so 3,000 avatars don't mean 3,000 repaints. */
const NOTIFY_MS = 100;

export class AvatarCache {
    private readonly urls = new Map<string, string>();
    private readonly colours = new Map<string, string>();
    /** Requested, loading or failed: either way not to be fetched again. */
    private readonly seen = new Set<string>();
    private readonly queue: string[] = [];
    private readonly listeners = new Set<() => void>();
    private running = 0;
    private version = 0;
    private notifyTimer?: ReturnType<typeof setTimeout>;
    private disposed = false;

    /** `persist`: whether thumbnails are kept in Cache Storage, so a reload doesn't fetch them again. */
    public constructor(
        private readonly client: AvatarClient,
        private readonly persist: () => boolean = () => false,
    ) {}

    /** Deletes the avatars kept between sessions. */
    public static async clearPersisted(): Promise<void> {
        try {
            await globalThis.caches?.delete(PERSIST_CACHE);
        } catch {
            // Nothing stored, or storage blocked.
        }
    }

    /** The `blob:` URL of a loaded avatar. */
    public get(mxc: string | undefined): string | undefined {
        return mxc ? this.urls.get(mxc) : undefined;
    }

    /** The avatar's average colour, as `rgb()`, to tint its space's circle. */
    public colour(mxc: string | undefined): string | undefined {
        return mxc ? this.colours.get(mxc) : undefined;
    }

    /** Queues avatars to load, in order: earlier ones are fetched first. */
    public request(mxcs: Iterable<string | undefined>): void {
        for (const mxc of mxcs) {
            if (!mxc?.startsWith("mxc://") || this.seen.has(mxc)) continue;
            this.seen.add(mxc);
            this.queue.push(mxc);
        }
        this.pump();
    }

    /** Changes whenever avatars have arrived (for `useSyncExternalStore`). */
    public getVersion = (): number => this.version;

    public subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    };

    public dispose(): void {
        this.disposed = true;
        clearTimeout(this.notifyTimer);
        for (const url of this.urls.values()) URL.revokeObjectURL(url);
        this.urls.clear();
        this.colours.clear();
        this.queue.length = 0;
    }

    private pump(): void {
        while (this.running < CONCURRENCY && this.queue.length) {
            const mxc = this.queue.shift()!;
            this.running++;
            void this.load(mxc).finally(() => {
                this.running--;
                this.pump();
            });
        }
    }

    private async load(mxc: string): Promise<void> {
        const stored = await this.readPersisted(mxc);
        const blob = stored ?? (await this.fetch(mxc, true)) ?? (await this.fetch(mxc, false));
        if (!blob || this.disposed) return;
        if (!stored) void this.writePersisted(mxc, blob);
        const colour = await averageColour(blob);
        if (this.disposed) return;
        this.urls.set(mxc, URL.createObjectURL(blob));
        if (colour) this.colours.set(mxc, colour);
        this.notifyTimer ??= setTimeout(() => {
            this.notifyTimer = undefined;
            this.version++;
            for (const cb of this.listeners) cb();
        }, NOTIFY_MS);
    }

    private async readPersisted(mxc: string): Promise<Blob | undefined> {
        if (!this.persist()) return undefined;
        try {
            const res = await (await caches.open(PERSIST_CACHE)).match(persistKey(mxc));
            const blob = await res?.blob();
            return blob?.type.startsWith("image/") ? blob : undefined;
        } catch {
            return undefined;
        }
    }

    private async writePersisted(mxc: string, blob: Blob): Promise<void> {
        if (!this.persist()) return;
        try {
            await (await caches.open(PERSIST_CACHE)).put(persistKey(mxc), new Response(blob, { headers: { "Content-Type": blob.type } }));
        } catch {
            // Storage full or blocked: the avatar is still shown.
        }
    }

    private async fetch(mxc: string, authenticated: boolean): Promise<Blob | undefined> {
        const url = this.client.mxcUrlToHttp?.(mxc, SIZE, SIZE, "crop", false, true, authenticated);
        const token = authenticated ? this.client.getAccessToken?.() : undefined;
        if (!url || (authenticated && !token)) return undefined;
        try {
            const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
            if (!res.ok) return undefined;
            const blob = await res.blob();
            return blob.type.startsWith("image/") ? blob : undefined;
        } catch {
            return undefined;
        }
    }
}

/** Cache Storage only takes http(s) URLs; this one is never requested. */
function persistKey(mxc: string): string {
    return new URL(`/__space_room_map/avatar/${encodeURIComponent(mxc.slice("mxc://".length))}`, window.location.origin).href;
}

/** Downscaled to 4×4 by the browser, then averaged, skipping transparent pixels. */
async function averageColour(blob: Blob): Promise<string | undefined> {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas !== "function") return undefined;
    try {
        const bitmap = await createImageBitmap(blob, { resizeWidth: 4, resizeHeight: 4, resizeQuality: "medium" });
        const ctx = new OffscreenCanvas(4, 4).getContext("2d");
        if (!ctx) return undefined;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const data = ctx.getImageData(0, 0, 4, 4).data;
        const sum = [0, 0, 0];
        let weight = 0;
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] / 255;
            for (let c = 0; c < 3; c++) sum[c] += data[i + c] * a;
            weight += a;
        }
        return weight > 0 ? `rgb(${sum.map((v) => Math.round(v / weight)).join(", ")})` : undefined;
    } catch {
        return undefined;
    }
}
