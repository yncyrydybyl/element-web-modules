import type { SVGAttributes } from "react";

type IconProps = SVGAttributes<SVGElement>;

export function CheckIcon(props: IconProps): React.JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M9.55 17.575q-.2 0-.375-.062a.9.9 0 0 1-.325-.213L4.55 13q-.275-.275-.262-.712.012-.438.287-.713a.95.95 0 0 1 .7-.275q.425 0 .7.275L9.55 15.15l8.475-8.475q.275-.275.713-.275.437 0 .712.275.275.275.275.713 0 .437-.275.712l-9.2 9.2q-.15.15-.325.213a1.1 1.1 0 0 1-.375.062" />
        </svg>
    );
}

export function CloseIcon(props: IconProps): React.JSX.Element {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M6.293 6.293a1 1 0 0 1 1.414 0L12 10.586l4.293-4.293a1 1 0 1 1 1.414 1.414L13.414 12l4.293 4.293a1 1 0 0 1-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L10.586 12 6.293 7.707a1 1 0 0 1 0-1.414" />
        </svg>
    );
}

/** A compass with a "T": the guide's entry in the user menu. */
export function GuideIcon(props: IconProps): React.JSX.Element {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16m3 4a1 1 0 1 1 0 2h-2v6a1 1 0 1 1-2 0v-6H9a1 1 0 1 1 0-2z" />
        </svg>
    );
}

export function LockIcon(props: IconProps): React.JSX.Element {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M6 22q-.824 0-1.412-.587A1.93 1.93 0 0 1 4 20V10q0-.825.588-1.412A1.93 1.93 0 0 1 6 8h1V6q0-2.075 1.463-3.537Q9.926 1 12 1q2.075 0 3.537 1.463Q17 3.925 17 6v2h1q.824 0 1.413.588Q20 9.175 20 10v10q0 .824-.587 1.413A1.93 1.93 0 0 1 18 22zm0-2h12V10H6zM9 8h6V6q0-1.25-.875-2.125A2.9 2.9 0 0 0 12 3q-1.25 0-2.125.875A2.9 2.9 0 0 0 9 6z" />
        </svg>
    );
}
