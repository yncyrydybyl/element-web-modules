/**
 * How often the user opens each room, to rank search results.
 *
 * Element doesn't expose a usage history, so the module counts room switches itself (from the
 * URL hash) with a 14-day half-life. The counts stay on this device in localStorage: writing
 * account data on every room switch would be far too chatty.
 */

const STORAGE_KEY = "de.datanauten.space_room_map.usage";
const HALF_LIFE_MS = 14 * 24 * 3600 * 1000;
const MAX_ENTRIES = 500;

interface Entry {
    /** Decayed visit count as of `at`. */
    score: number;
    at: number;
}

export class UsageTracker {
    private entries: Record<string, Entry>;
    private lastHash?: string;

    public constructor(
        private readonly resolveRoom: (hash: string) => string | undefined,
        private readonly now = () => Date.now(),
    ) {
        this.entries = this.read();
    }

    public start(): void {
        window.addEventListener("hashchange", this.onHashChange);
        this.onHashChange();
    }

    public stop(): void {
        window.removeEventListener("hashchange", this.onHashChange);
    }

    public record(roomId: string): void {
        this.entries[roomId] = { score: this.score(roomId) + 1, at: this.now() };
        this.prune();
        this.write();
    }

    /** Decayed visit count; 0 for rooms never opened on this device. */
    public score(roomId: string): number {
        const e = this.entries[roomId];
        if (!e) return 0;
        return e.score * Math.pow(0.5, (this.now() - e.at) / HALF_LIFE_MS);
    }

    private onHashChange = (): void => {
        const hash = window.location.hash;
        if (hash === this.lastHash) return;
        this.lastHash = hash;
        const id = this.resolveRoom(hash);
        if (id) this.record(id);
    };

    private prune(): void {
        const ids = Object.keys(this.entries);
        if (ids.length <= MAX_ENTRIES) return;
        ids.sort((a, b) => this.score(a) - this.score(b));
        for (const id of ids.slice(0, ids.length - MAX_ENTRIES)) delete this.entries[id];
    }

    private read(): Record<string, Entry> {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
            return value && typeof value === "object" ? value : {};
        } catch {
            return {};
        }
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
        } catch {
            // Storage may be unavailable (private mode); counting still works for this session.
        }
    }
}
