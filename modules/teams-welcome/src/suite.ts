/**
 * How the modules of the "Teams users at home in Element" suite find out about each other.
 *
 * Convention (one rule, two ways to satisfy it). A sibling module counts as loaded if either
 *
 *   1. it registered itself in the shared registry during `load()`:
 *        (window.deDatanautenTeamsSuite ??= {})["<id>"] = { version: "<semver>" };
 *   2. or its stylesheet is in the page: an element with the ID `de-datanauten-<id>-style`
 *      (the `<style>` the repo's modules already inject; teamwork and keyboard-shortcuts do).
 *
 * Element runs all `load()`s in parallel, so ask lazily (when rendering), never inside `load()`.
 * IDs are the module directory names: activity, tag-mentions, profile-status, files-hub, teamwork,
 * keyboard-shortcuts, teams-welcome.
 */

export const REGISTRY_GLOBAL = "deDatanautenTeamsSuite";

export type SiblingId = "activity" | "tag-mentions" | "profile-status" | "files-hub" | "teamwork" | "keyboard-shortcuts";

export interface SuiteEntry {
    version: string;
}

type SuiteWindow = { [REGISTRY_GLOBAL]?: Record<string, SuiteEntry | undefined> };

export function registerInSuite(id: string, version: string): void {
    const w = window as unknown as SuiteWindow;
    const registry = (w[REGISTRY_GLOBAL] ??= {});
    registry[id] = { version };
}

export function isSiblingLoaded(id: string): boolean {
    const registry = (window as unknown as SuiteWindow)[REGISTRY_GLOBAL];
    if (registry && typeof registry === "object" && registry[id]) return true;
    return !!document.getElementById(`de-datanauten-${id}-style`);
}
