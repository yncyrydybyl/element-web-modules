import type { Api, DialogProps, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { ActivityFeed, type ActivityItem } from "./activity";
import { getSdkClient, openEvent, type SdkClient } from "./client";
import { P, translations, type ModuleTranslate } from "./i18n";
import { ActivityList, LiveActivityBell, type ActivityListProps } from "./ui/ActivityList";
import css from "./ui/styles.css?inline";

const STYLE_ID = "de-datanauten-activity-style";
/** The activity page's route (`#/activity`) and its space panel item. */
const ACTIVITY_PATH = "activity";
const SPACE_KEY = "de.datanauten.activity";
/** How often to look for the client until it exists (reactions must be caught from the first sync). */
const WATCH_POLL_MS = 200;

type FeedProps = Omit<ActivityListProps, "variant">;

export class ActivityModule implements Module {
    // 2.0.0 is the first release with `openDialog` and `extras`.
    public static readonly moduleApiVersion = "^2.0.0";

    private readonly feed = new ActivityFeed();
    private started?: SdkClient;
    private watched?: SdkClient;
    private pollTimer?: ReturnType<typeof setInterval>;

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        injectStyle();
        this.registerPage();
        this.api.extras.addRoomHeaderButtonCallback(() => (
            <button
                key="activity"
                type="button"
                className="act-header-button"
                data-testid="activity-button"
                aria-label={this.t(`${P}title`)}
                title={this.t(`${P}title`)}
                onClick={this.openDialog}
            >
                <LiveActivityBell count={this.count} subscribe={this.subscribe} />
            </button>
        ));
        // Reactions to older messages only pass by as they sync (see ReactionBuffer), so start
        // listening as soon as there is a client, and build the feed once the first sync is done.
        this.pollTimer = setInterval(this.tick, WATCH_POLL_MS);
        this.tick();
    }

    /** Stops listening. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.feed.detach();
    }

    private tick = (): void => {
        const client = getSdkClient();
        if (!client) return;
        if (this.watched !== client) {
            this.watched = client;
            this.feed.reactions.watch(client);
        }
        if (this.started === client) return;
        if (client.isInitialSyncComplete && !client.isInitialSyncComplete()) return;
        this.started = client;
        this.feed.attach(client);
        if (this.pollTimer) clearInterval(this.pollTimer);
    };

    /**
     * The Teams-style entry: an "Activity" item in the space panel that opens a full page next to it.
     * Both APIs are alpha (module API 2.3.0, Element 1.12.33); without them the feed is only in the
     * room header.
     */
    private registerPage(): void {
        const extras = this.api.extras as Partial<Api["extras"]>;
        const navigation = this.api.navigation as Partial<Api["navigation"]> | undefined;
        if (!extras.setSpacePanelItem || !navigation?.registerLocationRenderer) return;
        navigation.registerLocationRenderer(ACTIVITY_PATH, () => <ActivityList {...this.props()} variant="page" />);
        extras.setSpacePanelItem(SPACE_KEY, {
            label: this.t(`${P}title`),
            tooltip: this.t(`${P}title`),
            className: "act-space-item",
            icon: <LiveActivityBell count={this.count} subscribe={this.subscribe} />,
            onSelected: () => {
                window.location.hash = `#/${ACTIVITY_PATH}`;
            },
        });
    }

    private props(): FeedProps {
        return {
            t: this.t,
            list: this.list,
            subscribe: this.subscribe,
            refresh: this.refresh,
            markAllRead: this.markAllRead,
            roomName: (id) => getSdkClient()?.getRoom(id)?.name ?? id,
            formatTime,
            open: (i: ActivityItem) => openEvent(i.roomId, i.eventId),
        };
    }

    private openDialog = (): void => {
        this.tick();
        this.api.openDialog<void, FeedProps>({ title: this.t(`${P}title`) }, ActivityDialog, this.props());
    };

    private list = (): ActivityItem[] => this.feed.list();
    private count = (): number => this.feed.unreadCount();
    private refresh = (): Promise<void> => this.feed.refresh();
    private markAllRead = (): Promise<void> => this.feed.markAllRead();
    private subscribe = (cb: () => void): (() => void) => this.feed.subscribe(cb);

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables as Record<string, string>);
}

function ActivityDialog(props: FeedProps & DialogProps<void>): React.JSX.Element {
    return <ActivityList {...props} variant="dialog" onClose={props.onCancel} />;
}

/** Like Teams: the time for today, the date otherwise. */
function formatTime(ts: number): string {
    const d = new Date(ts);
    if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default ActivityModule satisfies ModuleFactory;
