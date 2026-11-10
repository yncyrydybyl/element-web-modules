import type { JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import type { SuggestState } from "../suggest";
import type { ResolvedTag } from "../tags";
import { TagRow, usable } from "./TagRow";

export interface SuggestionsProps {
    t: ModuleTranslate;
    state: SuggestState;
    name(userId: string): string;
    max: number;
    pick(tag: ResolvedTag): void;
}

/** The list of matching tags above the composer while typing "@…". */
export function Suggestions({ t, state, name, max, pick }: SuggestionsProps): JSX.Element {
    return (
        <div
            className="tm-suggest"
            role="listbox"
            aria-label={t(`${P}picker_title`)}
            data-testid="tag-mentions-suggest"
            style={{ left: state.anchor.left, bottom: state.anchor.bottom, width: Math.min(state.anchor.width, 520) }}
            // Keep the composer focused and its selection intact.
            onMouseDown={(ev) => ev.preventDefault()}
        >
            {state.tags.map((tag, i) => (
                <button
                    key={tag.name}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={i === state.selected}
                    disabled={!usable(tag, max)}
                    className="tm-option tm-option--compact"
                    onClick={() => pick(tag)}
                >
                    <TagRow t={t} tag={tag} name={name} max={max} />
                </button>
            ))}
        </div>
    );
}
