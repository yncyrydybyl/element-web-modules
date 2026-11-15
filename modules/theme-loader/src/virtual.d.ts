declare module "tl:registry" {
    import type { Registry } from "./types";
    /** The aggregated registry baked in by the production build; null in dev builds. */
    const registry: Registry | null;
    export default registry;
}
declare module "tl:enhancers" {
    import type { Enhancer } from "./types";
    /** Enhancer modules by family (production build); empty in dev builds. */
    const enhancers: Record<string, Enhancer | { default: Enhancer }>;
    export default enhancers;
}
