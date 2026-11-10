import { useEffect, useMemo, useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import { isUserId, validateName, type TagDefinition } from "../tags";

export interface Scope {
    id: string;
    name: string;
    isSpace: boolean;
    canEdit: boolean;
    /** Power level needed to change tags there. */
    level: number;
}

export interface Person {
    userId: string;
    name: string;
}

export interface ManageDialogProps {
    t: ModuleTranslate;
    /** The room first, then its spaces. */
    scopes: Scope[];
    tagsIn(scopeId: string): TagDefinition[];
    /** Space tags that apply in the room. */
    inherited(): TagDefinition[];
    members(scopeId: string): Promise<Person[]>;
    name(userId: string): string;
    save(scopeId: string, name: string, label: string, userIds: string[]): Promise<void>;
    remove(scopeId: string, name: string): Promise<void>;
    subscribe(cb: () => void): () => void;
    max: number;
}

type Draft = { name: string; label: string; userIds: string[]; isNew: boolean };
type Override = { scopeId: string; tag: TagDefinition | null };

const key = (scopeId: string, name: string): string => `${scopeId}\n${name}`;

export function ManageDialog(props: ManageDialogProps & DialogProps<void>): JSX.Element {
    const { t, scopes, tagsIn, inherited, subscribe, onCancel } = props;
    const [scopeId, setScopeId] = useState(scopes[0]?.id ?? "");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [, setTick] = useState(0);
    // Saved changes show at once; the state event arrives with the next sync.
    const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());
    useEffect(() => subscribe(() => setTick((n) => n + 1)), [subscribe]);

    const scope = scopes.find((s) => s.id === scopeId) ?? scopes[0];
    const tags = withOverrides(tagsIn(scope.id), scope.id, overrides);
    const fromSpaces = scope === scopes[0] ? inherited().filter((d) => !tags.some((x) => x.name === d.name)) : [];

    const override = (name: string, tag: TagDefinition | null): void =>
        setOverrides((m) => new Map(m).set(key(scope.id, name), { scopeId: scope.id, tag }));

    const onRemove = async (name: string): Promise<void> => {
        if (confirmDelete !== name) return setConfirmDelete(name);
        setConfirmDelete(null);
        try {
            await props.remove(scope.id, name);
            override(name, null);
        } catch (e) {
            setError(t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }));
        }
    };

    if (draft) {
        return (
            <TagEditor
                {...props}
                scope={scope}
                draft={draft}
                taken={(n) => tags.some((x) => x.name === n)}
                onDone={(saved) => {
                    if (saved) override(saved.name, saved);
                    setDraft(null);
                }}
            />
        );
    }

    return (
        <div className="tm-dialog" data-testid="tag-mentions-manage">
            <p className="tm-hint">{t(`${P}manage_intro`)}</p>
            {scopes.length > 1 && (
                <div className="tm-segmented" role="radiogroup">
                    {scopes.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={s.id === scope.id}
                            className="tm-segment"
                            onClick={() => {
                                setScopeId(s.id);
                                setError(null);
                            }}
                        >
                            {s.isSpace ? t(`${P}scope_space`, { name: s.name }) : t(`${P}scope_room`)}
                        </button>
                    ))}
                </div>
            )}
            {!scope.canEdit && <p className="tm-note">{t(`${P}no_permission`, { level: scope.level })}</p>}
            {tags.length === 0 && <p className="tm-empty">{t(`${P}no_tags`)}</p>}
            <ul className="tm-list">
                {tags.map((tag) => (
                    <li key={tag.name} className="tm-item" data-tag={tag.name}>
                        <span className="tm-row">
                            <span className="tm-row-head">
                                <span className="tm-tag">@{tag.name}</span>
                                {tag.label && <span className="tm-row-desc">{tag.label}</span>}
                            </span>
                            <span className="tm-row-members">
                                {t(`${P}members_count`, { count: tag.userIds.length })}: {tag.userIds.map(props.name).join(", ")}
                            </span>
                        </span>
                        {scope.canEdit && (
                            <span className="tm-item-actions">
                                <button
                                    type="button"
                                    className="tm-action tm-action--small"
                                    onClick={() => setDraft({ name: tag.name, label: tag.label, userIds: tag.userIds, isNew: false })}
                                >
                                    {t(`${P}edit`)}
                                </button>
                                <button type="button" className="tm-action tm-action--small tm-action--danger" onClick={() => void onRemove(tag.name)}>
                                    {confirmDelete === tag.name ? t(`${P}delete_confirm`) : t(`${P}delete`)}
                                </button>
                            </span>
                        )}
                    </li>
                ))}
            </ul>
            {fromSpaces.length > 0 && (
                <>
                    <h3 className="tm-label">{t(`${P}inherited`)}</h3>
                    <ul className="tm-list">
                        {fromSpaces.map((tag) => (
                            <li key={tag.name} className="tm-item">
                                <span className="tm-row">
                                    <span className="tm-row-head">
                                        <span className="tm-tag">@{tag.name}</span>
                                        {tag.label && <span className="tm-row-desc">{tag.label}</span>}
                                        <span className="tm-row-source">{t(`${P}from_space`, { name: tag.sourceName })}</span>
                                    </span>
                                    <span className="tm-row-members">
                                        {t(`${P}members_count`, { count: tag.userIds.length })}: {tag.userIds.map(props.name).join(", ")}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {error && (
                <div className="tm-error" role="alert">
                    {error}
                </div>
            )}
            <div className="tm-actions">
                {scope.canEdit && (
                    <button type="button" className="tm-action tm-action--primary" onClick={() => setDraft({ name: "", label: "", userIds: [], isNew: true })}>
                        {t(`${P}new_tag`)}
                    </button>
                )}
                <span className="tm-spacer" />
                <button type="button" className="tm-action" onClick={onCancel}>
                    {t(`${P}close`)}
                </button>
            </div>
        </div>
    );
}

function withOverrides(tags: TagDefinition[], scopeId: string, overrides: Map<string, Override>): TagDefinition[] {
    const out = new Map(tags.map((tg) => [tg.name, tg]));
    for (const [k, o] of overrides) {
        if (o.scopeId !== scopeId) continue;
        const name = k.split("\n")[1];
        if (o.tag) out.set(name, o.tag);
        else out.delete(name);
    }
    return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

interface TagEditorProps extends ManageDialogProps {
    scope: Scope;
    draft: Draft;
    taken(name: string): boolean;
    onDone(saved: TagDefinition | null): void;
}

function TagEditor({ t, scope, draft, taken, members, name, save, max, onDone }: TagEditorProps): JSX.Element {
    const [tagName, setTagName] = useState(draft.name);
    const [label, setLabel] = useState(draft.label);
    const [userIds, setUserIds] = useState<string[]>(draft.userIds);
    const [people, setPeople] = useState<Person[]>([]);
    const [filter, setFilter] = useState("");
    const [extra, setExtra] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let live = true;
        void members(scope.id).then((p) => live && setPeople(p));
        return () => {
            live = false;
        };
    }, [members, scope.id]);

    // Everyone who can be picked: the scope's members plus anyone already in the tag.
    const all = useMemo(() => {
        const list = [...people];
        for (const u of userIds) if (!list.some((p) => p.userId === u)) list.push({ userId: u, name: name(u) });
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [people, userIds, name]);
    const q = filter.trim().toLowerCase();
    const shown = q ? all.filter((p) => p.name.toLowerCase().includes(q) || p.userId.toLowerCase().includes(q)) : all;

    const toggle = (u: string): void => setUserIds((cur) => (cur.includes(u) ? cur.filter((x) => x !== u) : [...cur, u]));

    const addExtra = (): void => {
        const id = extra.trim();
        if (!isUserId(id)) return setError(t(`${P}err_user_id`));
        setError(null);
        setUserIds((cur) => (cur.includes(id) ? cur : [...cur, id]));
        setExtra("");
    };

    const onSubmit = async (ev: FormEvent): Promise<void> => {
        ev.preventDefault();
        const n = tagName.trim().replace(/^@/, "").toLowerCase();
        const problem = validateName(n);
        if (problem === "invalid") return setError(t(`${P}err_name_invalid`));
        if (problem === "reserved") return setError(t(`${P}err_name_reserved`, { name: n }));
        if (draft.isNew && taken(n)) return setError(t(`${P}err_name_taken`, { name: n }));
        if (!userIds.length) return setError(t(`${P}err_no_members`));
        if (userIds.length > max) return setError(t(`${P}err_too_many`, { max }));
        setBusy(true);
        try {
            await save(scope.id, n, label, userIds);
            onDone({ name: n, label: label.trim(), userIds, sourceId: scope.id, sourceName: scope.name, fromSpace: scope.isSpace });
        } catch (e) {
            setError(t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }));
            setBusy(false);
        }
    };

    return (
        <form className="tm-dialog" data-testid="tag-mentions-editor" onSubmit={(ev) => void onSubmit(ev)}>
            <label className="tm-field">
                <span className="tm-label">{t(`${P}name`)}</span>
                <span className="tm-name-input">
                    <span aria-hidden="true">@</span>
                    <input
                        className="tm-input"
                        value={tagName}
                        disabled={!draft.isNew}
                        maxLength={33}
                        autoFocus={draft.isNew}
                        placeholder="oncall"
                        onChange={(ev) => setTagName(ev.target.value)}
                    />
                </span>
            </label>
            <label className="tm-field">
                <span className="tm-label">{t(`${P}label`)}</span>
                <input className="tm-input" value={label} maxLength={200} placeholder={t(`${P}label_placeholder`)} onChange={(ev) => setLabel(ev.target.value)} />
            </label>
            <fieldset className="tm-fieldset">
                <legend className="tm-label">
                    {t(`${P}members`)} ({userIds.length})
                </legend>
                <input className="tm-input" value={filter} placeholder={t(`${P}search_members`)} aria-label={t(`${P}search_members`)} onChange={(ev) => setFilter(ev.target.value)} />
                <div className="tm-chips">
                    {shown.map((p) => (
                        <button
                            key={p.userId}
                            type="button"
                            role="checkbox"
                            aria-checked={userIds.includes(p.userId)}
                            className="tm-chip"
                            title={p.userId}
                            onClick={() => toggle(p.userId)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <span className="tm-add">
                    <input
                        className="tm-input"
                        value={extra}
                        placeholder={t(`${P}add_user_id`)}
                        aria-label={t(`${P}add_user_id`)}
                        onChange={(ev) => setExtra(ev.target.value)}
                        onKeyDown={(ev) => {
                            if (ev.key === "Enter") {
                                ev.preventDefault();
                                addExtra();
                            }
                        }}
                    />
                    <button type="button" className="tm-action tm-action--small" onClick={addExtra}>
                        {t(`${P}add`)}
                    </button>
                </span>
            </fieldset>
            {error && (
                <div className="tm-error" role="alert">
                    {error}
                </div>
            )}
            <div className="tm-actions">
                <span className="tm-spacer" />
                <button type="button" className="tm-action" onClick={() => onDone(null)}>
                    {t(`${P}cancel`)}
                </button>
                <button type="submit" className="tm-action tm-action--primary" disabled={busy}>
                    {t(`${P}save`)}
                </button>
            </div>
        </form>
    );
}
