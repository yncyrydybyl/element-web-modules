import { useId, useState, useSyncExternalStore, type JSX } from "react";

import { P } from "../i18n";
import type { ColourMode, MapSettings, SettingsStore } from "../settings";
import type { ModuleTranslate } from "./MapOverlay";

type Toggle = Exclude<keyof MapSettings, "colours">;

/** "Space map" in Settings → Preferences, laid out like Element's own subsections. */
export function SettingsSection(props: { store: SettingsStore; t: ModuleTranslate; triggerLabel: string }): JSX.Element {
    const { store, t } = props;
    const settings = useSyncExternalStore(store.subscribe, store.get);
    const [error, setError] = useState(false);
    const headingId = useId();
    const save = (patch: Partial<MapSettings>): void => {
        setError(false);
        store.set(patch).catch((e) => {
            console.error("[space-room-map] Couldn't save the settings", e);
            setError(true);
        });
    };
    const toggles: Toggle[] = ["animations", "live", "keepReady", "cacheAvatars"];
    const colours: ColourMode[] = ["district", "room"];

    return (
        <div className="mx_SettingsSubsection srm-settings" data-testid="space-room-map-settings" role="group" aria-labelledby={headingId}>
            <div className="mx_SettingsSubsectionHeading">
                <h3 id={headingId} className="mx_Heading_h4 mx_SettingsSubsectionHeading_heading">
                    {t(`${P}settings_title`)}
                </h3>
            </div>
            <div className="mx_SettingsSubsection_description">
                <div className="mx_SettingsSubsection_text">
                    {t(`${P}settings_description`, { key: props.triggerLabel })}
                </div>
            </div>
            <div className="mx_SettingsSubsection_content">
                <fieldset className="srm-setting-group">
                    <legend className="srm-setting-label">{t(`${P}settings_colours`)}</legend>
                    {colours.map((c) => (
                        <label key={c} className="srm-setting-radio">
                            <input type="radio" name={`${headingId}-colours`} checked={settings.colours === c} onChange={() => save({ colours: c })} />
                            <span>
                                <span className="srm-setting-label">{t(`${P}settings_colours_${c}`)}</span>
                                <span className="srm-setting-help">{t(`${P}settings_colours_${c}_help`)}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
                {toggles.map((key) => (
                    // Switch first, like Element's own settings.
                    <label key={key} className="srm-setting">
                        <input type="checkbox" role="switch" className="srm-switch" checked={settings[key]} onChange={(ev) => save({ [key]: ev.target.checked })} />
                        <span className="srm-setting-text">
                            <span className="srm-setting-label">{t(`${P}settings_${key}`)}</span>
                            <span className="srm-setting-help">{t(`${P}settings_${key}_help`)}</span>
                        </span>
                    </label>
                ))}
                {error && (
                    <div className="srm-setting-error" role="alert">
                        {t(`${P}settings_error`)}
                    </div>
                )}
            </div>
        </div>
    );
}
