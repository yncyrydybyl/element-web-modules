import { describe, expect, it } from "vitest";

import { Channel, type Port, PROTOCOL } from "./channel";

/** In-memory BroadcastChannels: deliver to every other open port of the same name, asynchronously, like the real ones. */
class Bus {
    private ports = new Set<FakePort>();
    /** How many times a message was handed to a listener, per channel name. */
    public delivered = new Map<string, number>();
    public open = (name: string): FakePort => {
        const p = new FakePort(this, name);
        this.ports.add(p);
        return p;
    };
    public channel(tabId: string, fp = "fp"): Channel {
        return new Channel(this.open, BASE, tabId, fp);
    }
    public deliver(from: FakePort, msg: unknown): void {
        for (const p of this.ports) {
            if (p === from || p.name !== from.name || p.closed) continue;
            this.delivered.set(p.name, (this.delivered.get(p.name) ?? 0) + 1);
            setTimeout(() => p.fire(structuredClone(msg)), 0);
        }
    }
}

class FakePort implements Port {
    private fns: Array<(ev: MessageEvent) => void> = [];
    public closed = false;
    public constructor(
        private bus: Bus,
        public name: string,
    ) {}
    public postMessage(msg: unknown): void {
        this.bus.deliver(this, msg);
    }
    public addEventListener(_t: "message", fn: (ev: MessageEvent) => void): void {
        this.fns.push(fn);
    }
    public close(): void {
        this.closed = true;
    }
    public fire(data: unknown): void {
        if (!this.closed) for (const fn of this.fns) fn({ data } as MessageEvent);
    }
}

const BASE = "mt";

describe("Channel", () => {
    it("correlates requests and replies, and routes 'engine' to the engine only", async () => {
        const bus = new Bus();
        const engine = bus.channel("e", "fp");
        engine.isEngine = true;
        const other = bus.channel("o", "fp");
        let otherCalled = false;
        other.handle("echo", () => (otherCalled = true));
        engine.handle("echo", (p: { n: number }) => ({ n: p.n + 1 }));
        const m = bus.channel("m", "fp");
        await expect(m.request("engine", "echo", { n: 1 }, 1000)).resolves.toEqual({ n: 2 });
        expect(otherCalled).toBe(false);
    });

    it("passes errors back with their code", async () => {
        const bus = new Bus();
        const engine = bus.channel("e", "fp");
        engine.isEngine = true;
        engine.handle("boom", () => {
            throw Object.assign(new Error("nope"), { code: "NO_CRYPTO" });
        });
        const m = bus.channel("m", "fp");
        await expect(m.request("engine", "boom", null, 1000)).rejects.toMatchObject({ message: "nope", code: "NO_CRYPTO" });
    });

    it("times out", async () => {
        const bus = new Bus();
        const m = bus.channel("m", "fp");
        await expect(m.request("engine", "x", null, 20)).rejects.toMatchObject({ code: "TIMEOUT" });
    });

    it("ignores other sessions and other protocol versions", async () => {
        const bus = new Bus();
        const engine = bus.channel("e", "fp-other");
        engine.isEngine = true;
        engine.handle("x", () => 1);
        const m = bus.channel("m", "fp");
        await expect(m.request("engine", "x", null, 30)).rejects.toMatchObject({ code: "TIMEOUT" });

        const raw = bus.open(`${BASE}/engine`);
        let got = 0;
        const e2 = bus.channel("e2", "fp");
        e2.isEngine = true;
        e2.handle("y", () => got++);
        raw.postMessage({ v: PROTOCOL + 1, fp: "fp", from: "z", to: "engine", type: "y" });
        await new Promise((r) => setTimeout(r, 10));
        expect(got).toBe(0);
    });

    it("fails pending requests at once when told the engine is gone", async () => {
        const bus = new Bus();
        const m = bus.channel("m", "fp");
        const p = m.request("engine", "sync", {}, 60_000);
        m.failPending(new Error("gone"));
        await expect(p).rejects.toThrow("gone");
    });

    it("delivers a reply only to the asking tab, not to every tab", async () => {
        const bus = new Bus();
        const engine = bus.channel("e");
        engine.isEngine = true;
        engine.handle("sync", () => "big");
        const tabs = ["a", "b", "c", "d"].map((id) => bus.channel(id));
        await tabs[0].request("engine", "sync", null, 1000);
        expect(bus.delivered.get(`${BASE}/engine`)).toBe(1);
        expect(bus.delivered.get(`${BASE}/tab/a`)).toBe(1);
        expect(bus.delivered.get(BASE)).toBeUndefined();
    });

    it("stops answering as the engine once it isn't the engine any more", async () => {
        const bus = new Bus();
        const engine = bus.channel("e");
        engine.isEngine = true;
        engine.handle("x", () => 1);
        engine.isEngine = false;
        await expect(bus.channel("m").request("engine", "x", null, 30)).rejects.toMatchObject({ code: "TIMEOUT" });
    });

    it("collects the answers of every tab", async () => {
        const bus = new Bus();
        for (const id of ["a", "b", "c"]) bus.channel(id).handle("status", () => ({ id }));
        bus.channel("silent");
        const replies = await bus.channel("me").collect<{ id: string }>("status", null, 30);
        expect(replies.map((r) => r.payload.id).sort()).toEqual(["a", "b", "c"]);
        expect(replies.every((r) => r.from === r.payload.id)).toBe(true);
    });
});
