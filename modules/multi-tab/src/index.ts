import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { version } from "../package.json";
import { Channel } from "./channel";
import {
    type Claim,
    CLAIM_KEY,
    clearClaim,
    dropClaimUnlessReloading,
    elect,
    type ElectionCallbacks,
    freshClaim,
    type ElectionDeps,
    LOCK_NAME,
    MAX_CLAIM_MS,
    queueForPromotion,
    stealForTakeover,
    holdForLogin,
    dropPromoteMark,
} from "./election";
import { clearDeadEngineLock, Engine } from "./engine";
import { el, type MatrixClientLike, SESSION_LOCK, type StoredSession, SYNC_STORE_DB } from "./hooks";
import { claimLoginTab, isLoginCallback, waitForLogin } from "./login";
import { Mirror } from "./mirror";
import { fingerprint, preflight } from "./preflight";
import { baseStatus, formatBytes, listTabs, serveStatus, TabColour, type TabInfo, type TabStatus } from "./tabs";
import { TabRing } from "./ui/tabRing";
import { TabsSection } from "./ui/tabsSection";
import { quietly, sleep, withTimeout } from "./util";

const CHANNEL_NAME = "de.datanauten.multi_tab";
/** How long a new tab waits for the engine to answer before it concludes the engine runs another session or build. */
const PROBE_MS = 2_500;
/** How long a new tab waits for a busy engine of the same build (e.g. one starting on a big account). */
const PROBE_SAME_BUILD_MS = 45_000;
/** The engine's build, so a new tab can tell "busy" from "different build". */
const ENGINE_BUILD_KEY = "de.datanauten.multi_tab.engine_build";
/** How long a signed-out login tab waits for the old engine (still cleaning up after the logout) to let go. */
const LOGIN_LOCK_WAIT_MS = 20_000;
/** How long `load()` waits for Element's version, which is part of the build fingerprint. */
const VERSION_WAIT_MS = 500;
/** Elections in a row that may find the lock free only because a promotion never finished. */
const MAX_ELECTIONS = 4;
/** How long one `hello` of the probe waits for the engine. */
const PROBE_HELLO_MS = 500;
/** How often a promoted engine checks whether it syncs, to drop its claim. */
const CLAIM_CLEAR_POLL_MS = 1_000;
/** Other tabs reload this soon after a logout elsewhere (the logging-out tab broadcasts first, then cleans up). */
const LOGOUT_RELOAD_DELAY_MS = 300;
/** The logging-out tab reloads once Element has deleted its stores, checked this often, but after this at most. */
const LOGOUT_CLEANUP_POLL_MS = 500;
const LOGOUT_CLEANUP_MAX_MS = 15_000;

export type Role = "pending" | "off" | "engine" | "mirror" | "login" | "waiting";

/** What tests and curious users can read in the console: `window.__multiTab`. */
export interface Status {
    role: Role;
    tabId: string;
    version: string;
    reason?: string;
    stats(): Record<string, unknown>;
    /** Every open tab of this session, as in Settings → Preferences → Open tabs (empty without a session). */
    tabs(): Promise<TabInfo[]>;
}

export class MultiTabModule implements Module {
    // Uses no module API beyond loading; Element's globals do the work (see hooks.ts).
    // Only `load()` is used, which every module API version has; Element Pro 1.12.29 ships API 1.17.
    public static readonly moduleApiVersion = "^1.0.0 || ^2.0.0";

    public readonly status: Status = {
        role: "pending",
        tabId: randomId(),
        version,
        stats: () => ({}),
        tabs: async () => [],
    };
    private readonly openedAt = Date.now();
    public engine?: Engine;
    public mirror?: Mirror;
    private build = "";
    private reloading = false;
    /** A logout happened (here or in another tab): every tab reloads into the signed-out roles. */
    private signedOut = false;

    public constructor(_api: Api) {}

    /**
     * Element awaits this before it creates its client and takes its session lock, so the role is decided in
     * time. Waits only for the Web Lock, the app version and, in a new mirror, the engine's first answer.
     */
    public async load(): Promise<void> {
        // Element creates one instance per entry in config.json "modules", and Element Pro's server lists each
        // configured module twice. Only the first instance may run: two in one page would be two tabs in one.
        const w = window as unknown as { __multiTab?: Status };
        if (w.__multiTab) return void console.info("[multi-tab] Already loaded in this page; this copy stays off");
        w.__multiTab = this.status;

        const pre = preflight();
        if (!pre.ok) return this.off(pre.reason);

        const platform = el().mxPlatformPeg!.get()!;
        const elementVersion = await withTimeout(platform.getAppVersion?.() ?? Promise.resolve("?"), VERSION_WAIT_MS, "?");
        this.build = `${version}/${elementVersion}`;
        const deps: ElectionDeps = { locks: navigator.locks, local: localStorage, session: sessionStorage, now: Date.now };

        if (!pre.session) return this.loggedOut(deps);

        const session = pre.session;
        const channel = openChannel(this.status.tabId, fingerprint(session, this.build));
        for (let attempt = 0; ; attempt++) {
            const election = await elect(deps, this.status.tabId, this.electionCallbacks());
            if (election.role === "engine") {
                this.startEngine(channel, () => session.hsUrl, election.claim);
                return;
            }
            // Only mirror an engine that answers on our fingerprint; one of another build or session never will.
            const probe = await this.probeEngine(channel);
            if (probe === "answered") break;
            // Nobody holds the lock (a promotion that never finished): elect again.
            if (probe === "vacant" && attempt < MAX_ELECTIONS - 1) continue;
            if (probe === "frozen") {
                // An engine of our build holds the lock but hasn't answered for the whole probe: frozen or hung.
                // Take over as a mirror's watchdog would (this tab reloads; Element mustn't start meanwhile).
                console.warn("[multi-tab] The engine tab doesn't answer; taking over");
                stealForTakeover(deps, { tabId: this.status.tabId, until: Date.now() + MAX_CLAIM_MS }, this.takeoverCallbacks());
                return new Promise<void>(() => {});
            }
            channel.close();
            return this.off("the engine tab runs another build or session (or doesn't answer)");
        }
        this.startMirror(channel, session.hsUrl, deps);
        queueForPromotion(deps, this.status.tabId, this.electionCallbacks());
    }

    private electionCallbacks(): ElectionCallbacks {
        return { onPromote: (claim) => this.promote(claim), onLockLost: () => this.onLockLost() };
    }

    /** For a forced takeover: the stolen lock is ours, and nobody steals it back before the reload. */
    private takeoverCallbacks(): ElectionCallbacks {
        return { onPromote: (claim) => this.promote(claim), onLockLost: () => {} };
    }

    private off(reason: string): void {
        this.status.role = "off";
        this.status.reason = reason;
        console.info(`[multi-tab] Off: ${reason}`);
    }

    /**
     * No session: one tab shows the login and holds the engine lock, so after the login it simply is the engine
     * (no reload during Element's first crypto setup). Other tabs wait and follow.
     */
    private async loggedOut(deps: ElectionDeps): Promise<void> {
        dropPromoteMark(deps.session);
        const loginRole = await claimLoginTab(deps.locks);
        if (loginRole === "waiting" && !isLoginCallback(location)) {
            this.status.role = "waiting";
            console.info("[multi-tab] Signed out; waiting for a login in another tab");
            return waitForLogin(deps.locks, deps.local);
        }
        this.status.role = "login";
        console.info("[multi-tab] Signed out; this tab shows the login and becomes the engine after it");
        // If the old engine is the tab that signed out, it lives on while Element deletes its stores, and its
        // Element still holds the session lock: starting Element now would show the "open in another tab" screen.
        // It lets go of both when it reloads, so wait for the engine lock first.
        let lockHeld = false;
        const held = holdForLogin(deps, this.electionCallbacks()).then(() => (lockHeld = true));
        await withTimeout(held, LOGIN_LOCK_WAIT_MS, false);

        // The engine starts with the client of the new login. Everything it hooks happens later than Peg.set.
        const peg = el().mxMatrixClientPeg!;
        const origSet = peg.set.bind(peg);
        peg.set = (client: MatrixClientLike): void => {
            peg.set = origSet;
            origSet(client);
            const session: StoredSession = {
                userId: client.getUserId() ?? "",
                deviceId: client.getDeviceId() ?? "",
                hsUrl: client.getHomeserverUrl(),
            };
            if (!lockHeld) console.warn("[multi-tab] Signed in before the old engine tab let go of the engine role");
            const channel = openChannel(this.status.tabId, fingerprint(session, this.build));
            this.startEngine(channel, () => session.hsUrl);
        };
    }

    /**
     * Asks the engine `hello` until it answers, the probe time is up, or it turns out there is no engine at all.
     * "frozen": an engine of this build (it said so in localStorage) holds the lock but never answered.
     */
    private async probeEngine(channel: Channel): Promise<"answered" | "silent" | "frozen" | "vacant"> {
        const sameBuild = quietly(() => localStorage.getItem(ENGINE_BUILD_KEY) === this.build, false);
        const deadline = (): number => {
            // While a promoted tab reloads, its engine can't answer yet: wait for it. An engine of our build that
            // is merely busy (big account) gets longer than one that may run another build.
            const claim = freshClaim({ local: localStorage, now: Date.now });
            return Math.max(start + (sameBuild ? PROBE_SAME_BUILD_MS : PROBE_MS), claim?.until ?? 0);
        };
        const start = Date.now();
        while (Date.now() < deadline()) {
            try {
                await channel.request("engine", "hello", null, PROBE_HELLO_MS);
                return "answered";
            } catch {
                // retry until the time is up
            }
            if (!freshClaim({ local: localStorage, now: Date.now }) && !(await engineLockHeld())) return "vacant";
        }
        return sameBuild ? "frozen" : "silent";
    }

    private startEngine(channel: Channel, hsUrl: () => string | null, claim?: Claim): void {
        this.status.role = "engine";
        quietly(() => localStorage.setItem(ENGINE_BUILD_KEY, this.build), undefined);
        // A promoted tab: the old engine is gone, so its Element session lock must not make us wait or ask.
        clearDeadEngineLock(localStorage, claim?.deadOwner);
        const engine = (this.engine = new Engine(channel, hsUrl));
        engine.installFetchTee();
        engine.watchClientPeg(el().mxMatrixClientPeg!);
        if (claim) {
            const clear = (): void => {
                if (engine.client?.getSyncState() === "SYNCING") clearClaim(localStorage, claim.tabId);
                else setTimeout(clear, CLAIM_CLEAR_POLL_MS);
            };
            clear();
        }
        window.addEventListener("pagehide", () => engine.goodbye());
        this.watchLogout(channel);
        this.showTabs(channel, () => ({
            syncState: engine.client?.getSyncState() ?? null,
            lastSyncAt: engine.lastSyncAt,
            details: [
                `${engine.buffer.size} sync responses kept for other tabs (${formatBytes(engine.buffer.totalBytes)})`,
                `${engine.stats.decrypts} messages decrypted for them`,
            ],
        }));
        this.status.stats = () => ({ ...engine.stats, buffered: engine.buffer.size, bufferBytes: engine.buffer.totalBytes });
        console.info("[multi-tab] This tab is the engine");
    }

    private startMirror(channel: Channel, hsUrl: string, deps: ElectionDeps): void {
        this.status.role = "mirror";
        const mirror = (this.mirror = new Mirror({
            channel,
            homeserver: hsUrl,
            reload: (reason) => {
                console.info(`[multi-tab] Reloading: ${reason}`);
                location.reload();
            },
            takeover: () =>
                stealForTakeover(deps, { tabId: this.status.tabId, until: Date.now() + MAX_CLAIM_MS }, this.takeoverCallbacks()),
            engineLockHeld,
        }));
        mirror.patchPlatform(el().mxPlatformPeg!.get()!);
        mirror.suppressDeviceListener();
        mirror.installFetchRouter();
        mirror.watchClientPeg(el().mxMatrixClientPeg!);
        this.watchLogout(channel);
        this.showTabs(channel, () => ({
            syncState: mirror.client?.getSyncState() ?? null,
            lastSyncAt: mirror.lastSyncAt,
            details: [
                `${mirror.crypto.stats.decrypted} messages decrypted through the main tab`,
                ...(mirror.crypto.waiting ? [`${mirror.crypto.waiting} without their keys`] : []),
            ],
        }));
        this.status.stats = () => ({ ...mirror.stats, crypto: mirror.crypto.stats, engineTab: mirror.engineTab });
        console.info("[multi-tab] This tab mirrors the engine tab");
    }

    /** Answers other tabs' "status", shows all tabs in Settings → Preferences, and this tab's ring on the avatar. */
    private showTabs(channel: Channel, roleStatus: () => Pick<TabStatus, "syncState" | "lastSyncAt" | "details">): void {
        const colour = new TabColour(sessionStorage);
        const own = (): TabStatus => ({
            ...baseStatus(this.status.tabId, this.status.role, this.build, this.openedAt, el().mxMatrixClientPeg?.get() ?? null),
            ...roleStatus(),
            colour: colour.colour,
            colourSince: colour.since,
        });
        const list = (): Promise<TabInfo[]> => listTabs(channel, own);
        serveStatus(channel, own);
        this.status.tabs = list;
        new TabsSection(list).start();
        new TabRing(list, (others) => colour.settle(this.status.tabId, this.openedAt, others)).start();
    }

    /** This mirror got the lock: record who the dead engine was, then come back as the engine. */
    private promote(claim: Claim): void {
        // Signed out everywhere: the engine is gone because it is reloading too, and this tab is about to.
        if (this.signedOut) return;
        // The engine is gone for sure (we hold the lock), so whoever owns Element's session lock right now is that
        // engine, unless a tab without this module took it.
        const owner = this.mirror?.engineOwner ?? quietly(() => localStorage.getItem(SESSION_LOCK.owner), null);
        claim.deadOwner = owner ?? undefined;
        quietly(() => localStorage.setItem(CLAIM_KEY, JSON.stringify(claim)), undefined);
        console.info("[multi-tab] The engine tab is gone; this tab takes over");
        this.reloading = true;
        dropClaimUnlessReloading(localStorage, claim.tabId, () => this.reloading);
        location.reload();
    }

    /** Our lock was stolen by a forced takeover: stop syncing at once and come back as a mirror. */
    private onLockLost(): void {
        console.warn("[multi-tab] Another tab took over the engine role");
        this.engine?.fence();
        location.reload();
    }

    /**
     * After a logout in any tab the session is gone for all of them: the others reload, and the login/waiting
     * roles take over (one login screen, the rest follow).
     */
    private watchLogout(channel: Channel): void {
        channel.handle("loggedOut", () => {
            this.signedOut = true;
            setTimeout(() => location.reload(), LOGOUT_RELOAD_DELAY_MS);
        });
        el().mxDispatcher?.register((payload) => {
            if (payload.action !== "on_logged_out") return;
            this.signedOut = true;
            channel.send("*", "loggedOut");
            // This tab too, as it still holds its role (and maybe the engine lock) from the old session. But only
            // once Element's own clean-up (deleting the stores, maybe a logout redirect) has finished.
            void reloadAfterLogoutCleanup();
        });
    }
}

async function engineLockHeld(): Promise<boolean> {
    const q = await navigator.locks.query();
    return !!q.held?.some((l) => l.name === LOCK_NAME);
}

async function reloadAfterLogoutCleanup(): Promise<void> {
    const until = Date.now() + LOGOUT_CLEANUP_MAX_MS;
    const startUrl = location.href;
    for (;;) {
        await sleep(LOGOUT_CLEANUP_POLL_MS);
        // A logout redirect is under way: nothing to do.
        if (location.href !== startUrl && !location.href.startsWith(startUrl.split("#")[0])) return;
        let storesGone = true;
        try {
            const dbs = (await indexedDB.databases?.()) ?? [];
            storesGone = !dbs.some((d) => d.name === SYNC_STORE_DB);
        } catch {
            // can't tell: rely on the time limit
        }
        if (storesGone || Date.now() > until) break;
    }
    location.reload();
}

/** Tabs of other sessions and builds don't even receive our messages: the fingerprint is part of the name. */
function openChannel(tabId: string, fp: string): Channel {
    return new Channel((name) => new BroadcastChannel(name), `${CHANNEL_NAME}:${fp}`, tabId, fp);
}

function randomId(): string {
    return Math.random().toString(36).slice(2, 10);
}

export default MultiTabModule satisfies ModuleFactory;
