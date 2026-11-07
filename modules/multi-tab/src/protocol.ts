import type { WireError } from "./channel";

/** The messages between engine and mirrors (see engine.ts and mirror.ts for who sends what). */

export interface HelloReply {
    ready: boolean;
    /** The engine's store fell back to memory: it has no snapshot for mirrors to boot from. */
    broken?: boolean;
    engineTab: string;
    /** Element's session-lock owner id of this engine, so a promoted mirror can clear it once this tab is gone. */
    owner: string | null;
}

export type BatchResult = { ok: unknown } | { err: WireError };

export interface FlushReply {
    /** The sync token of the snapshot in IndexedDB, which a booting mirror starts from. */
    token: string | null;
    accessToken: string | null;
    tokenSeq: number;
}

export interface SyncRequest {
    since: string;
    /** The `tokenSeq` of the access token the mirror has: the reply carries the token only if it changed. */
    tokenSeq?: number;
}

export interface PingReply {
    state: string | null;
}

/** The sync state an engine reports once another tab took over from it (fenced). */
export const STOPPED = "STOPPED";

export interface SyncReply {
    text?: string;
    next?: string;
    /** Only when it changed since the mirror's `tokenSeq`: replies to one tab aren't secret from the others. */
    accessToken?: string | null;
    tokenSeq?: number;
    resync?: boolean;
}

export interface DecryptRequest {
    roomId: string;
    events: Record<string, unknown>[];
}

export type DecryptResult = { ok: Record<string, unknown> } | { err: { code: string; message: string } };

export interface EncryptRequest {
    roomId: string;
    type: string;
    content: Record<string, unknown>;
    stateKey?: string;
}

export interface EncryptReply {
    type: string;
    content: Record<string, unknown>;
    senderKey: string;
    claimedKey: string;
}
