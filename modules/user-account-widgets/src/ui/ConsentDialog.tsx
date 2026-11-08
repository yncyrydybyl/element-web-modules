import { useState, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { describe, isBroad } from "../capabilities";
import type { ModuleTranslate } from "../i18n";

export interface ConsentResult {
    approved: string[];
    remember: boolean;
}

export interface ConsentDialogProps {
    t: ModuleTranslate;
    url: string;
    capabilities: string[];
}

export function ConsentDialog({ t, url, capabilities, onSubmit, onCancel }: ConsentDialogProps & DialogProps<ConsentResult>): JSX.Element {
    const [checked, setChecked] = useState(() => new Set(capabilities));
    const [remember, setRemember] = useState(true);
    const toggle = (cap: string): void =>
        setChecked((prev) => {
            const next = new Set(prev);
            if (!next.delete(cap)) next.add(cap);
            return next;
        });

    return (
        <div className="uaw-dialog">
            <p className="uaw-dialog__url">{url}</p>
            <p>{t("consent_intro")}</p>
            <ul className="uaw-caps">
                {capabilities.map((cap) => {
                    const text = describe(cap);
                    return (
                        <li key={cap}>
                            <label className="uaw-cap">
                                <input type="checkbox" checked={checked.has(cap)} onChange={() => toggle(cap)} />
                                <span>
                                    {t(text.key as Parameters<ModuleTranslate>[0], text.vars)}
                                    {isBroad(cap) && <strong className="uaw-cap__broad"> · {t("consent_broad")}</strong>}
                                    <code className="uaw-cap__raw">{cap}</code>
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
            <label className="uaw-cap">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>{t("consent_remember")}</span>
            </label>
            <div className="uaw-dialog__buttons">
                <button type="button" className="uaw-button" onClick={onCancel}>
                    {t("deny")}
                </button>
                <button
                    type="button"
                    className="uaw-button uaw-button--primary"
                    onClick={() => onSubmit({ approved: capabilities.filter((c) => checked.has(c)), remember })}
                >
                    {t("allow")}
                </button>
            </div>
        </div>
    );
}
