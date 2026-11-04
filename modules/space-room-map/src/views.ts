/**
 * The map as a graphology graph that sigma.js renders: districts, groups and spaces as circles
 * that contain their rooms and sub-spaces (d3-hierarchy circle packing).
 */

import Graph from "graphology";
import { hierarchy, pack } from "d3-hierarchy";

import { DISTRICTS, type DistrictId, type Districts, type Group } from "./districts";
import type { RoomGraph, RoomInfo, RoomKind } from "./rooms";

export type NodeKind = RoomKind | "group";

export interface NodeAttrs {
    x: number;
    y: number;
    /** Radius in graph units: sizes follow the zoom. */
    size: number;
    label: string;
    /** Missing for the "Rooms" / "People" groups. */
    roomId?: string;
    kind: NodeKind;
    /** Drawn as a big circle with its children inside. */
    container: boolean;
    depth: number;
    zIndex: number;
    unread: number;
    highlight: number;
    invite: boolean;
    /** `mxc://` URL of the avatar; the map draws it once it has loaded. */
    avatar?: string;
}

export type MapGraph = Graph<NodeAttrs>;

/** What the tooltip needs, from either map. */
export type TipNode = Pick<NodeAttrs, "label" | "roomId" | "container" | "unread" | "highlight"> & {
    /** The other lines a room is on (tube map). */
    also?: string[];
};

interface TreeNode {
    key: string;
    roomId?: string;
    label: string;
    kind: NodeKind;
    value: number;
    children?: TreeNode[];
}

/** Rooms past this are left out of the "all" view, as protection against huge space graphs. */
const MAX_NODES = 20000;

/** Node keys of districts and groups, which the list on the left flies to. */
export function districtNodeKey(district: DistrictId): string {
    return `d.${district}`;
}

export function groupNodeKey(group: Group): string {
    // A space keeps its id, so a room's node key is still the path of ids above it.
    return `${districtNodeKey(group.district)}/${group.spaceId ?? `g.${group.key.replace(/\//g, "~")}`}`;
}

/**
 * Districts as the outermost circles, their groups inside: a group of a space shows the space
 * with its sub-spaces, keeping only the rooms that live in this group.
 */
export function buildAllGraph(graph: RoomGraph, districts: Districts, names: Record<DistrictId, string>): MapGraph {
    let count = 0;
    const leafValue = (r: RoomInfo): number => 1 + Math.log10(1 + r.members) * 0.5;
    const toTree = (id: string, prefix: string, ancestors: Set<string>, keep: (id: string) => boolean): TreeNode | undefined => {
        const room = graph.rooms.get(id);
        if (!room || ancestors.has(id) || count >= MAX_NODES || !keep(id)) return undefined;
        count++;
        // A room can sit in several spaces, so the node key is its path.
        const key = `${prefix}/${id}`;
        const node: TreeNode = { key, roomId: id, label: room.name, kind: room.kind, value: leafValue(room) };
        if (room.kind === "space" && room.children.length) {
            const inner = new Set(ancestors).add(id);
            node.children = room.children.map((c) => toTree(c, key, inner, keep)).filter((c): c is TreeNode => Boolean(c));
            if (!node.children.length) delete node.children;
        }
        return node;
    };

    const top: TreeNode[] = [];
    for (const district of DISTRICTS) {
        const dKey = districtNodeKey(district);
        const children: TreeNode[] = [];
        for (const g of districts.groups) {
            if (g.district !== district) continue;
            if (g.spaceId) {
                const kept = new Map<string, boolean>();
                const keptSpace = (id: string, seen = new Set<string>()): boolean => {
                    if (kept.has(id)) return kept.get(id)!;
                    if (seen.has(id)) return false;
                    seen.add(id);
                    const out = (graph.rooms.get(id)?.children ?? []).some((c) =>
                        graph.rooms.get(c)?.kind === "space" ? keptSpace(c, seen) : districts.home.get(c) === g.key,
                    );
                    kept.set(id, out);
                    return out;
                };
                const keep = (id: string): boolean =>
                    id === g.spaceId || (graph.rooms.get(id)?.kind === "space" ? keptSpace(id) : districts.home.get(id) === g.key);
                const node = toTree(g.spaceId, dKey, new Set(), keep);
                if (node) children.push({ ...node, label: g.label });
            } else {
                const key = groupNodeKey(g);
                const rooms = g.rooms.map((id) => toTree(id, key, new Set(), (c) => c === id)).filter((n): n is TreeNode => Boolean(n));
                if (rooms.length) children.push({ key, label: g.label, kind: "group", value: 0, children: rooms });
            }
        }
        if (children.length) top.push({ key: dKey, label: names[district], kind: "group", value: 0, children });
    }

    const root = hierarchy<TreeNode>({ key: "", label: "", kind: "group", value: 0, children: top })
        .sum((d) => (d.children?.length ? 0 : d.value))
        // Districts keep their order, so they keep their places; inside them, biggest first.
        .sort((a, b) => (a.depth === 1 ? 0 : (b.value ?? 0) - (a.value ?? 0)));
    const size = 64 * Math.sqrt(Math.max(1, root.leaves().length)) + 200;
    const packed = pack<TreeNode>().size([size, size]).padding((n) => (n.depth === 0 ? 24 : 8))(root);

    const g: MapGraph = new Graph();
    packed.each((n) => {
        if (n.depth === 0) return;
        const room = n.data.roomId ? graph.rooms.get(n.data.roomId) : undefined;
        const container = Boolean(n.children?.length);
        g.addNode(n.data.key, {
            x: n.x,
            // sigma's y axis points up.
            y: size - n.y,
            size: n.r,
            label: n.data.label,
            roomId: n.data.roomId,
            kind: n.data.kind,
            container,
            depth: n.depth,
            zIndex: n.depth,
            // On a space circle it tints the fill rather than being drawn.
            avatar: room?.avatar,
            ...counts(room, container ? n.leaves().map((l) => graph.rooms.get(l.data.roomId ?? "")) : []),
        });
    });
    return g;
}

export interface ScoreOptions {
    usage(roomId: string): number;
    now: number;
}

/** Usage score: visits counted by the module, recent activity and unread messages. */
export function roomScore(room: RoomInfo, opts: ScoreOptions): number {
    const days = Math.max(0, (opts.now - room.lastActive) / 86_400_000);
    return opts.usage(room.id) * 3 + Math.pow(0.5, days / 3) + (room.unread ? 0.5 : 0) + (room.highlight ? 1 : 0);
}

function counts(room: RoomInfo | undefined, leaves: Array<RoomInfo | undefined>): Pick<NodeAttrs, "unread" | "highlight" | "invite"> {
    if (leaves.length) {
        return {
            unread: leaves.reduce((sum, r) => sum + (r?.unread ?? 0), 0),
            highlight: leaves.reduce((sum, r) => sum + (r?.highlight ?? 0), 0),
            invite: false,
        };
    }
    return { unread: room?.unread ?? 0, highlight: room?.highlight ?? 0, invite: room?.invite ?? false };
}
