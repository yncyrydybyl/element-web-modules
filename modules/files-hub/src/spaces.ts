import { isJoined, isSpace, type SdkClient } from "./client";

export interface SpaceInfo {
    roomId: string;
    name: string;
}

/** The spaces the user is in, by name. */
export function joinedSpaces(client: SdkClient): SpaceInfo[] {
    return client
        .getRooms()
        .filter((r) => isSpace(r) && isJoined(r))
        .map((r) => ({ roomId: r.roomId, name: r.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/** Rooms (not spaces) in a space and its subspaces, from `m.space.child` state. */
export function roomsInSpace(client: SdkClient, spaceId: string): Set<string> {
    const out = new Set<string>();
    const seen = new Set<string>();
    const walk = (id: string): void => {
        if (seen.has(id)) return;
        seen.add(id);
        const space = client.getRoom(id);
        const children = space?.currentState?.getStateEvents("m.space.child") ?? [];
        for (const ev of children) {
            const childId = ev.getStateKey?.();
            // A child event with empty content is a removed child.
            if (!childId || !Array.isArray(ev.getContent().via)) continue;
            const child = client.getRoom(childId);
            if (child && isSpace(child)) walk(childId);
            else out.add(childId);
        }
    };
    walk(spaceId);
    return out;
}
