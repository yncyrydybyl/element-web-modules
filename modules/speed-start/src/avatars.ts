/**
 * Small data-URL copies of the avatars on screen. Element's avatar URLs (blob: or authenticated
 * media) don't survive a reload, so the snapshot carries its own tiny copies.
 */

/** Only avatars from these regions are copied; the timeline is never part of the snapshot anyway. */
const REGIONS = ".mx_SpacePanel img, .mx_RoomListPanel img, .mx_RoomHeader img";
/** Longest side in device pixels. Room list avatars are 32 CSS px, the header's 40. */
const MAX_PX = 80;
/** Keeps the cache from growing without bound when someone scrolls through thousands of rooms. */
const MAX_ENTRIES = 300;

export class AvatarCache {
    private readonly urls = new Map<string, string>();

    public get map(): ReadonlyMap<string, string> {
        return this.urls;
    }

    /** Copies avatars that are on screen and loaded, and not copied yet. */
    public refresh(doc: Document = document): void {
        const dpr = doc.defaultView?.devicePixelRatio ?? 1;
        for (const img of doc.querySelectorAll<HTMLImageElement>(REGIONS)) {
            const src = img.currentSrc || img.src;
            if (!src || src.startsWith("data:") || this.urls.has(src)) continue;
            if (!img.complete || !img.naturalWidth) continue;
            const data = toDataUrl(img, dpr);
            if (!data) continue;
            if (this.urls.size >= MAX_ENTRIES) this.urls.delete(this.urls.keys().next().value!);
            this.urls.set(src, data);
        }
    }
}

function toDataUrl(img: HTMLImageElement, dpr: number): string | null {
    const box = Math.max(img.clientWidth, img.clientHeight, 32);
    const size = Math.min(MAX_PX, Math.round(box * dpr));
    try {
        const canvas = img.ownerDocument.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        // Cover-crop to a square, as the avatar's CSS does.
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const url = canvas.toDataURL("image/webp", 0.8);
        return url.startsWith("data:image/") ? url : null;
    } catch {
        // A cross-origin image taints the canvas; that avatar is then left out.
        return null;
    }
}
