/**
 * The map as a graphology graph that sigma.js renders: every space and room, spaces as circles
 * that contain their rooms and sub-spaces (d3-hierarchy circle packing).
 */

import Graph from "graphology";
import { hierarchy, pack } from "d3-hierarchy";

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

export interface GroupLabels {
    rooms: string;
    people: string;
}

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

export function buildAllGraph(graph: RoomGraph, labels: GroupLabels): MapGraph {
    let count = 0;
    const leafValue = (r: RoomInfo): number => 1 + Math.log10(1 + r.members) * 0.5;
    const toTree = (id: string, prefix: string, ancestors: Set<string>): TreeNode | undefined => {
        const room = graph.rooms.get(id);
        if (!room || ancestors.has(id) || count >= MAX_NODES) return undefined;
        count++;
        // A room can sit in several spaces, so the node key is its path.
        const key = `${prefix}/${id}`;
        const node: TreeNode = { key, roomId: id, label: room.name, kind: room.kind, value: leafValue(room) };
        if (room.kind === "space" && room.children.length) {
            const inner = new Set(ancestors).add(id);
            node.children = room.children.map((c) => toTree(c, key, inner)).filter((c): c is TreeNode => Boolean(c));
            if (!node.children.length) delete node.children;
        }
        return node;
    };

    const top = graph.topSpaces.map((id) => toTree(id, "", new Set())).filter((n): n is TreeNode => Boolean(n));
    const group = (key: string, label: string, ids: string[]): void => {
        const children = ids.map((id) => toTree(id, key, new Set())).filter((n): n is TreeNode => Boolean(n));
        if (children.length) top.push({ key, label, kind: "group", value: 0, children });
    };
    group("rooms", labels.rooms, graph.orphans);
    group("people", labels.people, graph.dms);

    const root = hierarchy<TreeNode>({ key: "", label: "", kind: "group", value: 0, children: top })
        .sum((d) => (d.children?.length ? 0 : d.value))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
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
