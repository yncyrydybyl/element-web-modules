import type { EnhancerContext, Enhancer } from "../../src/types";

// A tiny overlay badge that shows the current daylight phase.
let badge: HTMLElement | null = null;

const enhancer: Enhancer = {
    mount(ctx: EnhancerContext): void {
        badge = document.createElement("div");
        badge.className = "tl-demo-badge";
        badge.setAttribute("data-tl-demo-badge", "");
        Object.assign(badge.style, {
            position: "absolute",
            right: "12px",
            bottom: "12px",
            padding: "4px 10px 4px 4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "999px",
            background: "var(--cpd-color-bg-subtle-primary)",
            color: "var(--cpd-color-text-primary)",
            font: "var(--cpd-font-body-sm-regular)",
            boxShadow: "0 2px 8px rgba(0,0,0,.3)",
            opacity: "0.92",
        });
        const img = document.createElement("img");
        img.src = ctx.asset("assets/owl.svg");
        img.alt = "";
        img.width = 24;
        img.height = 24;
        const text = document.createElement("span");
        badge.append(img, text);
        ctx.root.appendChild(badge);
        this.onPhase?.(ctx.phase ?? "?");
        ctx.log("demo enhancer mounted", ctx.variant.id, ctx.phase);
    },
    onPhase(phase: string): void {
        const t = badge?.querySelector("span");
        if (t) t.textContent = `night-owl · ${phase}`;
    },
    unmount(): void {
        badge?.remove();
        badge = null;
    },
};

export default enhancer;
