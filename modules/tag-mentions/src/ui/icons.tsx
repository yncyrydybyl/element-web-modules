import type { JSX, SVGAttributes } from "react";

/** A tag with an "@": 24px and currentColor like Compound's icons. */
export function TagIcon(props: SVGAttributes<SVGElement>): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M3 4a1 1 0 0 1 1-1h7.6a1 1 0 0 1 .7.3l8.4 8.4a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0l-8.4-8.4a1 1 0 0 1-.3-.7V4Zm2 1v6.2l7.4 7.4 6.2-6.2L11.2 5H5Zm3.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
    );
}

export function HeaderButton({ label, onClick }: { label: string; onClick(): void }): JSX.Element {
    return (
        <button type="button" className="tm-header-button" data-testid="tag-mentions-header-button" aria-label={label} title={label} onClick={onClick}>
            <TagIcon />
        </button>
    );
}
