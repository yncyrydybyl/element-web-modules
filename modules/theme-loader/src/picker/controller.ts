import type { Registry, Variant } from "../types";
import type { TKey } from "../i18n";

/** What the picker UI needs from the loader. */
export interface PickerController {
    registry(): Registry;
    /** The saved choice (null: Element default). */
    chosen(): string | null;
    /** What is applied right now (URL override or preview included). */
    applied(): string | null;
    urlOverride(): string | null;
    /** Apply and save. */
    select(id: string | null): void;
    /** Apply without saving (quick switcher preview). */
    preview(id: string | null): void;
    variant(id: string | null): Variant | null;
    phase(): string | null;
    forcedPhase(): string | null;
    setForcedPhase(phase: string | null): void;
    subscribe(fn: () => void): () => void;
    t(key: TKey): string;
    lang(): string;
    /** Whether hidden variants (e.g. _demo in production) are listed. */
    showHidden(): boolean;
}
