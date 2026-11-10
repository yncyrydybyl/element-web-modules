/**
 * Expands tags in messages sent from Element's composer. Element's composers (plain and rich
 * text) send through `MatrixClient.sendMessage`, which builds the local echo and encrypts after
 * this point, so the expanded content is what gets encrypted, shown and sent. Resending a failed
 * message goes through `resendEvent` and isn't expanded twice. Internal: checked against Element
 * Web v1.12.33.
 */

import type { SdkClient, SendMessage } from "./client";

const ORIGINAL = Symbol.for("de.datanauten.tag_mentions.originalSendMessage");

type Patched = SendMessage & { [ORIGINAL]?: SendMessage };

/** Returns the new content, or undefined to send the message unchanged. Must be synchronous. */
export type Transform = (roomId: string, content: Record<string, unknown>) => Record<string, unknown> | undefined;

export function installSendHook(client: SdkClient, transform: Transform): (() => void) | undefined {
    const current = client.sendMessage as Patched | undefined;
    if (typeof current !== "function") return undefined;
    const original = current[ORIGINAL] ?? current;
    const patched: Patched = function (this: unknown, roomId, a, b, c) {
        const contentFirst = typeof a !== "string" && a !== null;
        const content = (contentFirst ? a : b) as Record<string, unknown> | undefined;
        let next: Record<string, unknown> | undefined;
        try {
            next = content && typeof content === "object" ? transform(roomId, content) : undefined;
        } catch (e) {
            console.warn("[tag-mentions] Expanding tags failed; sending unchanged", e);
        }
        if (!next) return original.call(client, roomId, a, b, c);
        return contentFirst ? original.call(client, roomId, next, b, c) : original.call(client, roomId, a, next, c);
    };
    patched[ORIGINAL] = original;
    client.sendMessage = patched;
    return () => {
        if (client.sendMessage === patched) client.sendMessage = original;
    };
}
