/**
 * Public types for theme authors (docs/CONTRACT.md) and the loader's internal registry shape.
 * Theme enhancers import these with `import type … from "../../loader/src/types"`.
 */
import type { Api } from "@element-hq/element-web-module-api";

export type ThemeMode = "light" | "dark" | "daylight";
export type ElementBase = "light" | "dark";

/** A text in one language, or by language code. */
export type Localised = string | Record<string, string>;

export interface SchedulePhase {
    /** Local time "HH:MM" from which this phase applies. */
    from: string;
    phase: string;
    base?: ElementBase;
}

export interface FontSpec {
    family: string;
    /** Path inside the family dir, e.g. "assets/selawik.woff2". */
    file?: string;
    weight?: string;
    style?: string;
    /** Optional local() names tried before the bundled file (proprietary fonts). */
    local?: string[];
    display?: string;
    unicodeRange?: string;
}

/** A variant as written in `themes/<family>/themes.json`. */
export interface VariantManifest {
    id: string;
    name: Localised;
    stage: string;
    mode: ThemeMode;
    base: ElementBase;
    seriousness?: number;
    hype?: number;
    description?: Localised;
    css?: string[];
    fonts?: FontSpec[];
    tokens?: Record<string, string>;
    enhance?: boolean;
    schedule?: SchedulePhase[] | null;
    hidden?: boolean;
}

export interface FamilyManifest {
    family: string;
    name: Localised;
    variants: VariantManifest[];
    hidden?: boolean;
}

/** A font after the build/dev server resolved its file to a URL relative to the asset base. */
export interface ResolvedFont extends Omit<FontSpec, "file"> {
    url?: string;
}

/** A variant in the aggregated registry (lib/themes.json or the dev server's live themes.json). */
export interface Variant extends Omit<VariantManifest, "css" | "fonts"> {
    family: string;
    familyName: Localised;
    /** CSS URLs relative to the asset base, in order. */
    css: string[];
    fonts: ResolvedFont[];
    hidden: boolean;
}

export interface Registry {
    version: 1;
    built?: string;
    dev?: boolean;
    families: {
        family: string;
        name: Localised;
        hidden: boolean;
        enhance: boolean;
        /** Production: family-relative asset path ("assets/x.png") -> flattened, versioned file ("fam--x.png?v=…"). */
        assets?: Record<string, string>;
    }[];
    variants: Variant[];
    /** Dev server only: validation problems, per family. */
    problems?: { family: string; level: "error" | "warning"; message: string }[];
}

/** What an enhancer receives in mount(). */
export interface EnhancerContext {
    /** The active variant (registry entry). */
    variant: Variant;
    /** Our overlay root: a fixed, full-viewport div with pointer-events:none. Put overlays here. */
    root: HTMLElement;
    /** The Element module API. */
    api: Api;
    /** Current daylight phase, or null for non-daylight variants. */
    phase: string | null;
    /** Resolves a family-relative asset path ("assets/beep.mp3") to a URL that works in dev and prod. */
    asset(path: string): string;
    /** True if the user prefers reduced motion. */
    reducedMotion: boolean;
    /** Logs with the [theme-loader] prefix. */
    log(...args: unknown[]): void;
    /** Switches to another theme (null = Element default) and saves it like a picker choice. */
    switchTheme(id: string | null): void;
    /** The last theme that was applied before the current one (null = Element default / none). */
    previousTheme(): string | null;
}

export interface Enhancer {
    mount(ctx: EnhancerContext): void | Promise<void>;
    unmount(): void;
    onPhase?(phase: string): void;
}
