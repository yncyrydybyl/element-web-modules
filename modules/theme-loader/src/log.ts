const P = "[theme-loader]";
export const log = (...a: unknown[]): void => console.info(P, ...a);
export const warn = (...a: unknown[]): void => console.warn(P, ...a);
export const error = (...a: unknown[]): void => console.error(P, ...a);

/** Runs fn, logging (never rethrowing) any error. */
export function safe<T>(what: string, fn: () => T, fallback?: T): T | undefined {
    try {
        return fn();
    } catch (e) {
        error(`${what} failed`, e);
        return fallback;
    }
}
