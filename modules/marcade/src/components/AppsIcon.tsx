import React from "react";

/** 2×2 grid with a plus: "apps / store". 24px viewBox like Compound icons, currentColor. */
export function AppsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <path d="M17.25 13.5a1 1 0 0 1 1 1v1.75H20a1 1 0 1 1 0 2h-1.75V20a1 1 0 1 1-2 0v-1.75H14.5a1 1 0 1 1 0-2h1.75V14.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
