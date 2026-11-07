import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, sanitiseSettings, SETTINGS_TYPE, SettingsStore } from "./settings";
import { mockApi } from "./tests/mockApi";

describe("settings", () => {
    it("fills in defaults and ignores what it doesn't know", () => {
        expect(sanitiseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
        expect(sanitiseSettings({ colours: "neon", live: "yes", animations: false, extra: 1 })).toEqual({ ...DEFAULT_SETTINGS, animations: false });
        expect(sanitiseSettings({ colours: "room" }).colours).toBe("room");
    });

    it("starts from this device's copy, then follows account data", async () => {
        localStorage.setItem("de.datanauten.space_room_map.settings", JSON.stringify({ keepReady: false }));
        const { api, setAccountData } = mockApi();
        const store = new SettingsStore(api);
        expect(store.get().keepReady).toBe(false);
        store.start();
        // No account data yet: this device's copy stays.
        expect(store.get().keepReady).toBe(false);
        await store.set({ colours: "room" });
        expect(setAccountData).toHaveBeenCalledWith(SETTINGS_TYPE, { version: 1, ...DEFAULT_SETTINGS, keepReady: false, colours: "room" });
        await api.client.accountData.set(SETTINGS_TYPE, { animations: false });
        expect(store.get()).toEqual({ ...DEFAULT_SETTINGS, animations: false });
        store.stop();
    });
});
