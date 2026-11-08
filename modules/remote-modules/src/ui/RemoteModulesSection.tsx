import { useId, useRef, useState, useSyncExternalStore, type FormEvent, type JSX, type ReactNode } from "react";

import { P } from "../i18n";
import type { ModuleStatus } from "../loader";
import { isValidSource, type RemoteModuleEntry } from "../store";

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

/** One of config.json's modules. */
export interface ServerModule {
    src: string;
    key: string;
    /** Not turned off by the user. */
    enabled: boolean;
    /** Loaded in this page. */
    running: boolean;
    /** Loads before this module, so it can't be turned off. */
    locked: boolean;
}

export interface SectionController {
    subscribe(listener: () => void): () => void;
    getModules(): readonly RemoteModuleEntry[];
    getStatus(id: string): ModuleStatus | undefined;
    /** Runs in this page (only a reload stops it). */
    isActive(id: string): boolean;
    /** Bumped whenever a module's status changes. */
    getVersion(): number;
    /** The `modules` of Element's config.json, as listed there. */
    getServerModules(): readonly ServerModule[];
    /** The user is on the allowlist for their own modules. */
    canLoadDynamic(): boolean;
    /** Some dynamic module that runs in this page was turned off or removed. */
    needsReload(): boolean;
    safeMode: boolean;
    add(source: string, name: string): Promise<void>;
    upload(file: File): Promise<void>;
    setEnabled(id: string, enabled: boolean): Promise<void>;
    setServerEnabled(key: string, enabled: boolean): Promise<void>;
    remove(id: string): Promise<void>;
    reload(id: string): Promise<void>;
    reloadElement(): void;
}

/** The "Modules" settings tab: the server's modules, then the user's own. */
export function RemoteModulesSection({ controller: c, t }: { controller: SectionController; t: ModuleTranslate }): JSX.Element {
    useSyncExternalStore(c.subscribe, c.getVersion);
    const modules = c.getModules();
    const serverModules = c.getServerModules();
    const [source, setSource] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const needsReload = c.needsReload();

    const run = async (task: () => Promise<void>): Promise<void> => {
        setError(null);
        setBusy(true);
        try {
            await task();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    const onSubmit = (ev: FormEvent): void => {
        ev.preventDefault();
        const value = source.trim();
        if (!isValidSource(value)) {
            setError(t(`${P}invalid_source`));
            return;
        }
        void run(async () => {
            await c.add(value, nameFromSource(value));
            setSource("");
        });
    };

    return (
        <div className="drm-tab" data-testid="remote-modules-section">
            <Section title={t(`${P}server_title`)} description={t(`${P}server_description`)} testId="remote-modules-server">
                {serverModules.length === 0 ? (
                    <p className="drm-empty">{t(`${P}server_empty`)}</p>
                ) : (
                    <ul className="drm-list" aria-label={t(`${P}server_title`)}>
                        {serverModules.map((m) => (
                            <ServerRow key={m.src} module={m} controller={c} t={t} busy={busy} run={run} />
                        ))}
                    </ul>
                )}
                {serverModules.some((m) => m.enabled !== m.running) && <ReloadNotice controller={c} t={t} />}
            </Section>

            {c.canLoadDynamic() && (
            <Section title={t(`${P}dynamic_title`)} description={t(`${P}warning`)} warning testId="remote-modules-dynamic">
                {c.safeMode && <div className="drm-notice">{t(`${P}safe_mode`)}</div>}

                {modules.length === 0 ? (
                    <p className="drm-empty">{t(`${P}empty`)}</p>
                ) : (
                    <ul className="drm-list" aria-label={t(`${P}dynamic_title`)}>
                        {modules.map((m) => (
                            <ModuleRow key={m.id} entry={m} status={c.getStatus(m.id)} controller={c} t={t} busy={busy} run={run} />
                        ))}
                    </ul>
                )}

                <form className="drm-add" onSubmit={onSubmit}>
                    <input
                        className="drm-input"
                        type="text"
                        value={source}
                        onChange={(ev) => setSource(ev.target.value)}
                        placeholder="mxc://… / https://… / http://localhost:5173/index.js"
                        aria-label={t(`${P}source_label`)}
                        spellCheck={false}
                    />
                    <button type="submit" className="drm-button drm-button--primary" disabled={busy || !source.trim()}>
                        {t(`${P}add`)}
                    </button>
                    <button type="button" className="drm-button" disabled={busy} onClick={() => fileRef.current?.click()}>
                        {t(`${P}upload`)}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".js,.mjs,text/javascript"
                        hidden
                        data-testid="remote-modules-file"
                        onChange={(ev) => {
                            const file = ev.target.files?.[0];
                            ev.target.value = "";
                            if (file) void run(() => c.upload(file));
                        }}
                    />
                </form>
                {error && (
                    <div className="drm-error" role="alert">
                        {error}
                    </div>
                )}
                {needsReload && <ReloadNotice controller={c} t={t} />}
                <p className="mx_SettingsSubsection_description drm-hint">{t(`${P}hint`)}</p>
            </Section>
            )}
        </div>
    );
}

/** Laid out like Element's own sections ("Audio input" etc.), one subsection without a heading. */
function Section(props: { title: string; description: string; warning?: boolean; testId: string; children: ReactNode }): JSX.Element {
    const headingId = useId();
    return (
        <div className="mx_SettingsSection" role="group" aria-labelledby={headingId} data-testid={props.testId}>
            <h2 id={headingId} className="mx_Heading_h3">
                {props.title}
            </h2>
            <div className="mx_SettingsSection_subSections">
                <div className="mx_SettingsSubsection">
                    <div className={`mx_SettingsSubsection_description${props.warning ? " drm-warning" : ""}`} role={props.warning ? "note" : undefined}>
                        {props.description}
                    </div>
                    <div className="mx_SettingsSubsection_content">{props.children}</div>
                </div>
            </div>
        </div>
    );
}

function ReloadNotice({ controller: c, t }: { controller: SectionController; t: ModuleTranslate }): JSX.Element {
    return (
        <div className="drm-notice">
            {t(`${P}needs_reload`)}{" "}
            <button type="button" className="drm-button" onClick={c.reloadElement}>
                {t(`${P}reload_element`)}
            </button>
        </div>
    );
}

function ServerRow(props: {
    module: ServerModule;
    controller: SectionController;
    t: ModuleTranslate;
    busy: boolean;
    run(task: () => Promise<void>): Promise<void>;
}): JSX.Element {
    const { module: m, controller: c, t, busy, run } = props;
    const name = nameFromSource(m.src);
    const [state, status] = m.running
        ? m.enabled
            ? ["loaded", "status_loaded"]
            : ["reload", "status_reload"]
        : m.enabled
          ? ["pending", "status_next_reload"]
          : ["disabled", "status_off"];
    const label = m.enabled ? "turn_off" : "turn_on";
    return (
        <li className="drm-row">
            <div className="drm-row-text">
                <span className="drm-name">{name}</span>
                <code className="drm-source">{m.src}</code>
                <span className={`drm-status drm-status--${state}`}>{t(`${P}${status}`)}</span>
            </div>
            {m.locked ? (
                <span className="drm-locked" title={t(`${P}locked_hint`)}>
                    {t(`${P}locked`)}
                </span>
            ) : (
                <button
                    type="button"
                    className="drm-button"
                    disabled={busy}
                    aria-label={t(`${P}${label}_label`, { name })}
                    onClick={() => void run(() => c.setServerEnabled(m.key, !m.enabled))}
                >
                    {t(`${P}${label}`)}
                </button>
            )}
        </li>
    );
}

function ModuleRow(props: {
    entry: RemoteModuleEntry;
    status: ModuleStatus | undefined;
    controller: SectionController;
    t: ModuleTranslate;
    busy: boolean;
    run(task: () => Promise<void>): Promise<void>;
}): JSX.Element {
    const { entry, status, controller: c, t, busy, run } = props;
    const loaded = status?.state === "loaded";
    // Off but still running (unloaded, waiting for a reload): loading it again just switches it back on.
    const label = entry.enabled ? "unload" : "load";
    return (
        <li className="drm-row">
            <div className="drm-row-text">
                <span className="drm-name">{entry.name}</span>
                <code className="drm-source">{entry.source}</code>
                <span className={`drm-status drm-status--${status?.state ?? "pending"}`}>{statusText(status, t)}</span>
            </div>
            {entry.enabled && (status?.state === "failed" || loaded) && (
                <button
                    type="button"
                    className="drm-button"
                    disabled={busy}
                    title={loaded ? t(`${P}reload_hint`) : undefined}
                    onClick={() => void run(() => c.reload(entry.id))}
                >
                    {loaded ? t(`${P}reload_element`) : t(`${P}retry`)}
                </button>
            )}
            <button
                type="button"
                className="drm-button"
                disabled={busy}
                title={entry.enabled && c.isActive(entry.id) ? t(`${P}unload_hint`) : undefined}
                aria-label={t(`${P}${label}_label`, { name: entry.name })}
                onClick={() => void run(() => c.setEnabled(entry.id, !entry.enabled))}
            >
                {t(`${P}${label}`)}
            </button>
            <button
                type="button"
                className="drm-button drm-button--danger"
                disabled={busy}
                aria-label={t(`${P}remove_label`, { name: entry.name })}
                onClick={() => void run(() => c.remove(entry.id))}
            >
                {t(`${P}remove`)}
            </button>
        </li>
    );
}

function statusText(status: ModuleStatus | undefined, t: ModuleTranslate): string {
    switch (status?.state) {
        case "loading":
            return t(`${P}status_loading`);
        case "loaded":
            return status.apiVersion ? t(`${P}status_loaded_version`, { version: status.apiVersion }) : t(`${P}status_loaded`);
        case "failed":
            return t(`${P}status_failed`, { error: status.error });
        case "disabled":
            return t(`${P}status_disabled`);
        case "reload":
            return t(`${P}status_reload`);
        default:
            return t(`${P}status_pending`);
    }
}

/** "space-room-map" for …/space-room-map/index.js, the file name otherwise. Relative paths (config.json) work too. */
export function nameFromSource(source: string): string {
    if (source.startsWith("mxc://")) return source.slice(source.lastIndexOf("/") + 1);
    try {
        const parts = new URL(source, window.location.href).pathname.split("/").filter(Boolean);
        const file = parts.pop() ?? source;
        if (/^index\.m?js$/.test(file) && parts.length) {
            const dir = parts.pop()!;
            return dir === "lib" || dir === "dist" ? (parts.pop() ?? dir) : dir;
        }
        return file;
    } catch {
        return source;
    }
}
