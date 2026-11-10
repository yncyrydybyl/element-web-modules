import type { JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";

export interface SkippedDialogProps {
    t: ModuleTranslate;
    lines: string[];
}

/** Explains after sending why a tag stayed plain text. */
export function SkippedDialog({ t, lines, onCancel }: SkippedDialogProps & DialogProps<void>): JSX.Element {
    return (
        <div className="tm-dialog" data-testid="tag-mentions-skipped">
            {lines.map((l) => (
                <p key={l} className="tm-hint">
                    {l}
                </p>
            ))}
            <div className="tm-actions">
                <span className="tm-spacer" />
                <button type="button" className="tm-action tm-action--primary" onClick={onCancel}>
                    {t(`${P}ok`)}
                </button>
            </div>
        </div>
    );
}
