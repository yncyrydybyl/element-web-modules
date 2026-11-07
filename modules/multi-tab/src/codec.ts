/**
 * Crypto values that don't survive `postMessage` as they are: class instances whose methods Element calls.
 * The engine sends their data; the mirror rebuilds objects with the same shape as js-sdk's classes
 * (`crypto-api/index.ts` `UserVerificationStatus`, `DeviceVerificationStatus`; `models/device.ts` `Device`).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class UserVerificationStatus {
    public constructor(
        private readonly crossSigningVerified: boolean,
        private readonly crossSigningVerifiedBefore: boolean,
        public readonly known: boolean,
        public readonly needsUserApproval = false,
    ) {}
    public isVerified(): boolean {
        return this.crossSigningVerified;
    }
    public isCrossSigningVerified(): boolean {
        return this.crossSigningVerified;
    }
    public wasCrossSigningVerified(): boolean {
        return this.crossSigningVerifiedBefore;
    }
    public isTofu(): boolean {
        return false;
    }
}

export class DeviceVerificationStatus {
    public readonly signedByOwner: boolean;
    public readonly crossSigningVerified: boolean;
    public readonly tofu: boolean;
    public readonly localVerified: boolean;
    public readonly blocked: boolean;
    private readonly trustCrossSignedDevices: boolean;
    public constructor(o: Record<string, boolean | undefined>) {
        this.signedByOwner = o.signedByOwner ?? false;
        this.crossSigningVerified = o.crossSigningVerified ?? false;
        this.tofu = o.tofu ?? false;
        this.localVerified = o.localVerified ?? false;
        this.blocked = o.blocked ?? false;
        this.trustCrossSignedDevices = o.trustCrossSignedDevices ?? false;
    }
    public isVerified(): boolean {
        return this.localVerified || (this.trustCrossSignedDevices && this.crossSigningVerified);
    }
}

export class Device {
    public readonly deviceId: string;
    public readonly userId: string;
    public readonly algorithms: string[];
    public readonly keys: Map<string, string>;
    public readonly verified: number;
    public readonly signatures: Map<string, Map<string, string>>;
    public readonly displayName?: string;
    public readonly dehydrated: boolean;
    public constructor(o: any) {
        this.deviceId = o.deviceId;
        this.userId = o.userId;
        this.algorithms = o.algorithms ?? [];
        this.keys = o.keys instanceof Map ? o.keys : new Map(Object.entries(o.keys ?? {}));
        this.verified = o.verified ?? 0;
        this.signatures = o.signatures instanceof Map ? o.signatures : new Map();
        this.displayName = o.displayName;
        this.dehydrated = !!o.dehydrated;
    }
    public getFingerprint(): string | undefined {
        return this.keys.get(`ed25519:${this.deviceId}`);
    }
    public getIdentityKey(): string | undefined {
        return this.keys.get(`curve25519:${this.deviceId}`);
    }
}

export function encodeUserStatus(s: any): unknown {
    if (!s) return s;
    return {
        v: s.isCrossSigningVerified(),
        b: s.wasCrossSigningVerified(),
        k: !!s.known,
        n: !!s.needsUserApproval,
    };
}

export function decodeUserStatus(o: any): UserVerificationStatus | null {
    return o ? new UserVerificationStatus(o.v, o.b, o.k, o.n) : null;
}

export function encodeDeviceStatus(s: any): unknown {
    if (!s) return null;
    return {
        signedByOwner: s.signedByOwner,
        crossSigningVerified: s.crossSigningVerified,
        tofu: s.tofu,
        localVerified: s.localVerified,
        blocked: s.blocked,
        trustCrossSignedDevices: s.trustCrossSignedDevices,
    };
}

export function decodeDeviceStatus(o: any): DeviceVerificationStatus | null {
    return o ? new DeviceVerificationStatus(o) : null;
}

/** `DeviceMap` survives structured clone as Maps of plain objects; only the `Device` methods need restoring. */
export function decodeDeviceMap(m: Map<string, Map<string, any>>): Map<string, Map<string, Device>> {
    const out = new Map<string, Map<string, Device>>();
    for (const [userId, devices] of m) {
        const inner = new Map<string, Device>();
        for (const [deviceId, d] of devices) inner.set(deviceId, new Device(d));
        out.set(userId, inner);
    }
    return out;
}

/** Crypto events the engine re-broadcasts to mirrors. Verification and (de)hydration events stay in the engine. */
/**
 * Crypto events a mirror re-emits on its client, with how many arguments each has. js-sdk's re-emitter appends the
 * emitting object (RustCrypto) as one more argument, which can't be sent to another tab and isn't used.
 */
const CRYPTO_EVENT_ARITY = {
    userTrustStatusChanged: 2, // (userId, UserVerificationStatus)
    "crypto.keyBackupStatus": 1, // (enabled)
    "crypto.keyBackupSessionsRemaining": 1, // (count)
    "crypto.keyBackupFailed": 1, // (errcode)
    "crypto.keyBackupDecryptionKeyCached": 1, // (version)
    "crossSigning.keysChanged": 1, // ({})
    "crypto.devicesUpdated": 2, // (userIds, initialFetch)
    "crypto.willUpdateDevices": 2, // (userIds, initialFetch)
} as const;

export const CRYPTO_EVENTS = Object.keys(CRYPTO_EVENT_ARITY) as Array<keyof typeof CRYPTO_EVENT_ARITY>;

export function encodeCryptoEvent(name: string, args: unknown[]): { name: string; args: unknown[] } {
    if (name === "userTrustStatusChanged") return { name, args: [args[0], encodeUserStatus(args[1])] };
    return { name, args: args.slice(0, CRYPTO_EVENT_ARITY[name as keyof typeof CRYPTO_EVENT_ARITY] ?? 0) };
}

/**
 * `null` for a name that isn't a crypto event: a mirror re-emits what it gets on its client, and other events
 * there (`Session.logged_out`, say) would make Element act on them.
 */
export function decodeCryptoEvent(name: string, args: unknown[]): unknown[] | null {
    if (!Object.hasOwn(CRYPTO_EVENT_ARITY, name) || !Array.isArray(args)) return null;
    if (name === "userTrustStatusChanged") return [args[0], decodeUserStatus(args[1])];
    return args;
}
