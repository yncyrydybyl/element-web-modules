/**
 * MOB-04: Android Chrome throws `TypeError: Illegal constructor` for `new Notification()` in a page (notifications
 * must go through ServiceWorkerRegistration.showNotification there), but Element's BasePlatform uses the constructor.
 *
 * Shim (Android only): window.Notification becomes a Proxy whose `construct` first tries the real constructor and
 * only on that TypeError falls back to the service worker Element already registers (sw.js). Statics
 * (permission, requestPermission) pass through untouched, so on every platform where the constructor works nothing
 * changes. Limits: Element's sw.js has no `notificationclick` handler, so tapping such a notification can't open the
 * room (onclick is never called); close() closes it by tag. Needs real-device testing.
 */
const P = "[mobile-themes]";

interface NotificationOptionsLike {
    body?: string;
    icon?: string;
    tag?: string;
    silent?: boolean;
    [k: string]: unknown;
}

class SwNotification extends EventTarget {
    public onclick: ((ev: Event) => void) | null = null;
    public onclose: ((ev: Event) => void) | null = null;
    public onerror: ((ev: Event) => void) | null = null;
    public onshow: ((ev: Event) => void) | null = null;
    public readonly tag: string;
    public readonly body: string;
    public constructor(public readonly title: string, opts: NotificationOptionsLike = {}) {
        super();
        this.tag = opts.tag || `mt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.body = opts.body ?? "";
        const o = { ...opts, tag: this.tag };
        navigator.serviceWorker?.ready
            .then((reg) => reg.showNotification(title, o as NotificationOptions))
            .then(() => this.onshow?.(new Event("show")))
            .catch((e) => {
                console.warn(P, "showNotification failed", e);
                this.onerror?.(new Event("error"));
            });
    }
    public close(): void {
        navigator.serviceWorker?.ready
            .then((reg) => reg.getNotifications({ tag: this.tag }))
            .then((ns) => ns.forEach((n) => n.close()))
            .catch(() => {});
        this.onclose?.(new Event("close"));
    }
}

let installed = false;
export function installNotificationShim(force = false): boolean {
    if (installed) return true;
    if (!force && !/Android/.test(navigator.userAgent)) return false;
    const Orig = (window as unknown as { Notification?: typeof Notification }).Notification;
    if (!Orig || !("serviceWorker" in navigator)) return false;
    try {
        const proxy = new Proxy(Orig, {
            construct(target, args: [string, NotificationOptionsLike?]) {
                try {
                    return Reflect.construct(target, args) as object;
                } catch (e) {
                    if (e instanceof TypeError) return new SwNotification(args[0], args[1]);
                    throw e;
                }
            },
            get(target, prop) {
                const v = Reflect.get(target, prop, target);
                return typeof v === "function" && prop !== "prototype" ? v.bind(target) : v;
            },
        });
        (window as unknown as { Notification: unknown }).Notification = proxy;
        installed = true;
        console.info(P, "Notification shim installed (service-worker fallback)");
        return true;
    } catch (e) {
        console.warn(P, "Notification shim failed", e);
        return false;
    }
}
