import type { Api, DialogProps, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { getSdkClient, isJoined, isSpace, openEvent } from "./client";
import { CONFIG_KEY, parseConfig, type FilesHubConfig } from "./config";
import type { FileItem } from "./files";
import { P, translations, type ModuleTranslate } from "./i18n";
import { findCloudLinks, mayHaveCloudLink } from "./links";
import { fileBytes, saveAs } from "./media";
import { FileIndex } from "./scanner";
import { joinedSpaces, roomsInSpace } from "./spaces";
import { registerSuiteRenderer } from "./suiteRender";
import { CloudLinkCards } from "./ui/CloudLinkCards";
import { FilesView, type FilesViewProps } from "./ui/FilesView";
import { FolderIcon } from "./ui/icons";
import css from "./ui/styles.css?inline";

const STYLE_ID = "de-datanauten-files-hub-style";
/** The Files page's route (`#/files-hub`) and its space panel item. */
export const PAGE_PATH = "files-hub";
const SPACE_KEY = "de.datanauten.files_hub";

type ViewProps = Omit<FilesViewProps, "variant" | "initialRoomId" | "onClose">;

export class FilesHubModule implements Module {
    // 2.0.0 has openDialog, extras (room header) and customComponents; the page needs the alpha
    // `navigation.registerLocationRenderer` and `extras.setSpacePanelItem` (2.3.0, feature-checked).
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: FilesHubConfig;
    private index!: FileIndex;
    private viewProps!: ViewProps;

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        try {
            this.config = parseConfig(this.api.config.get(CONFIG_KEY));
        } catch (e) {
            console.error(`[files-hub] Invalid "${CONFIG_KEY}" config`, e);
            throw new Error("Errors in module configuration for the Files hub module");
        }
        this.api.i18n.register(translations);
        injectStyle();
        this.index = new FileIndex(getSdkClient, this.config);
        this.viewProps = this.makeViewProps();

        this.api.extras.addRoomHeaderButtonCallback((roomId) => (
            <button
                key="files-hub"
                type="button"
                className="fh-header-button"
                data-testid="fileshub-header-button"
                aria-label={this.t(`${P}button`)}
                title={this.t(`${P}button`)}
                onClick={() => this.openDialog(roomId)}
            >
                <FolderIcon />
            </button>
        ));

        this.registerPage();

        if (this.config.cloud_link_cards) {
            // Renders Element's own message and adds the cards below it, so editing keeps working.
            registerSuiteRenderer(this.api.customComponents, {
                id: "files-hub/cloud-links",
                filter: (ev) =>
                    ev.type === "m.room.message" && typeof ev.content.body === "string" && mayHaveCloudLink(ev.content.body) && findCloudLinks(ev.content.body).length > 0,
                render: (props, inner) => (
                    <div className="fh-cloud-wrap">
                        {inner()}
                        <CloudLinkCards t={this.t} links={findCloudLinks(String(props.mxEvent.content.body))} />
                    </div>
                ),
            });
        }
    }

    /**
     * The Teams-style global entry: a "Files" item in the space panel that opens a full page next to
     * it. Both APIs are alpha (module API 2.3.0, Element 1.12.33); without them, the room header button
     * is the only entry.
     */
    private registerPage(): void {
        const extras = this.api.extras as Partial<Api["extras"]>;
        const navigation = this.api.navigation as Partial<Api["navigation"]> | undefined;
        if (!extras.setSpacePanelItem || !navigation?.registerLocationRenderer) return;
        navigation.registerLocationRenderer(PAGE_PATH, () => <FilesView {...this.viewProps} variant="page" />);
        extras.setSpacePanelItem(SPACE_KEY, {
            label: this.t(`${P}title`),
            tooltip: this.t(`${P}title`),
            className: "fh-space-item",
            icon: <FolderIcon />,
            onSelected: () => {
                window.location.hash = `#/${PAGE_PATH}`;
            },
        });
    }

    private openDialog(roomId: string): void {
        if (!getSdkClient()) return;
        this.api.openDialog<void, ViewProps & { initialRoomId: string }>({ title: this.t(`${P}title`) }, FilesDialog, {
            ...this.viewProps,
            initialRoomId: roomId,
        });
    }

    /** Created once, so the view's callbacks keep their identity across renders. */
    private makeViewProps(): ViewProps {
        const client = (): ReturnType<typeof getSdkClient> => getSdkClient();
        return {
            t: this.t,
            index: this.index,
            previewMaxMb: this.config.preview_max_mb,
            spaces: () => {
                const c = client();
                return c ? joinedSpaces(c) : [];
            },
            roomsInSpace: (spaceId) => {
                const c = client();
                return c ? roomsInSpace(c, spaceId) : new Set();
            },
            rooms: () =>
                (client()?.getRooms() ?? []).filter((r) => isJoined(r) && !isSpace(r)).map((r) => ({ roomId: r.roomId, name: r.name })),
            roomName: (id) => client()?.getRoom(id)?.name ?? id,
            senderName: (roomId, userId) => client()?.getRoom(roomId)?.getMember(userId)?.name ?? userId,
            formatDate,
            ready: () => {
                const c = client();
                return !!c && (c.isInitialSyncComplete?.() ?? true);
            },
            open: (item: FileItem) => openEvent(item.roomId, item.eventId),
            loadBytes: (item: FileItem, signal: AbortSignal) => {
                const c = client();
                if (!c) return Promise.reject(new Error("Not logged in"));
                return fileBytes(c, item, signal);
            },
            download: async (item: FileItem) => {
                const c = client();
                if (!c) throw new Error("Not logged in");
                saveAs(await fileBytes(c, item), item.name, item.mimetype);
            },
        };
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables as Record<string, string>);
}

function FilesDialog(props: ViewProps & { initialRoomId: string } & DialogProps<void>): React.JSX.Element {
    return <FilesView {...props} variant="dialog" onClose={props.onCancel} />;
}

function formatDate(ts: number): string {
    const d = new Date(ts);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default FilesHubModule satisfies ModuleFactory;
