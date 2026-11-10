import type { JSX, ReactNode } from "react";
import type {
    CustomMessageComponentProps,
    CustomMessageRenderFunction,
    CustomMessageRenderHints,
    MatrixEvent,
} from "@element-hq/element-web-module-api";

/**
 * Shared message rendering for the Teams suite (teamwork, tag-mentions, files-hub, …).
 *
 * Element uses only the FIRST registered renderer whose filter matches an event, so two modules that
 * both decorate a message (an urgent message that uses a tag and links a SharePoint file) would
 * hide each other. Instead, each suite module adds an entry to one chain on `window`, and the first
 * module to load registers two Element renderers that run the chain:
 *   - entries with `replaces` draw the message body themselves (at most one is used, the first);
 *   - the other entries wrap what's inside them, like middleware, in the order they were added.
 * Editing is allowed unless a replacing entry matched, so there are two registrations with
 * disjoint filters. This file is copied verbatim into each suite module; keep the copies identical
 * and bump CHAIN_VERSION when the shape changes.
 */

export const CHAIN_VERSION = 1;

type Render = (props: CustomMessageComponentProps, inner: () => ReactNode) => ReactNode;

export interface SuiteRenderer {
    /** The module's id plus a name, e.g. "teamwork/priority". Re-adding the same id replaces it. */
    id: string;
    filter(ev: MatrixEvent): boolean;
    render: Render;
    /** Draws the body itself instead of Element's (which then can't be edited). */
    replaces?: boolean;
}

interface Chain {
    version: number;
    entries: SuiteRenderer[];
    installed: boolean;
}

interface CustomComponents {
    registerMessageRenderer(
        filter: (ev: MatrixEvent) => boolean,
        renderer: CustomMessageRenderFunction,
        hints?: CustomMessageRenderHints,
    ): void;
}

function chain(): Chain {
    const w = window as unknown as { deDatanautenTeamsSuite?: Record<string, unknown> };
    const suite = (w.deDatanautenTeamsSuite ??= {});
    const existing = suite._renderChain as Chain | undefined;
    if (existing?.version === CHAIN_VERSION) return existing;
    const fresh: Chain = { version: CHAIN_VERSION, entries: existing?.entries ?? [], installed: false };
    suite._renderChain = fresh;
    return fresh;
}

function matching(c: Chain, ev: MatrixEvent): SuiteRenderer[] {
    return c.entries.filter((e) => {
        try {
            return e.filter(ev);
        } catch {
            return false;
        }
    });
}

/** Builds the nested rendering: the first replacing entry (or Element's own) inside the wrappers. */
export function compose(entries: SuiteRenderer[], props: CustomMessageComponentProps, original: () => ReactNode): ReactNode {
    const replacer = entries.find((e) => e.replaces);
    let inner: () => ReactNode = replacer ? () => replacer.render(props, original) : original;
    for (const w of entries.filter((e) => !e.replaces)) {
        const prev = inner;
        inner = () => w.render(props, prev);
    }
    return inner();
}

export function registerSuiteRenderer(components: CustomComponents, entry: SuiteRenderer): void {
    const c = chain();
    const at = c.entries.findIndex((e) => e.id === entry.id);
    if (at >= 0) c.entries[at] = entry;
    else c.entries.push(entry);
    if (c.installed) return;
    c.installed = true;
    const run: CustomMessageRenderFunction = (props, original) =>
        compose(matching(c, props.mxEvent), props, () => original?.() ?? null) as JSX.Element;
    components.registerMessageRenderer((ev) => {
        const m = matching(c, ev);
        return m.length > 0 && !m.some((e) => e.replaces);
    }, run);
    components.registerMessageRenderer((ev) => matching(c, ev).some((e) => e.replaces), run, { allowEditingEvent: false });
}
