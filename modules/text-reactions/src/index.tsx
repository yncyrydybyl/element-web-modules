import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { ActionBarInjector } from "./actionBar";
import { P, translations } from "./i18n";
import { findRoomOfEvent, getSdkClient, RecentReactions, sendReaction } from "./reactions";
import { TextReactionDialog, type ModuleTranslate, type TextReactionDialogProps } from "./ui/TextReactionDialog";
import css from "./ui/textReactions.css?inline";

const STYLE_ID = "de-datanauten-text-reactions-style";

export class TextReactionsModule implements Module {
    // 2.0.0 is the first release with `openDialog` and `client.accountData` as used here.
    public static readonly moduleApiVersion = "^2.0.0";

    private injector?: ActionBarInjector;
    private recent!: RecentReactions;

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        injectStyle();
        this.recent = new RecentReactions(this.api);
        this.injector = new ActionBarInjector({
            reactLabel: () => this.api.i18n.translate("action|react"),
            label: () => this.t(`${P}button`),
            onClick: (eventId) => this.openDialog(eventId),
        });
        this.injector.start();
    }

    /** Removes the buttons and listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.injector?.stop();
    }

    public openDialog(eventId: string): void {
        const send = async (key: string): Promise<void> => {
            const client = getSdkClient();
            const roomId = client && findRoomOfEvent(client, eventId);
            if (!client || !roomId) throw new Error(this.t(`${P}no_room`));
            await sendReaction(client, roomId, eventId, key);
            // Remembering it is a nicety; a failure here shouldn't look like a failed reaction.
            this.recent.use(key).catch((e) => console.warn("[text-reactions] Saving recent reactions failed", e));
        };
        this.api.openDialog<string, TextReactionDialogProps>({ title: this.t(`${P}title`) }, TextReactionDialog, {
            recent: this.recent.get(),
            t: this.t,
            send,
        });
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default TextReactionsModule satisfies ModuleFactory;
