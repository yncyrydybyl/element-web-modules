import { ClientWidgetApi, Widget, type Capability, type IRoomEvent } from "matrix-widget-api";

import { currentTheme, onThemeChange, type SdkClient, type SdkEvent, type SdkRoom } from "./client";
import { UserWidgetDriver } from "./driver";
import type { UserWidget } from "./widgets";

const LOG = "[user-account-widgets]";

/** Element's sandbox for room widgets (AppTile), so widgets behave the same here. */
const SANDBOX = "allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-presentation allow-downloads";
const ALLOW = "clipboard-write; fullscreen; autoplay; encrypted-media";

export type Approve = (widget: UserWidget, requested: Set<Capability>) => Promise<Set<Capability>>;

/** A widget served from Element's own origin could read Element's storage, keys included. */
export function isSameOriginAsElement(url: string, origin = window.location.origin): boolean {
    try {
        return new URL(url).origin === origin;
    } catch {
        return true;
    }
}

/** The widget model; entries written by other clients may lack a creator, which matrix-widget-api requires. */
function toWidget(widget: UserWidget, client: SdkClient): Widget {
    return new Widget({ ...widget, creatorUserId: widget.creatorUserId || client.getUserId() || "unknown" });
}

/** The iframe URL: the widget's template filled in, plus `widgetId` and `parentUrl` like Element adds. */
export function embedUrl(widget: UserWidget, roomId: string, client: SdkClient, room: SdkRoom | null): string {
    const userId = client.getUserId() ?? "";
    const templated = toWidget(widget, client).getCompleteUrl({
        widgetRoomId: roomId,
        currentUserId: userId,
        userDisplayName: room?.getMember(userId)?.name,
        clientId: "io.element.web",
        clientTheme: currentTheme(),
        clientLanguage: document.documentElement.lang || navigator.language,
        deviceId: client.getDeviceId() ?? undefined,
        baseUrl: client.baseUrl,
    });
    const url = new URL(templated);
    url.searchParams.set("widgetId", widget.id);
    url.searchParams.set("parentUrl", window.location.href.split("#", 2)[0]);
    // URL parsers encode "$"; it has no meaning in HTTP and widgets expect it verbatim.
    return url.toString().replace(/%24/g, "$");
}

/** One running widget in one room: the iframe, the widget API and the event feed. */
export class WidgetHost {
    public readonly iframe: HTMLIFrameElement;
    private readonly api: ClientWidgetApi;
    private readonly pendingDecryption = new WeakSet<SdkEvent>();
    private readonly stopTheme: () => void;
    private stopped = false;

    public constructor(
        private readonly widget: UserWidget,
        private readonly roomId: string,
        container: HTMLElement,
        private readonly client: SdkClient,
        approve: Approve,
    ) {
        this.iframe = document.createElement("iframe");
        this.iframe.className = "uaw-frame";
        this.iframe.title = widget.name;
        this.iframe.setAttribute("sandbox", SANDBOX);
        this.iframe.setAttribute("allow", ALLOW);
        this.iframe.referrerPolicy = "no-referrer";
        // The transport binds to contentWindow, which exists only once the iframe is in the document.
        container.appendChild(this.iframe);

        const driver = new UserWidgetDriver(client, roomId, (requested) => approve(widget, requested));
        this.api = new ClientWidgetApi(toWidget(widget, client), this.iframe, driver);
        this.api.setViewedRoomId(roomId);
        this.api.once("ready", () => void this.api.updateTheme({ name: currentTheme() }));
        this.stopTheme = onThemeChange((name) => void this.api.updateTheme({ name }).catch(noop));

        client.on("Room.timeline", this.onTimeline);
        client.on("Event.decrypted", this.onDecrypted);
        client.on("RoomState.events", this.onState);
        client.on("receivedToDeviceMessage", this.onToDevice);

        this.iframe.src = embedUrl(widget, roomId, client, client.getRoom(roomId));
    }

    public get widgetId(): string {
        return this.widget.id;
    }

    public stop(): void {
        if (this.stopped) return;
        this.stopped = true;
        this.client.off("Room.timeline", this.onTimeline);
        this.client.off("Event.decrypted", this.onDecrypted);
        this.client.off("RoomState.events", this.onState);
        this.client.off("receivedToDeviceMessage", this.onToDevice);
        this.stopTheme();
        this.api.stop();
        this.api.removeAllListeners();
        // Makes sure camera, audio and timers of the widget end now, not when GC gets to it.
        this.iframe.src = "about:blank";
        this.iframe.remove();
    }

    private readonly onTimeline = (
        ev: SdkEvent,
        room: SdkRoom | undefined,
        toStartOfTimeline: boolean | undefined,
        removed: boolean,
        data: { liveEvent?: boolean } | undefined,
    ): void => {
        // Only new events: no backfill, no history the widget didn't ask for.
        if (toStartOfTimeline || removed || !data?.liveEvent || room?.roomId !== this.roomId) return;
        void this.client.decryptEventIfNeeded?.(ev);
        this.feed(ev);
    };

    private readonly onDecrypted = (ev: SdkEvent): void => {
        if (this.pendingDecryption.delete(ev)) this.feed(ev);
    };

    private feed(ev: SdkEvent): void {
        if (ev.isBeingDecrypted() || ev.isDecryptionFailure()) {
            this.pendingDecryption.add(ev);
            return;
        }
        this.api.feedEvent(ev.getEffectiveEvent() as IRoomEvent).catch((e) => console.warn(`${LOG} feeding an event failed`, e));
    }

    private readonly onState = (ev: SdkEvent): void => {
        if (ev.getRoomId() !== this.roomId) return;
        this.api.feedStateUpdate(ev.getEffectiveEvent() as IRoomEvent).catch((e) => console.warn(`${LOG} feeding state failed`, e));
    };

    private readonly onToDevice = ({ message, encryptionInfo }: { message: IRoomEvent; encryptionInfo: unknown }): void => {
        void this.api.feedToDevice(message, encryptionInfo != null).catch(noop);
    };
}

function noop(): void {}
