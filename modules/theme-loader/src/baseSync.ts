/**
 * Keeps Element's own light/dark base in line with the active theme (hljs, markdown CSS, widgets, Element Call and
 * anything we don't override follow it). Uses Element's dispatcher action `recheck_theme` with `forceTheme`, which
 * is transient: nothing is written to the user's settings. Restoring = `recheck_theme` without force, which makes
 * Element recompute its theme from the user's settings. Feature-detected; a no-op if the internals are missing.
 */
import { log, warn } from "./log";

interface Dispatcher {
    dispatch(payload: { action: string; forceTheme?: string }, sync?: boolean): void;
}

function dispatcher(): Dispatcher | undefined {
    const d = (window as unknown as { mxDispatcher?: Dispatcher }).mxDispatcher;
    return d && typeof d.dispatch === "function" ? d : undefined;
}

function bodyBase(): "light" | "dark" | null {
    const cl = document.body?.classList;
    if (!cl) return null;
    if (cl.contains("cpd-theme-dark") || cl.contains("cpd-theme-dark-hc")) return "dark";
    if (cl.contains("cpd-theme-light") || cl.contains("cpd-theme-light-hc")) return "light";
    return null;
}

export class BaseSync {
    private observer?: MutationObserver;
    private forced: "light" | "dark" | null = null;
    private attempts: number[] = [];
    private warned = false;
    private timer?: number;

    public constructor(private readonly desired: () => "light" | "dark" | null) {}

    public start(): void {
        try {
            this.observer = new MutationObserver(() => this.schedule());
            this.observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        } catch (e) {
            warn("base sync unavailable", e);
        }
        this.schedule();
    }

    public stop(): void {
        this.observer?.disconnect();
    }

    /** Re-evaluate soon (coalesced). */
    public schedule(): void {
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => this.sync(), 30);
    }

    private sync(): void {
        try {
            const d = dispatcher();
            const want = this.desired();
            if (!d) {
                if (want && !this.warned) {
                    this.warned = true;
                    warn("mxDispatcher not found; Element's light/dark base is not synced");
                }
                return;
            }
            if (want === null) {
                if (this.forced !== null) {
                    // Back to Element default: let Element recompute its theme from the user's settings.
                    this.forced = null;
                    d.dispatch({ action: "recheck_theme" });
                }
                return;
            }
            const have = bodyBase();
            if (have === null || have === want) return;
            const now = Date.now();
            this.attempts = this.attempts.filter((t) => now - t < 10_000);
            if (this.attempts.length >= 6) {
                if (!this.warned) {
                    this.warned = true;
                    warn("Element keeps resetting its base theme; giving up syncing for now");
                }
                return;
            }
            this.attempts.push(now);
            // ThemeWatcher only emits when its remembered theme changes; if Element re-applied its own theme
            // behind its back (setTheme() after login), reset the watcher first, then force.
            if (this.forced === want) d.dispatch({ action: "recheck_theme" });
            d.dispatch({ action: "recheck_theme", forceTheme: want });
            this.forced = want;
            log(`Element base -> ${want}`);
        } catch (e) {
            warn("base sync failed", e);
        }
    }
}
