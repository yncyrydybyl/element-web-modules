import { describe as group, expect, it } from "vitest";

import { classify, describe, isBroad, parseApprovals, pending, withApproval, withoutApproval } from "./capabilities";

const FILES = "org.matrix.msc2762.receive.event:m.room.message#m.file";
const DOWNLOAD = "org.matrix.msc4039.download_file";
const MEMBERS = "org.matrix.msc2762.receive.state_event:m.room.member";

group("classify", () => {
    it("splits auto-granted, consent-needing and unsupported capabilities", () => {
        expect(
            classify([
                "io.element.requires_client",
                FILES,
                DOWNLOAD,
                MEMBERS,
                "m.always_on_screen",
                "m.sticker",
                "org.matrix.msc4157.send.delayed_event",
                "org.matrix.msc2762.send.event:",
                "org.matrix.msc2762.send.state_event:im.vector.modular.widgets#w1",
                "org.matrix.msc2762.receive.state_event:m.widget",
                "org.matrix.msc2762.send.state_event:io.element.widgets.layout#",
            ]),
        ).toEqual({
            auto: ["io.element.requires_client"],
            ask: [FILES, DOWNLOAD, MEMBERS],
            unsupported: [
                "m.always_on_screen",
                "m.sticker",
                "org.matrix.msc4157.send.delayed_event",
                "org.matrix.msc2762.send.event:",
                "org.matrix.msc2762.send.state_event:im.vector.modular.widgets#w1",
                "org.matrix.msc2762.receive.state_event:m.widget",
                "org.matrix.msc2762.send.state_event:io.element.widgets.layout#",
            ],
        });
    });

    it("flags what reaches beyond the room", () => {
        expect(isBroad("org.matrix.msc2762.timeline:*")).toBe(true);
        expect(isBroad("org.matrix.msc3819.send.to_device:org.example.ping")).toBe(true);
        expect(isBroad(FILES)).toBe(false);
        expect(isBroad(MEMBERS)).toBe(false);
    });

    it("describes capabilities for the dialog", () => {
        expect(describe(FILES)).toEqual({ key: "receive_message", vars: { msgtype: "m.file" } });
        expect(describe("org.matrix.msc2762.send.event:m.room.message")).toEqual({ key: "send_message", vars: { msgtype: "*" } });
        expect(describe(MEMBERS)).toEqual({ key: "receive_state", vars: { type: "m.room.member", state_key: "*" } });
        expect(describe("org.matrix.msc2762.timeline:*")).toEqual({ key: "timeline_any", vars: {} });
        expect(describe(DOWNLOAD)).toEqual({ key: "download_file", vars: {} });
    });
});

group("approvals", () => {
    const url = "https://pdf.example/";

    it("asks only for what isn't approved for this URL", () => {
        const approval = { url, capabilities: [FILES] };
        expect(pending([FILES, DOWNLOAD], url, approval, [])).toEqual([DOWNLOAD]);
        // A changed URL invalidates the approval.
        expect(pending([FILES], "https://other.example/", approval, [])).toEqual([FILES]);
        // Configured prefixes approve everything.
        expect(pending([FILES, DOWNLOAD], url, undefined, ["https://pdf.example/"])).toEqual([]);
    });

    it("merges, replaces on URL change and removes approvals", () => {
        let content: unknown = withApproval(undefined, "w1", url, [FILES]);
        content = withApproval(content, "w1", url, [DOWNLOAD]);
        expect(parseApprovals(content).w1).toEqual({ url, capabilities: [FILES, DOWNLOAD].sort() });
        content = withApproval(content, "w1", "https://new.example/", [MEMBERS]);
        expect(parseApprovals(content).w1).toEqual({ url: "https://new.example/", capabilities: [MEMBERS] });
        expect(parseApprovals(withoutApproval(content, "w1"))).toEqual({});
        expect(parseApprovals({ approvals: { x: { url: 1 } } })).toEqual({});
    });
});
