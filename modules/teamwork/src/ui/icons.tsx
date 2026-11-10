import type { JSX, SVGAttributes } from "react";

/** Icons for the composer's "+" menu; 24px and currentColor like Compound's. */

export function CalendarIcon(props: SVGAttributes<SVGElement>): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
            <path d="M8 2v2h8V2h2v2h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V2h2Zm11 8H5v9h14v-9Zm-6 1v3.6l2.2 2.2-1.4 1.4-2.8-2.8V11h2Z" />
        </svg>
    );
}

export function ImportantIcon(props: SVGAttributes<SVGElement>): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
            <path d="M11 3h2v12h-2V3Zm0 15h2v3h-2v-3Z" />
        </svg>
    );
}

export function TrophyIcon(props: SVGAttributes<SVGElement>): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
            <path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v2H8v-2h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3Zm0 4H6v1a2 2 0 0 0 1 1.7V7Zm10 0v2.7A2 2 0 0 0 18 8V7h-1ZM9 5v5a3 3 0 0 0 6 0V5H9Z" />
        </svg>
    );
}
