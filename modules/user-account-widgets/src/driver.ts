import {
    OpenIDRequestState,
    WidgetDriver,
    type Capability,
    type IGetMediaConfigResult,
    type IOpenIDUpdate,
    type IReadEventRelationsResult,
    type IRoomEvent,
    type ISearchUserDirectoryResult,
    type ISendEventDetails,
    type IWidgetApiErrorResponseDataDetails,
    type SimpleObservable,
} from "matrix-widget-api";

import type { SdkClient, SdkEvent } from "./client";

/**
 * A widget driver for a widget that belongs to the user, not to a room: it acts in `roomId`, the
 * room it was opened in. Modelled on Element's `ElementWidgetDriver`; what it leaves out (stickers,
 * always-on-screen, OpenID, delayed and sticky events, TURN, calls) the widget is never granted.
 */
export class UserWidgetDriver extends WidgetDriver {
    public constructor(
        private readonly client: SdkClient,
        private readonly roomId: string,
        private readonly approve: (requested: Set<Capability>) => Promise<Set<Capability>>,
    ) {
        super();
    }

    public validateCapabilities(requested: Set<Capability>): Promise<Set<Capability>> {
        return this.approve(requested);
    }

    public async sendEvent(
        eventType: string,
        content: unknown,
        stateKey: string | null = null,
        targetRoomId: string | null = null,
    ): Promise<ISendEventDetails> {
        const roomId = targetRoomId || this.roomId;
        let r: { event_id: string };
        if (stateKey !== null) {
            r = await this.client.sendStateEvent(roomId, eventType, content, stateKey);
        } else if (eventType === "m.room.redaction") {
            r = await this.client.redactEvent(roomId, (content as { redacts: string }).redacts);
        } else {
            r = await this.client.sendEvent(roomId, eventType, content);
        }
        return { roomId, eventId: r.event_id };
    }

    public async sendToDevice(
        eventType: string,
        encrypted: boolean,
        contentMap: { [userId: string]: { [deviceId: string]: object } },
    ): Promise<void> {
        if (!encrypted) {
            await this.client.queueToDevice({
                eventType,
                batch: Object.entries(contentMap).flatMap(([userId, perDevice]) =>
                    Object.entries(perDevice).map(([deviceId, payload]) => ({ userId, deviceId, payload })),
                ),
            });
            return;
        }
        const crypto = this.client.getCrypto();
        if (!crypto) throw new Error("E2EE not enabled");
        // One encryption per distinct payload, as Element does.
        const byPayload = new Map<string, { userId: string; deviceId: string }[]>();
        for (const [userId, perDevice] of Object.entries(contentMap)) {
            for (const [deviceId, payload] of Object.entries(perDevice)) {
                const key = JSON.stringify(payload);
                const recipients = byPayload.get(key) ?? [];
                byPayload.set(key, recipients);
                // "*" means every device; the server expands it only for plaintext.
                const ids =
                    deviceId === "*"
                        ? [...((await crypto.getUserDeviceInfo([userId], true)).get(userId)?.keys() ?? [])]
                        : [deviceId];
                for (const id of ids) recipients.push({ userId, deviceId: id });
            }
        }
        await Promise.all(
            [...byPayload].map(async ([payload, recipients]) =>
                this.client.queueToDevice(await crypto.encryptToDeviceMessages(eventType, recipients, JSON.parse(payload))),
            ),
        );
    }

    public async readRoomTimeline(
        roomId: string,
        eventType: string,
        msgtype: string | undefined,
        stateKey: string | undefined,
        limit: number,
        since: string | undefined,
    ): Promise<IRoomEvent[]> {
        limit = limit > 0 ? limit : Number.MAX_SAFE_INTEGER;
        const room = this.client.getRoom(roomId);
        if (!room) return [];
        const out: IRoomEvent[] = [];
        const events = room.getLiveTimeline().getEvents(); // oldest first
        for (let i = events.length - 1; i >= 0 && out.length < limit; i--) {
            const ev = events[i];
            if (ev.getId() === since) break;
            if (ev.getType() !== eventType) continue;
            if (eventType === "m.room.message" && msgtype && msgtype !== ev.getContent()["msgtype"]) continue;
            if (stateKey !== undefined && ev.getStateKey() !== stateKey) continue;
            out.push(raw(ev));
        }
        return out;
    }

    public async readRoomState(roomId: string, eventType: string, stateKey: string | undefined): Promise<IRoomEvent[]> {
        const state = this.client.getRoom(roomId)?.getLiveTimeline().getState("f");
        if (!state) return [];
        if (stateKey === undefined) return state.getStateEvents(eventType).map(raw);
        const ev = state.getStateEvents(eventType, stateKey);
        return ev ? [raw(ev)] : [];
    }

    public async readEventRelations(
        eventId: string,
        roomId?: string,
        relationType?: string,
        eventType?: string,
        from?: string,
        to?: string,
        limit?: number,
        direction?: "f" | "b",
    ): Promise<IReadEventRelationsResult> {
        const { events, nextBatch, prevBatch } = await this.client.relations(
            roomId ?? this.roomId,
            eventId,
            relationType ?? null,
            eventType ?? null,
            { from, to, limit, dir: direction },
        );
        return { chunk: events.map(raw), nextBatch: nextBatch ?? undefined, prevBatch: prevBatch ?? undefined };
    }

    public askOpenID(observer: SimpleObservable<IOpenIDUpdate>): void {
        // An OpenID token tells the widget's server who the user is; not offered for user widgets.
        observer.update({ state: OpenIDRequestState.Blocked });
    }

    public async searchUserDirectory(searchTerm: string, limit?: number): Promise<ISearchUserDirectoryResult> {
        const { limited, results } = await this.client.searchUserDirectory({ term: searchTerm, limit });
        return {
            limited,
            results: results.map((r) => ({ userId: r.user_id, displayName: r.display_name, avatarUrl: r.avatar_url })),
        };
    }

    public async getMediaConfig(): Promise<IGetMediaConfigResult> {
        return await this.client.getMediaConfig();
    }

    public async uploadFile(file: XMLHttpRequestBodyInit): Promise<{ contentUri: string }> {
        const { content_uri } = await this.client.uploadContent(file);
        return { contentUri: content_uri };
    }

    public async downloadFile(contentUri: string): Promise<{ file: XMLHttpRequestBodyInit }> {
        const url = this.client.mxcUrlToHttp(contentUri, undefined, undefined, undefined, false, true, true);
        if (!url) throw new Error(`Not a media URI: ${contentUri}`);
        const token = this.client.getAccessToken();
        const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
        return { file: await res.blob() };
    }

    public getKnownRooms(): string[] {
        return this.client.getRooms().map((r) => r.roomId);
    }

    public processError(error: unknown): IWidgetApiErrorResponseDataDetails | undefined {
        const e = error as { asWidgetApiErrorData?: () => unknown };
        return typeof e?.asWidgetApiErrorData === "function"
            ? ({ matrix_api_error: e.asWidgetApiErrorData() } as IWidgetApiErrorResponseDataDetails)
            : undefined;
    }
}

function raw(ev: SdkEvent): IRoomEvent {
    return ev.getEffectiveEvent() as IRoomEvent;
}
