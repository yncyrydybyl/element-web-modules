/**
 * A module's own version, read from its build. The modules in this repository start with a
 * banner like `/*! @datanauten/element-web-module-speed-start 0.2.0 *\/` (see their vite.config.ts);
 * others are recognised if their first comment names a version the same way, or with `@version`.
 */

const SEMVER = String.raw`v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)`;
const BANNER = new RegExp(String.raw`^\s*\/\*!?\s*[^\s*]+\s+${SEMVER}(?=[\s*])`);
const TAG = new RegExp(String.raw`@version\s+${SEMVER}`);

export function versionFromSource(code: string): string | undefined {
    const head = code.slice(0, 1024);
    const comment = /^\s*\/\*[\s\S]*?\*\//.exec(head)?.[0];
    if (!comment) return undefined;
    return BANNER.exec(comment)?.[1] ?? TAG.exec(comment)?.[1];
}

/**
 * The version of a module this Element loads from its own `config.json`. The browser has the file
 * in its cache from start-up, so this normally costs no request; it reads what was loaded, unless
 * the server's copy changed since.
 */
export async function fetchServerVersion(src: string): Promise<string | undefined> {
    try {
        const response = await fetch(new URL(src, window.location.href).href, { cache: "force-cache" });
        if (!response.ok) return undefined;
        return versionFromSource(await response.text());
    } catch {
        return undefined;
    }
}
