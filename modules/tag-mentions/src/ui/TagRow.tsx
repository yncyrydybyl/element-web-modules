import type { JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import type { ResolvedTag } from "../tags";

export interface TagRowProps {
    t: ModuleTranslate;
    tag: ResolvedTag;
    name(userId: string): string;
    max: number;
}

/** Shows whether a tag can be used here, for the picker and the composer suggestions. */
export function usable(tag: ResolvedTag, max: number): boolean {
    if (!tag.allowed) return false;
    if (tag.kind === "channel") return true;
    return tag.members.length > 0 && tag.members.length <= max;
}

/** One tag: name, description, who it notifies and why it might not. */
export function TagRow({ t, tag, name, max }: TagRowProps): JSX.Element {
    const description =
        tag.kind === "channel"
            ? t(`${P}channel_desc`)
            : tag.kind === "team"
              ? t(`${P}team_desc`, { space: tag.label })
              : tag.label;
    const names = tag.members.slice(0, 6).map(name).join(", ") + (tag.members.length > 6 ? ` +${tag.members.length - 6}` : "");
    return (
        <span className="tm-row">
            <span className="tm-row-head">
                <span className="tm-tag">@{tag.name}</span>
                {description && <span className="tm-row-desc">{description}</span>}
                {tag.kind === "tag" && tag.source?.fromSpace && <span className="tm-row-source">{t(`${P}from_space`, { name: tag.source.name })}</span>}
            </span>
            {tag.kind !== "channel" && tag.members.length > 0 && (
                <span className="tm-row-members">
                    {t(`${P}notifies`, { count: tag.members.length })}: {names}
                </span>
            )}
            {!tag.allowed && <span className="tm-row-warn">{t(`${P}not_allowed`)}</span>}
            {tag.allowed && tag.kind !== "channel" && tag.members.length > max && <span className="tm-row-warn">{t(`${P}over_max`, { max })}</span>}
            {tag.kind === "tag" && tag.absent.length > 0 && (
                <span className="tm-row-note">{t(`${P}absent`, { names: tag.absent.map(name).join(", ") })}</span>
            )}
        </span>
    );
}
