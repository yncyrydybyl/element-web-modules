import { afterEach, describe, expect, it } from "vitest";

import { EMPTY_CACHE_MS, StartProbe } from "./progress";

interface Fake {
    rooms?: number;
    sync?: string | null;
    startedUp?: boolean;
    crypto?: boolean;
}

function withClient(fake: Fake | null): void {
    window.mxMatrixClientPeg = {
        get: () =>
            fake && {
                getDomain: () => "example.org",
                getHomeserverUrl: () => "https://matrix.example.org",
                getRooms: () => new Array(fake.rooms ?? 0),
                getSyncState: () => fake.sync ?? null,
                getCrypto: () => (fake.crypto ? {} : undefined),
                store: { startedUp: fake.startedUp ?? true },
            },
    };
}

afterEach(() => {
    delete window.mxMatrixClientPeg;
});

describe("StartProbe", () => {
    it("walks through the steps of a start from the cache", () => {
        let now = 0;
        const probe = new StartProbe(false, window, () => now);
        expect(probe.read().stage).toBe("session");
        withClient(null);
        expect(probe.read().stage).toBe("session");
        withClient({ startedUp: false });
        expect(probe.read()).toMatchObject({ stage: "storage", server: "example.org" });
        withClient({});
        expect(probe.read().stage).toBe("keys");
        withClient({ crypto: true });
        expect(probe.read().stage).toBe("rooms");
        withClient({ crypto: true, rooms: 40 });
        expect(probe.read()).toMatchObject({ stage: "rooms", rooms: 40 });
        withClient({ crypto: true, rooms: 40, sync: "PREPARED" });
        expect(probe.read().stage).toBe("ready");
        now += 1;
    });

    it("calls it a download when no rooms come from the cache", () => {
        let now = 0;
        const probe = new StartProbe(false, window, () => now);
        withClient({ crypto: true });
        expect(probe.read().stage).toBe("rooms");
        now = EMPTY_CACHE_MS;
        expect(probe.read().stage).toBe("download");
    });

    it("expects a download right after a login, and says when the server doesn't answer", () => {
        withClient({ crypto: true });
        expect(new StartProbe(true).read().stage).toBe("download");
        withClient({ crypto: true, sync: "RECONNECTING" });
        expect(new StartProbe(true).read().stage).toBe("waiting");
    });

    it("survives a client whose methods throw", () => {
        window.mxMatrixClientPeg = {
            get: () => {
                throw new Error("nope");
            },
        };
        expect(new StartProbe().read().stage).toBe("session");
    });
});
