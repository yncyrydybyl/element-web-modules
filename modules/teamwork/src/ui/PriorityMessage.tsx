import type { JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import { stripFallback, type Priority } from "../priority";

export interface PriorityMessageProps {
    t: ModuleTranslate;
    priority: Priority;
    body: string;
}

/** An important or urgent message: a coloured edge and label, then the text without the fallback prefix. */
export function PriorityMessage({ t, priority, body }: PriorityMessageProps): JSX.Element {
    return (
        <div className={`tw-priority tw-priority--${priority}`} data-testid={`teamwork-${priority}`}>
            <span className={`tw-badge tw-badge--${priority}`}>
                {priority === "urgent" ? "🚨" : "❗"} {t(`${P}${priority}`)}
            </span>
            <div className="tw-priority-text mx_EventTile_body">{stripFallback(body)}</div>
        </div>
    );
}
