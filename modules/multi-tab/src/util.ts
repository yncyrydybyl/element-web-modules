/** Small helpers shared by the engine, the mirror and the election. */

/** Sets `key` as the newest entry and drops the oldest beyond `max` (a Map keeps insertion order). */
export function setBounded<K, V>(map: Map<K, V>, key: K, value: V, max: number): void {
    map.delete(key);
    map.set(key, value);
    if (map.size > max) map.delete(map.keys().next().value!);
}

/**
 * Runs `fn` and returns `fallback` if it throws. For storage access, which throws in some private modes or
 * when the quota is full, and where the module degrades rather than fails.
 */
export function quietly<T>(fn: () => T, fallback: T): T {
    try {
        return fn();
    } catch {
        return fallback;
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

/** `p`'s value, or `fallback` if it rejects or takes longer than `ms`. */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([p.catch(() => fallback), new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}
