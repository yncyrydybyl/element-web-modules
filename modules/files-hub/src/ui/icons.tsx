import type { JSX } from "react";

import type { Category, OfficeKind } from "../files";

/** 24px, currentColor, like Compound's icons. */
export function FolderIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
            <path d="M3 5a2 2 0 0 1 2-2h4.6a2 2 0 0 1 1.4.6L12.4 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm6.6 0H5v13h14V7h-7.4L9.6 5Z" />
        </svg>
    );
}

export function DownloadIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM4 18h16v2H4v-2Z" />
        </svg>
    );
}

export function LockIcon(props: { title?: string }): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" role={props.title ? "img" : undefined} aria-hidden={props.title ? undefined : true} aria-label={props.title}>
            {props.title && <title>{props.title}</title>}
            <path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm6 10H6v8h12v-8Zm-6-8a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3Z" />
        </svg>
    );
}

const BADGES: Record<Exclude<OfficeKind, null>, { label: string; color: string }> = {
    word: { label: "W", color: "#185abd" },
    excel: { label: "X", color: "#107c41" },
    powerpoint: { label: "P", color: "#c43e1c" },
    pdf: { label: "PDF", color: "#d51928" },
    text: { label: "TXT", color: "#656d77" },
};

/** A document with a coloured badge for Office/PDF files, a generic shape otherwise. */
export function FileTypeIcon({ office, category, size = 28 }: { office: OfficeKind; category: Category; size?: number }): JSX.Element {
    const badge = office ? BADGES[office] : undefined;
    return (
        <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="fh-type-icon">
            <path d="M8 3h11l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="var(--cpd-color-bg-canvas-default, #fff)" stroke="var(--cpd-color-border-interactive-primary, #8d97a5)" strokeWidth="1.5" />
            <path d="M19 3v7h7" fill="none" stroke="var(--cpd-color-border-interactive-primary, #8d97a5)" strokeWidth="1.5" />
            {badge ? (
                <>
                    <rect x="2" y="15" width={badge.label.length > 1 ? 20 : 14} height="11" rx="2" fill={badge.color} />
                    <text x={badge.label.length > 1 ? 12 : 9} y="23.5" textAnchor="middle" fontSize={badge.label.length > 1 ? 7 : 9} fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">
                        {badge.label}
                    </text>
                </>
            ) : category === "image" ? (
                <path d="M10 24l4-5 3 3.5 2.5-3 3.5 4.5H10Zm3-9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="var(--cpd-color-icon-secondary, #656d77)" />
            ) : category === "video" ? (
                <path d="M13 15v9l7-4.5-7-4.5Z" fill="var(--cpd-color-icon-secondary, #656d77)" />
            ) : (
                <path d="M10 16h12v1.5H10V16Zm0 4h12v1.5H10V20Zm0 4h8v1.5h-8V24Z" fill="var(--cpd-color-icon-secondary, #656d77)" />
            )}
        </svg>
    );
}
