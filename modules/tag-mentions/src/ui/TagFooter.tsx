import type { JSX } from "react";

import type { UsedTag } from "../expand";
import { P, type ModuleTranslate } from "../i18n";

export interface TagFooterProps {
    t: ModuleTranslate;
    tags: UsedTag[];
    name(userId: string): string;
}

/** Below a message sent with tags: which tags, and who each one mentioned (as a tooltip). */
export function TagFooter({ t, tags, name }: TagFooterProps): JSX.Element {
    return (
        <div className="tm-footer" data-testid="tag-mentions-footer">
            <span className="tm-footer-label">{t(`${P}footer`)}</span>
            {tags.map((tag) => {
                const who = tag.room ? t(`${P}footer_room`) : (tag.user_ids ?? []).map(name).join(", ");
                return (
                    <span key={tag.name} className="tm-tag tm-tag--chip" title={who}>
                        @{tag.name}
                        {!tag.room && <span className="tm-count">{tag.user_ids?.length ?? 0}</span>}
                    </span>
                );
            })}
        </div>
    );
}
