import { beforeEach, describe, expect, it } from "vitest";

import { capture, clear, FORMAT, load, MAX_AGE_MS, ROOM_ATTR, save, STORAGE_KEY, type Snapshot } from "./snapshot";

const BUILD = "abc123";

/** A trimmed copy of Element v1.12.33's logged-in DOM, with everything the scrub must remove. */
function renderElement(): void {
    document.head.innerHTML = `<script src="bundles/${BUILD}/bundle.js"></script>`;
    document.body.innerHTML = `
<div id="matrixchat"><div class="mx_MatrixChat_wrapper"><div class="mx_MatrixChat">
  <nav class="mx_SpacePanel"><span class="_avatar" data-color="3">T</span><div class="mx_ThreadsActivityCentre_container">x</div></nav>
  <div id="left-panel" style="flex: 30 1 0px">
    <nav class="mx_RoomListPanel">
      <button class="mx_RoomListItemView" aria-label="Open room Lunch, 2 unread" tabindex="0">
        <img src="https://hs/_matrix/media/v3/thumbnail/a" class="_image">
        <div class="content"><div class="ellipsis">
          <div title="Lunch" data-testid="room-name">Lunch</div>
          <div title="bob: the secret plan">bob: the secret plan</div>
        </div><div class="hover">menu</div><div class="badge" aria-hidden="true">2</div></div>
      </button>
      <button class="mx_RoomListItemView">
        <img src="blob:http://x/dead">
        <div class="content"><div class="ellipsis"><div title="Ops" data-testid="room-name">Ops</div></div><div class="badge"></div></div>
      </button>
    </nav>
  </div>
  <div><div class="mx_RoomView_wrapper"><div class="mx_RoomView"><canvas></canvas>
    <header class="mx_RoomHeader"><span>Lunch</span><div class="mx_RoomHeader_topic">topic text</div></header>
    <div class="mx_AuxPanel">aux secret</div>
    <div class="mx_PinnedMessageBanner">pinned secret</div>
    <main class="mx_RoomView_timeline"><div>timeline secret</div></main>
    <div class="mx_MessageComposer"><div class="mx_BasicMessageComposer_input" contenteditable="true">draft secret</div></div>
    <iframe src="https://widget"></iframe>
  </div></div></div>
</div></div></div>`;
    localStorage.setItem("mx_user_id", "@alice:x");
    localStorage.setItem("mx_has_access_token", "true");
}

function snap(over: Partial<Snapshot> = {}): Snapshot | null {
    return capture({
        doc: document,
        userId: "@alice:x",
        rooms: [
            { id: "!lunch", name: "Lunch" },
            { id: "!ops", name: "Ops" },
        ],
        avatars: new Map([["https://hs/_matrix/media/v3/thumbnail/a", "data:image/webp;base64,AAAA"]]),
        now: 1000,
        ...over,
    });
}

describe("capture", () => {
    beforeEach(renderElement);

    it("returns null when Element shows no room list", () => {
        document.querySelector(".mx_RoomListPanel")!.remove();
        expect(snap()).toBeNull();
    });

    it("keeps no message content: previews, timeline, drafts, pins, topics, labels", () => {
        const html = snap()!.html;
        expect(html).not.toMatch(/secret|topic text/);
        expect(html).not.toMatch(/aria-|title=| id=|tabindex|contenteditable/);
        expect(html).not.toMatch(/<iframe|<canvas|ThreadsActivityCentre/);
        expect(html).not.toContain("menu");
    });

    it("keeps names, badges, the header and inline layout", () => {
        const html = snap()!.html;
        expect(html).toContain(">Lunch<");
        expect(html).toContain(">Ops<");
        expect(html).toContain(">2<");
        expect(html).toContain("mx_RoomHeader");
        expect(html).toContain('style="flex: 30 1 0px"');
        expect(html).toContain('data-color="3"');
    });

    it("puts room IDs on the rows", () => {
        const div = document.createElement("div");
        div.innerHTML = snap()!.html;
        expect([...div.querySelectorAll(`[${ROOM_ATTR}]`)].map((r) => r.getAttribute(ROOM_ATTR))).toEqual(["!lunch", "!ops"]);
    });

    it("swaps avatars for their data URLs and drops the ones it has none for", () => {
        const div = document.createElement("div");
        div.innerHTML = snap()!.html;
        const imgs = [...div.querySelectorAll("img")];
        expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["data:image/webp;base64,AAAA"]);
    });

    it("blanks the main area when it isn't a room", () => {
        document.querySelector(".mx_RoomView")!.outerHTML = `<main class="mx_HomePage">welcome secret</main>`;
        expect(snap()!.html).not.toContain("welcome");
    });

    it("leaves live Element untouched", () => {
        snap();
        expect(document.body.textContent).toContain("bob: the secret plan");
        expect(document.querySelector("[aria-label]")).not.toBeNull();
    });

    it("records user, build and time", () => {
        expect(snap()).toMatchObject({ format: FORMAT, userId: "@alice:x", build: BUILD, savedAt: 1000 });
    });
});

describe("load", () => {
    beforeEach(() => {
        renderElement();
        save(snap()!);
    });

    it("returns the snapshot of the logged-in user", () => {
        expect(load(localStorage, document, 2000)?.userId).toBe("@alice:x");
    });

    it("ignores it without an access token (logged out)", () => {
        localStorage.removeItem("mx_has_access_token");
        expect(load(localStorage, document, 2000)).toBeNull();
    });

    it("deletes another user's snapshot", () => {
        localStorage.setItem("mx_user_id", "@bob:x");
        expect(load(localStorage, document, 2000)).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("ignores it after an Element upgrade", () => {
        document.head.innerHTML = `<script src="bundles/newbuild/bundle.js"></script>`;
        expect(load(localStorage, document, 2000)).toBeNull();
    });

    it("ignores an old snapshot", () => {
        expect(load(localStorage, document, 1000 + MAX_AGE_MS + 1)).toBeNull();
    });

    it("ignores another format and garbage", () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...snap()!, format: FORMAT + 1 }));
        expect(load(localStorage, document, 2000)).toBeNull();
        localStorage.setItem(STORAGE_KEY, "{not json");
        expect(load(localStorage, document, 2000)).toBeNull();
    });

    it("clear removes it", () => {
        clear();
        expect(load(localStorage, document, 2000)).toBeNull();
    });
});
