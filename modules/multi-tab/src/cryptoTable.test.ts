import type { CryptoBackend } from "matrix-js-sdk/lib/common-crypto/CryptoBackend";
import { describe, expect, it } from "vitest";

import { CRYPTO_TABLE } from "./cryptoTable";

/*
 * Compile-time check against the js-sdk the module is built for: `pnpm lint:types` fails when js-sdk adds a
 * crypto member that the table doesn't classify, or when the table lists one that no longer exists.
 */
type Members = Exclude<keyof CryptoBackend, symbol>;
type Unclassified = Exclude<Members, keyof typeof CRYPTO_TABLE>;
type Stale = Exclude<keyof typeof CRYPTO_TABLE, Members>;
const unclassified: [Unclassified] extends [never] ? true : Unclassified = true;
const stale: [Stale] extends [never] ? true : Stale = true;

describe("CRYPTO_TABLE", () => {
    it("classifies every CryptoBackend member of js-sdk 45", () => {
        expect(unclassified).toBe(true);
        expect(stale).toBe(true);
    });

    it("never forwards a method that returns key material", () => {
        for (const m of ["getSessionBackupPrivateKey", "exportRoomKeys", "exportRoomKeysAsJson", "exportSecretsBundle"]) {
            expect(CRYPTO_TABLE[m as keyof typeof CRYPTO_TABLE]).not.toBe("forward");
        }
    });

    it("keeps the methods that change this device's identity in the main tab", () => {
        for (const m of [
            "bootstrapCrossSigning",
            "bootstrapSecretStorage",
            "resetEncryption",
            "requestOwnUserVerification",
            "setDeviceVerified",
            "importRoomKeys",
            "restoreKeyBackup",
        ]) {
            expect(CRYPTO_TABLE[m as keyof typeof CRYPTO_TABLE]).toBe("unsupported");
        }
    });
});
