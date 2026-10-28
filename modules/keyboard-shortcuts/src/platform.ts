/** Same detection as Element Web's `src/Keyboard.ts`. */
export const IS_MAC = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");

/** Element Desktop exposes `window.electron`. */
export const IS_ELECTRON = typeof window !== "undefined" && Boolean((window as { electron?: unknown }).electron);
