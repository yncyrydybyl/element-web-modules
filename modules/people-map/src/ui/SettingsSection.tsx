import { useId, useState, useSyncExternalStore, type JSX } from "react";

import { P } from "../i18n";
import { LARGE_ROOM } from "../people";
import type { MapSettings, SettingsStore } from "../settings";
import type { ModuleTranslate } from "./PeopleOverlay";

/** "People map" in Settings → Preferences, laid out like Element's own subsections. */
export function SettingsSection(props: { store: SettingsStore; t: ModuleTranslate; triggerLabel: string }): JSX.Element {
    const { store, t } = props;
    const settings = useSyncExternalStore(store.subscribe, store.get);
    const [error, setError] = useState(false);
    const headingId = useId();
    const save = (patch: Partial<MapSettings>): void => {
        setError(false);
        store.set(patch).catch((e) => {
            console.error("[people-map] Couldn't save the settings", e);
            setError(true);
        });
    };
    const toggles: Array<keyof MapSettings> = ["largeRooms", "bots", "animations", "cacheAvatars"];

    return (
        <div className="mx_SettingsSubsection pm-settings" data-testid="people-map-settings" role="group" aria-labelledby={headingId}>
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
                {toggles.map((key) => (
                    // Switch first, like Element's own settings.
                    <label key={key} className="pm-setting">
                        <input type="checkbox" role="switch" className="pm-switch" checked={settings[key]} onChange={(ev) => save({ [key]: ev.target.checked })} />
                        <span className="pm-setting-text">
                            <span className="pm-setting-label">{t(`${P}settings_${key}`)}</span>
                            <span className="pm-setting-help">{t(`${P}settings_${key}_help`, { count: String(LARGE_ROOM) })}</span>
                        </span>
                    </label>
                ))}
                {error && (
                    <div className="pm-setting-error" role="alert">
                        {t(`${P}settings_error`)}
                    </div>
                )}
            </div>
        </div>
    );
}
