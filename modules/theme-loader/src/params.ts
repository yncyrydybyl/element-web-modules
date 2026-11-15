/** Reads a query parameter from location.search or the part after "?" in the hash (Element routes live in the hash). */
export function getParam(name: string): string | null {
    try {
        const sources = [window.location.search, window.location.hash.split("?")[1] ?? ""];
        for (const s of sources) {
            const v = new URLSearchParams(s.replace(/^\?/, "")).get(name);
            if (v !== null) return v;
        }
    } catch {
        /* ignore */
    }
    return null;
}

export function lsGet(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function lsSet(key: string, value: string | null): void {
    try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
    } catch {
        /* storage unavailable */
    }
}

export function localise(value: unknown, lang: string): string {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    const v = value as Record<string, string>;
    return v[lang] ?? v[lang.split("-")[0]] ?? v.en ?? Object.values(v)[0] ?? "";
}
