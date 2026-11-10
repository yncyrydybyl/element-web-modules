import type { JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import { FOCUS_MAX_AGE, type ProfileStore } from "../profileStore";
import { CardView, presentNow, StatusLine, useProfile } from "./common";

export interface PersonViewProps {
    t: ModuleTranslate;
    store: ProfileStore;
    userId: string;
    /** Element already shows the MSC4426 status here (its labs feature is on): don't repeat it. */
    hideStatus?: boolean;
    /** Shown for one's own profile. */
    onEditStatus?(): void;
    onEditCard?(): void;
    /** Say "No status" instead of rendering nothing. */
    showEmpty?: boolean;
}

/** Status and profile card of one person: in the user info panel and in the DM header's dialog. */
export function PersonView({ t, store, userId, hideStatus, onEditStatus, onEditCard, showEmpty }: PersonViewProps): JSX.Element | null {
    const info = useProfile(store, userId, FOCUS_MAX_AGE);
    const p = presentNow(info);
    const card = info?.card ?? {};
    const hasCard = Object.keys(card).length > 0;
    if (!p && !hasCard && !onEditStatus && !onEditCard) return showEmpty ? <p className="ps-hint">{t(`${P}no_status`)}</p> : null;
    return (
        <div className="ps-person" data-testid="profile-status-person" data-user-id={userId}>
            {!hideStatus && p && <StatusLine p={p} t={t} />}
            <CardView card={card} t={t} />
            {(onEditStatus || onEditCard) && (
                <div className="ps-person-actions">
                    {onEditStatus && (
                        <button type="button" className="ps-button ps-button--link" data-testid="profile-status-edit-status" onClick={onEditStatus}>
                            {t(`${P}menu_set_status`)}
                        </button>
                    )}
                    {onEditCard && (
                        <button type="button" className="ps-button ps-button--link" data-testid="profile-status-edit-card" onClick={onEditCard}>
                            {t(`${P}menu_edit_card`)}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function PersonDialog(props: PersonViewProps & DialogProps<void>): JSX.Element {
    return (
        <div className="ps-dialog" data-testid="profile-status-person-dialog">
            <PersonView {...props} showEmpty />
            <div className="ps-buttons">
                <span className="ps-spacer" />
                <button type="button" className="ps-button ps-button--primary" onClick={props.onCancel}>
                    {props.t(`${P}close`)}
                </button>
            </div>
        </div>
    );
}
