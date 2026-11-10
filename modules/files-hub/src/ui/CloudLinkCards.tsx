import type { JSX } from "react";

import type { CloudLink } from "../links";
import { P, type ModuleTranslate } from "../i18n";
import { FileTypeIcon } from "./icons";

const OFFICE: Partial<Record<CloudLink["kind"], "word" | "excel" | "powerpoint" | "pdf">> = {
    word: "word",
    excel: "excel",
    powerpoint: "powerpoint",
    pdf: "pdf",
};

/** Labels for SharePoint / OneDrive links under the message; built from the URL only. */
export function CloudLinkCards({ t, links }: { t: ModuleTranslate; links: CloudLink[] }): JSX.Element {
    return (
        <div className="fh-cloud-cards" data-testid="fileshub-cloud-cards">
            {links.map((l) => {
                const kind = t(`${P}cloud_kind_${l.kind}`);
                const service = t(`${P}cloud_${l.service}`);
                return (
                    <a key={l.url} className="fh-cloud-card" href={l.url} target="_blank" rel="noreferrer noopener" title={t(`${P}cloud_hint`)}>
                        <FileTypeIcon office={OFFICE[l.kind] ?? null} category={l.kind === "image" ? "image" : l.kind === "video" ? "video" : "document"} size={32} />
                        <span className="fh-cloud-text">
                            <span className="fh-cloud-title">{l.name ?? kind}</span>
                            <span className="fh-cloud-sub">
                                {l.name ? `${kind} · ` : ""}
                                {service}
                                {l.tenant ? ` (${l.tenant})` : ""}
                            </span>
                        </span>
                    </a>
                );
            })}
        </div>
    );
}
