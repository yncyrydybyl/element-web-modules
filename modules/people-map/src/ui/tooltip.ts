/** Gap between the pointer and the tooltip. */
const TIP_OFFSET = 14;

/** Below right of the pointer; flipped to the other side near the right and bottom edges of `box`. */
export function placeTooltip(tip: HTMLElement | null, box: HTMLElement | null, x: number, y: number): void {
    if (!tip || !box) return;
    const left = x + TIP_OFFSET + tip.offsetWidth > box.clientWidth ? x - TIP_OFFSET - tip.offsetWidth : x + TIP_OFFSET;
    const top = y + TIP_OFFSET + tip.offsetHeight > box.clientHeight ? y - TIP_OFFSET - tip.offsetHeight : y + TIP_OFFSET;
    tip.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(4, top)}px)`;
}
