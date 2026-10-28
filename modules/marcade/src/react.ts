// React comes from the host: Element Web sets window.React before loading modules (module API contract).
// Everything that imports "react" is aliased here by vite.config.ts, so the bundle contains no React copy.
import type * as ReactNS from "react";

const R = (globalThis as unknown as { React: typeof ReactNS }).React;

export default R;
export const createElement = R?.createElement;
export const Fragment = R?.Fragment;
export const useState = R?.useState;
export const useEffect = R?.useEffect;
export const useRef = R?.useRef;
export const useCallback = R?.useCallback;
export const useId = R?.useId;
export const useMemo = R?.useMemo;
