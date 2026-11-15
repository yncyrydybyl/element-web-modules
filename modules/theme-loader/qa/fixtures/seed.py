#!/usr/bin/env python3
"""Theme Lab fixtures on matrix.datanauten.de (production!) for the theme screenshot/recording harness.

Idempotent: every room, upload and event gets a stable key; what exists is recorded in .state/fixtures.json and
skipped on re-runs. Secrets (tokens, cross-signing seeds, recovery key) live only in .state/ with mode 600.

    python3 tests/fixtures/seed.py all        # everything below, in order (safe to re-run)
    python3 tests/fixtures/seed.py login      # m.login.password once per user -> .state/tokens.json ("Theme Lab seeder" device)
    python3 tests/fixtures/seed.py base       # profiles, avatars, space "Theme Lab", rooms, DMs, joins
    node    tests/harness/session.mjs themes-mira --bootstrap   # Element session + cross-signing/recovery for mira
    python3 tests/fixtures/seed.py xsign      # cross-signing for jonas/lena/theo, sign seeder devices, mira verifies the others
    python3 tests/fixtures/seed.py history    # seeded timelines (E2EE rooms sent via matrix-nio from the seeder devices)
    python3 tests/fixtures/seed.py unread     # (re)create unread + highlight counts for mira in rooms the harness never opens
    python3 tests/fixtures/seed.py status     # summary of what exists

E2EE: commands that send encrypted events re-exec themselves under a Python that has matrix-nio[e2e]
(TL_NIO_PYTHON, default: the matrix-commander Homebrew venv).
"""
import base64, glob, hashlib, hmac, json, mimetypes, os, struct, subprocess, sys, time, urllib.error, urllib.parse, urllib.request, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / ".state"
ASSETS = Path(__file__).resolve().parent / "assets"
FIX = STATE / "fixtures.json"
TOKENS = STATE / "tokens.json"
HS = os.environ.get("TL_HS", "https://matrix.datanauten.de")
DOMAIN = "datanauten.de"
TAG = "de.datanauten.theme_lab"           # creation_content flag + state event marking our fixtures
USERS = ["themes-mira", "themes-jonas", "themes-lena", "themes-theo"]
NAMES = {"themes-mira": "Mira Okafor", "themes-jonas": "Jonas Brandt", "themes-lena": "Lena Sørensen",
         "themes-theo": "Theo Nakamura-Whitfield"}
LONG_NICK = "Theodor Maximilian Nakamura-Whitfield von Überlänge, der Dritte (he/him) 🏳️‍🌈"


def uid(lp): return f"@{lp}:{DOMAIN}"


# ----------------------------------------------------------------------------------------------- state helpers
def write_secret(path: Path, data: str):
    STATE.mkdir(mode=0o700, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f: f.write(data)
    os.chmod(path, 0o600)


def load(path, default):
    try: return json.loads(Path(path).read_text())
    except FileNotFoundError: return default


S = load(FIX, {})
for k in ("rooms", "events", "media", "seq"): S.setdefault(k, {})


def save(): write_secret(FIX, json.dumps(S, indent=1, ensure_ascii=False))


def tokens(): return load(TOKENS, {})


# ----------------------------------------------------------------------------------------------- HTTP (stdlib)
class MxError(Exception):
    def __init__(self, code, body): super().__init__(f"{code} {body[:300]}"); self.code, self.body = code, body


def api(lp, method, path, body=None, query=None, raw=None, ctype="application/json", auth=True):
    url = HS + path + ("?" + urllib.parse.urlencode(query) if query else "")
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    headers = {"Content-Type": ctype}
    if auth: headers["Authorization"] = "Bearer " + tokens()[lp]["access_token"]
    for attempt in range(12):
        req = urllib.request.Request(url, data, headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                txt = r.read()
                return json.loads(txt) if txt else {}
        except urllib.error.HTTPError as e:
            txt = e.read().decode(errors="replace")
            if e.code == 429:
                try: wait = json.loads(txt).get("retry_after_ms", 5000) / 1000
                except Exception: wait = 5
                print(f"  429, waiting {wait:.1f}s", flush=True); time.sleep(wait + 0.5); continue
            if e.code >= 500 and attempt < 3: time.sleep(3); continue
            raise MxError(e.code, txt)
    raise MxError(429, "gave up")


q = urllib.parse.quote


def txn(): return uuid.uuid4().hex


# ----------------------------------------------------------------------------------------------- login
def cmd_login():
    toks = tokens()
    for line in (STATE / "users.txt").read_text().splitlines():
        if not line.strip(): continue
        lp, pw = line.split(None, 1)
        if lp in toks:
            try: api(lp, "GET", "/_matrix/client/v3/account/whoami"); print(lp, "token ok"); continue
            except MxError as e: print(lp, "stored token invalid:", e.code)
        r = api(lp, "POST", "/_matrix/client/v3/login", {"type": "m.login.password", "identifier": {"type": "m.id.user", "user": lp},
                "password": pw.strip(), "initial_device_display_name": "Theme Lab seeder"}, auth=False)
        toks[lp] = {"user_id": r["user_id"], "access_token": r["access_token"], "device_id": r["device_id"]}
        write_secret(TOKENS, json.dumps(toks, indent=1)); print(lp, "logged in, device", r["device_id"])


# ----------------------------------------------------------------------------------------------- media
def upload(name, lp="themes-mira"):
    p = ASSETS / name
    digest = hashlib.sha256(p.read_bytes()).hexdigest()[:16]
    key = f"{name}:{digest}"
    if key in S["media"]: return S["media"][key]
    mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
    r = api(lp, "POST", "/_matrix/media/v3/upload", raw=p.read_bytes(), ctype=mime, query={"filename": name})
    S["media"][key] = r["content_uri"]; save(); print("  uploaded", name)
    return r["content_uri"]


def png_size(name):
    b = (ASSETS / name).read_bytes()
    return struct.unpack(">II", b[16:24])


# ----------------------------------------------------------------------------------------------- rooms
ROOMS = {
    # key: (name, topic, avatar, encrypted, members)
    "showcase": ("Showcase", "Everything a theme has to survive: markdown, code, polls, media, threads, reactions. "
                 "[Theme Lab test fixture]", "room-showcase.png", False, USERS),
    "design": ("Design Crit", "Weekly critique of the theme gallery — be kind, be specific. 🔐 [Theme Lab test fixture]",
               "room-design.png", True, USERS),
    "code": ("Code Review", "Loader, enhancers and CSS scoping. Paste diffs here. 🔐 [Theme Lab test fixture]",
             "room-code.png", True, USERS),
    "release": ("Release Train 🚂", "Deploy announcements for element.datanauten.de. 🔐 [Theme Lab test fixture]",
                "room-release.png", True, USERS),
    "coffee": ("Coffee ☕", "Off-topic, cats, lunch polls. 🔐 [Theme Lab test fixture]", "room-coffee.png", True, USERS),
    "rtl": ("العربية · עברית · RTL", "Right-to-left content: Arabic and Hebrew messages mixed with English. "
            "[Theme Lab test fixture]", "room-rtl.png", False, USERS),
    "long": ("An Exceedingly Long Room Name That Keeps Going To Test Truncation In Room Lists, Headers And IRC Columns",
             "This topic is also deliberately long so that the room header has to truncate it somewhere around here, "
             "and then it keeps going with more words, a link https://element.io and some emoji 🎉🎨🧪 to make sure "
             "nothing overflows. [Theme Lab test fixture]", "room-long.png", False, USERS),
    "sandbox": ("Theme Lab · Sandbox", "Scratch room for the walkthrough recordings: messages sent by the harness land "
                "here. [Theme Lab test fixture]", "room-sandbox.png", False, USERS),
}
DMS = {  # key: (other user, encrypted)
    "dm-jonas": ("themes-jonas", True), "dm-lena": ("themes-lena", True), "dm-theo": ("themes-theo", True)}
# Rooms the harness opens (their unread state gets cleared on every run); keep unread fixtures elsewhere.
HARNESS_ROOMS = ["showcase", "sandbox", "code", "dm-jonas"]


def room_id(key): return S["rooms"].get(key)


def is_encrypted(key):
    if key in ROOMS: return ROOMS[key][3]
    return DMS[key][1]


def ensure_profiles():
    for lp in USERS:
        prof = api(lp, "GET", f"/_matrix/client/v3/profile/{q(uid(lp))}")
        if prof.get("displayname") != NAMES[lp]:
            api(lp, "PUT", f"/_matrix/client/v3/profile/{q(uid(lp))}/displayname", {"displayname": NAMES[lp]})
        mxc = upload(f"avatar-{lp.split('-')[1]}.png", lp)
        if prof.get("avatar_url") != mxc:
            api(lp, "PUT", f"/_matrix/client/v3/profile/{q(uid(lp))}/avatar_url", {"avatar_url": mxc})
        print(" profile", lp, "ok")


def joined(lp):
    return set(api(lp, "GET", "/_matrix/client/v3/joined_rooms")["joined_rooms"])


def ensure_member(rid, lp, creator="themes-mira"):
    if rid in joined(lp): return
    try: api(creator, "POST", f"/_matrix/client/v3/rooms/{q(rid)}/invite", {"user_id": uid(lp)})
    except MxError as e:
        if "already in the room" not in e.body and e.code != 403: raise
    api(lp, "POST", f"/_matrix/client/v3/join/{q(rid)}", {})


def create_room(key, name, topic, avatar, encrypted, extra=None, members=USERS, creator="themes-mira", is_dm=False):
    if room_id(key):
        return room_id(key)
    initial = [{"type": TAG + ".fixture", "state_key": "", "content": {"key": key, "note": "Theme Lab test fixture"}}]
    if encrypted:
        initial.append({"type": "m.room.encryption", "state_key": "", "content": {"algorithm": "m.megolm.v1.aes-sha2"}})
    if avatar:
        initial.append({"type": "m.room.avatar", "state_key": "", "content": {"url": upload(avatar)}})
    body = {"preset": "trusted_private_chat" if is_dm else "private_chat", "creation_content": {TAG: True},
            "initial_state": initial, "invite": [uid(u) for u in members if u != creator],
            "power_level_content_override": {"users": {} if is_dm else {**{uid(u): 50 for u in members if u != creator}},
                                             "notifications": {"room": 50}}}
    if name: body["name"] = name
    if topic: body["topic"] = topic
    if is_dm: body["is_direct"] = True
    for k2, v2 in (extra or {}).items():
        body[k2] = {**body.get(k2, {}), **v2} if isinstance(v2, dict) else v2
    if body.get("room_version") is None and _room_version() not in ("12",):
        body["power_level_content_override"]["users"][uid(creator)] = 100
    rid = api(creator, "POST", "/_matrix/client/v3/createRoom", body)["room_id"]
    S["rooms"][key] = rid; save(); print(" created", key, rid)
    return rid


_RV = []


def _room_version():
    if not _RV:
        caps = api("themes-mira", "GET", "/_matrix/client/v3/capabilities")
        _RV.append(caps["capabilities"].get("m.room_versions", {}).get("default", "10"))
    return _RV[0]


def cmd_base():
    ensure_profiles()
    # space
    sid = create_room("space", "Theme Lab", "Test fixtures for the Element theme loader (element-web-themes). Not a real community.",
                      "room-space.png", False, extra={"creation_content": {"type": "m.space", TAG: True}})
    for lp in USERS: ensure_member(sid, lp)
    for key, (name, topic, avatar, enc, members) in ROOMS.items():
        # the "long" room starts with a short name; history renames it (state-event fixture)
        rid = create_room(key, "Untitled room" if key == "long" else name, topic, avatar, enc, members=members)
        for lp in members: ensure_member(rid, lp)
        api("themes-mira", "PUT", f"/_matrix/client/v3/rooms/{q(sid)}/state/m.space.child/{q(rid)}",
            {"via": [DOMAIN], "suggested": key in ("showcase", "sandbox")})
        api("themes-mira", "PUT", f"/_matrix/client/v3/rooms/{q(rid)}/state/m.space.parent/{q(sid)}", {"via": [DOMAIN], "canonical": True})
    # DMs (not in the space)
    direct = {lp: {} for lp in USERS}
    for key, (other, enc) in DMS.items():
        rid = create_room(key, None, None, None, enc, members=["themes-mira", other], is_dm=True)
        ensure_member(rid, other)
        direct["themes-mira"].setdefault(uid(other), []).append(rid)
        direct[other].setdefault(uid("themes-mira"), []).append(rid)
    for lp in USERS:
        cur = _account_data_get(lp, "m.direct")
        merged = {**cur}
        for u, rids in direct[lp].items(): merged[u] = sorted(set(merged.get(u, [])) | set(rids))
        if merged != cur: api(lp, "PUT", f"/_matrix/client/v3/user/{q(uid(lp))}/account_data/m.direct", merged)
    # Leave rooms the test users were auto-joined to (e.g. #welcome) so no real community content gets recorded.
    ours = set(S["rooms"].values())
    for lp in USERS:
        for rid in joined(lp) - ours:
            print(f" {lp} leaves non-fixture room {rid}")
            api(lp, "POST", f"/_matrix/client/v3/rooms/{q(rid)}/leave", {})
    # Element prefs for mira's account: show the space, hide nothing special
    print("base done")


def _account_data_get(lp, typ):
    try: return api(lp, "GET", f"/_matrix/client/v3/user/{q(uid(lp))}/account_data/{typ}")
    except MxError as e:
        if e.code == 404: return {}
        raise


# ----------------------------------------------------------------------------------------------- canonical json / signing
def canonical(obj): return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def unpadded_b64(b): return base64.b64encode(b).decode().rstrip("=")


def b64d(s): return base64.b64decode(s + "=" * (-len(s) % 4))


def signable(obj):
    o = {k: v for k, v in obj.items() if k not in ("signatures", "unsigned")}
    return canonical(o)


B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def decode_recovery_key(rk):
    s = rk.replace(" ", "")
    n = 0
    for ch in s: n = n * 58 + B58.index(ch)
    raw = n.to_bytes((n.bit_length() + 7) // 8, "big")
    raw = b"\x00" * (len(s) - len(s.lstrip("1"))) + raw
    assert raw[:2] == b"\x8b\x01" and len(raw) == 35, "bad recovery key prefix/length"
    par = 0
    for b in raw: par ^= b
    assert par == 0, "bad recovery key parity"
    return raw[2:34]


def hkdf_sha256(key, info, length=64, salt=b"\x00" * 32):
    prk = hmac.new(salt, key, hashlib.sha256).digest()
    out, t, i = b"", b"", 1
    while len(out) < length:
        t = hmac.new(prk, t + info + bytes([i]), hashlib.sha256).digest(); out += t; i += 1
    return out[:length]


def ssss_decrypt(lp, secret_name, recovery_key):
    from Crypto.Cipher import AES          # pycryptodome (matrix-nio dependency)
    from Crypto.Util import Counter
    key = decode_recovery_key(recovery_key)
    default = _account_data_get(lp, "m.secret_storage.default_key")["key"]
    enc = _account_data_get(lp, secret_name)["encrypted"][default]
    k = hkdf_sha256(key, secret_name.encode())
    aes_key, mac_key = k[:32], k[32:]
    ct = b64d(enc["ciphertext"])
    mac = hmac.new(mac_key, ct, hashlib.sha256).digest()
    assert hmac.compare_digest(mac, b64d(enc["mac"])), "4S MAC mismatch (wrong recovery key?)"
    iv = b64d(enc["iv"])
    ctr = Counter.new(128, initial_value=int.from_bytes(iv, "big"))
    return AES.new(aes_key, AES.MODE_CTR, counter=ctr).decrypt(ct).decode()   # unpadded base64 seed


# ----------------------------------------------------------------------------------------------- nio (E2EE)
def nio_python():
    cands = [os.environ.get("TL_NIO_PYTHON", "")] + sorted(glob.glob("/home/linuxbrew/.linuxbrew/Cellar/matrix-commander/*/libexec/bin/python"))[::-1]
    for c in cands:
        if c and os.path.exists(c): return c
    sys.exit("No Python with matrix-nio[e2e] found; set TL_NIO_PYTHON")


def need_nio():
    try:
        import nio, olm  # noqa
    except ImportError:
        py = nio_python()
        if os.environ.get("TL_REEXEC"): sys.exit(f"{py} lacks nio/olm")
        os.environ["TL_REEXEC"] = "1"
        os.execv(py, [py, __file__, *sys.argv[1:]])


NIO = {}


async def nio_client(lp):
    import nio
    if lp in NIO: return NIO[lp]
    t = tokens()[lp]
    store = STATE / "nio" / lp
    store.mkdir(parents=True, exist_ok=True); os.chmod(STATE / "nio", 0o700)
    c = nio.AsyncClient(HS, t["user_id"], device_id=t["device_id"], store_path=str(store),
                        config=nio.AsyncClientConfig(encryption_enabled=True, store_sync_tokens=True, max_timeouts=6))
    c.restore_login(t["user_id"], t["device_id"], t["access_token"])
    await c.sync(timeout=0, full_state=True)
    if c.should_upload_keys:
        r = await c.keys_upload(); print("  keys_upload", lp, type(r).__name__)
    NIO[lp] = c
    return c


async def nio_close():
    for c in NIO.values(): await c.close()


async def nio_send(lp, rid, evtype, content):
    import nio
    c = await nio_client(lp)
    if rid not in c.rooms: await c.sync(timeout=0)
    for attempt in range(12):
        r = await c.room_send(rid, evtype, content, ignore_unverified_devices=True)
        if isinstance(r, nio.RoomSendResponse): return r.event_id
        wait = getattr(r, "retry_after_ms", None)
        if wait or getattr(r, "status_code", "") == "M_LIMIT_EXCEEDED":
            print(f"  429 (nio), waiting {(wait or 5000)/1000:.1f}s"); import asyncio; await asyncio.sleep((wait or 5000) / 1000 + 0.5); continue
        raise RuntimeError(f"nio send failed: {r}")
    raise RuntimeError("nio send: rate limited too often")


async def nio_upload_encrypted(lp, name):
    c = await nio_client(lp)
    key = f"enc:{lp}:{name}"
    if key in S["media"]: return S["media"][key]
    p = ASSETS / name
    mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
    with open(p, "rb") as f:
        resp, keys = await c.upload(f, content_type=mime, filename=name, encrypt=True, filesize=p.stat().st_size)
    keys["url"] = resp.content_uri
    S["media"][key] = keys; save(); print("  uploaded (encrypted)", name)
    return keys


# ----------------------------------------------------------------------------------------------- cross-signing
def device_keys(lp, target_lp, device_id):
    r = api(lp, "POST", "/_matrix/client/v3/keys/query", {"device_keys": {uid(target_lp): [device_id] if device_id else []}})
    return r


def cmd_xsign():
    need_nio()
    import asyncio, olm

    async def run():
        for lp in USERS: await nio_client(lp)       # make sure every seeder device has uploaded its device keys
        await nio_close()
    asyncio.run(run())
    for lp in USERS:
        info = device_keys(lp, lp, None)
        master = info.get("master_keys", {}).get(uid(lp))
        secret_path = STATE / f"xsign-{lp}.json"
        if lp == "themes-mira":
            rk_path = STATE / "themes-mira.recovery"
            if not master or not rk_path.exists():
                print(" mira: no cross-signing yet -> run `node tests/harness/session.mjs themes-mira --bootstrap` first"); continue
            rk = rk_path.read_text().strip()
            seeds = {"self_signing": ssss_decrypt(lp, "m.cross_signing.self_signing", rk),
                     "user_signing": ssss_decrypt(lp, "m.cross_signing.user_signing", rk)}
        elif master:
            if not secret_path.exists(): print(f" {lp}: has cross-signing keys we don't hold, skipping"); continue
            seeds = json.loads(secret_path.read_text())
        else:
            seeds = {u: unpadded_b64(olm.PkSigning.generate_seed()) for u in ("master", "self_signing", "user_signing")}
            sk = {u: olm.PkSigning(b64d(s)) for u, s in seeds.items()}
            mk = {"user_id": uid(lp), "usage": ["master"], "keys": {f"ed25519:{sk['master'].public_key}": sk["master"].public_key}}
            def sub(usage):
                o = {"user_id": uid(lp), "usage": [usage], "keys": {f"ed25519:{sk[usage].public_key}": sk[usage].public_key}}
                o["signatures"] = {uid(lp): {f"ed25519:{sk['master'].public_key}": sk["master"].sign(signable(o))}}
                return o
            write_secret(secret_path, json.dumps(seeds))
            api(lp, "POST", "/_matrix/client/v3/keys/device_signing/upload",
                {"master_key": mk, "self_signing_key": sub("self_signing"), "user_signing_key": sub("user_signing")})
            print(f" {lp}: cross-signing keys uploaded")
            info = device_keys(lp, lp, None)
        ssk = olm.PkSigning(b64d(seeds["self_signing"]))
        # sign every device of this user that isn't signed by the SSK yet (seeder + harness Element sessions)
        for dev_id, dk in info["device_keys"].get(uid(lp), {}).items():
            if f"ed25519:{ssk.public_key}" in dk.get("signatures", {}).get(uid(lp), {}): continue
            o = {k: v for k, v in dk.items() if k not in ("signatures", "unsigned")}
            o["signatures"] = {uid(lp): {f"ed25519:{ssk.public_key}": ssk.sign(signable(dk))}}
            r = api(lp, "POST", "/_matrix/client/v3/keys/signatures/upload", {uid(lp): {dev_id: o}})
            print(f" {lp}: signed device {dev_id}", "FAILED " + json.dumps(r["failures"]) if r.get("failures") else "")
        if lp == "themes-mira":
            usk = olm.PkSigning(b64d(seeds["user_signing"]))
            for other in USERS[1:]:
                omk = device_keys(lp, other, None).get("master_keys", {}).get(uid(other))
                if not omk: print("  ", other, "has no master key yet"); continue
                if f"ed25519:{usk.public_key}" in omk.get("signatures", {}).get(uid(lp), {}): continue
                o = {k: v for k, v in omk.items() if k not in ("signatures", "unsigned")}
                o["signatures"] = {uid(lp): {f"ed25519:{usk.public_key}": usk.sign(signable(omk))}}
                mpub = list(omk["keys"].values())[0]
                r = api(lp, "POST", "/_matrix/client/v3/keys/signatures/upload", {uid(other): {mpub: o}})
                print(f" mira verified {other}", "FAILED " + json.dumps(r["failures"]) if r.get("failures") else "")


# ----------------------------------------------------------------------------------------------- content DSL
def pill(lp): return f'<a href="https://matrix.to/#/{uid(lp)}">{NAMES[lp]}</a>'


def T(body, html=None, msgtype="m.text"):
    c = {"msgtype": msgtype, "body": body}
    if html: c.update({"format": "org.matrix.custom.html", "formatted_body": html})
    return c


def mention(c, *lps, room=False):
    c["m.mentions"] = {"user_ids": [uid(l) for l in lps]} if lps else {}
    if room: c["m.mentions"]["room"] = True
    return c


M, J, L, TH = USERS
CODE_PY = '''import json
from pathlib import Path

def load_variants(family: str) -> list[dict]:
    """Return every variant of a theme family, sorted by seriousness."""
    manifest = json.loads(Path(f"themes/{family}/themes.json").read_text())
    return sorted(manifest["variants"], key=lambda v: -v["seriousness"])'''
CODE_TS = '''export function applyTheme(id: string, root = document.documentElement): void {
  const [family] = id.split("-");
  root.dataset.tlTheme = id;          // html[data-tl-theme="teams-2026-light"]
  root.dataset.tlFamily = family;
  window.dispatchEvent(new CustomEvent("tl:theme", { detail: { id } }));
}'''
CODE_CSS = '''html[data-tl-theme="win311-default"] .mx_EventTile {
  border: 2px outset #c0c0c0;
  border-radius: 0;
  background: var(--cpd-color-bg-canvas-default);
}'''
CODE_SH = '''#!/usr/bin/env bash
set -euo pipefail
for t in teams-2026-light win311-default lcars-tng; do
  node tests/harness/shoot.mjs --theme "$t" &
done
wait'''
CODE_RUST = '''fn main() {
    let themes = ["paper-white", "e17-glow", "comic-poster"];
    for (i, t) in themes.iter().enumerate() {
        println!("{i:>2}: {t}");
    }
}'''
CODE_JSON = '''{
  "id": "lcars-tng",
  "stage": "pure",
  "mode": "dark",
  "fonts": [{ "family": "Antonio", "file": "assets/antonio.woff2" }]
}'''
CODE_DIFF = '''--- a/loader/src/apply.ts
+++ b/loader/src/apply.ts
@@ -12,7 +12,8 @@ export function apply(variant: Variant) {
-  style.textContent = variant.css;
+  style.textContent = scope(variant.css, variant.id);
+  style.dataset.tlVariant = variant.id;
   document.head.append(style);
 }'''


def code_html(code, lang):
    esc = code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f'<pre><code class="language-{lang}">{esc}\n</code></pre>'


def code_msg(intro, code, lang):
    return T(f"{intro}\n```{lang}\n{code}\n```", f"<p>{intro}</p>\n{code_html(code, lang)}")


def poll(question, answers, kind="org.matrix.msc3381.poll.disclosed"):
    return ("org.matrix.msc3381.poll.start", {
        "org.matrix.msc3381.poll.start": {"kind": kind, "max_selections": 1,
                                          "question": {"org.matrix.msc1767.text": question},
                                          "answers": [{"id": f"a{i}", "org.matrix.msc1767.text": a} for i, a in enumerate(answers)]},
        "org.matrix.msc1767.text": question + "\n" + "\n".join(f"{i+1}. {a}" for i, a in enumerate(answers))})


WAVE = [int(40 + 50 * abs(__import__("math").sin(i / 3.1)) * (0.6 + 0.4 * __import__("math").sin(i / 11))) for i in range(60)]

# Each item: (key, sender, kind, payload, opts).  kinds: msg, ev (custom type), image, file, voice, location, sticker,
# react, edit, redact, state, nick, leave, join, receipt.  opts: reply=<key>, thread=<key>
SHOWCASE = [
    ("hello", J, "msg", T("Morning all 👋 this room is our torture test for themes — every kind of event lives here."), {}),
    ("plain2", L, "msg", T("Good morning! Coffee first, then pixels."), {}),
    ("long", TH, "msg", T("Here is a deliberately long message so we can see how the timeline wraps text across several lines "
                          "at different widths. Themes love to forget about line-height, paragraph spacing and max widths, so "
                          "this paragraph keeps going: the quick brown fox jumps over the lazy dog, Franz jagt im komplett "
                          "verwahrlosten Taxi quer durch Bayern, Høj bly gom vandt fræk sexquiz på wc, and then a very long "
                          "unbreakable token: https://element.datanauten.de/#/room/!averyveryveryveryveryveryverylongroomid:datanauten.de/$eventidthatgoesonandonandonforeverandever"), {}),
    ("md", M, "msg", T("**Markdown check**: *italic*, ~~strike~~, `inline code`, a [link](https://element.io)\n\n## A heading\n\n"
                       "- first bullet\n- second bullet\n  - nested bullet\n\n1. one\n2. two\n3. three\n\n> A quote that should get "
                       "the theme's blockquote treatment.\n> Second line of the quote.",
                       "<p><strong>Markdown check</strong>: <em>italic</em>, <del>strike</del>, <code>inline code</code>, "
                       "a <a href=\"https://element.io\">link</a></p>\n<h2>A heading</h2>\n<ul>\n<li>first bullet</li>\n"
                       "<li>second bullet\n<ul>\n<li>nested bullet</li>\n</ul>\n</li>\n</ul>\n<ol>\n<li>one</li>\n<li>two</li>\n"
                       "<li>three</li>\n</ol>\n<blockquote>\n<p>A quote that should get the theme's blockquote treatment.<br />"
                       "Second line of the quote.</p>\n</blockquote>\n"), {}),
    ("headings", J, "msg", T("# H1 heading\n### H3 heading\n###### H6 heading\n\n---\n\n| Token | Value |\n|---|---|\n| accent | #0dbd8b |\n| critical | #ff5b55 |",
                             "<h1>H1 heading</h1>\n<h3>H3 heading</h3>\n<h6>H6 heading</h6>\n<hr />\n<table>\n<thead>\n<tr>\n"
                             "<th>Token</th>\n<th>Value</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>accent</td>\n<td>#0dbd8b</td>\n"
                             "</tr>\n<tr>\n<td>critical</td>\n<td>#ff5b55</td>\n</tr>\n</tbody>\n</table>\n"), {}),
    ("code-py", L, "msg", code_msg("Python helper for the manifests:", CODE_PY, "python"), {}),
    ("code-ts", J, "msg", code_msg("And the loader side:", CODE_TS, "typescript"), {}),
    ("code-css", TH, "msg", code_msg("Win 3.11 bevels, minimal version:", CODE_CSS, "css"), {}),
    ("inline", M, "msg", T("Remember: selectors start with `html[data-tl-theme=\"…\"]`, never use the `_hash_` part of a class, and run `npm run build` before `git push`.",
                           "Remember: selectors start with <code>html[data-tl-theme=\"…\"]</code>, never use the <code>_hash_</code> "
                           "part of a class, and run <code>npm run build</code> before <code>git push</code>."), {}),
    ("link", J, "msg", T("Upstream reference: https://element.io/ and the matrix spec https://spec.matrix.org/latest/"), {}),
    ("mention", L, "msg", mention(T(f"{NAMES[M]} can you check the bubble layout on the LCARS theme? {NAMES[TH]} said it clips.",
                                    f"{pill(M)} can you check the bubble layout on the LCARS theme? {pill(TH)} said it clips."), M, TH), {}),
    ("reply1", M, "msg", T("On it — the elbow overlaps the avatar column at 1440px."), {"reply": "mention"}),
    ("reply2", TH, "msg", T("Yes exactly, and IRC layout is fine."), {"reply": "reply1"}),
    ("thread-root", J, "msg", T("🧵 Thread: which theme should be the default for new accounts? Discuss here, not in the main timeline."), {}),
    *[(f"thr{i}", s, "msg", T(t), {"thread": "thread-root"}) for i, (s, t) in enumerate([
        (L, "Paper White, obviously. Calm, readable."), (TH, "Teams 2026 Light — people know it."),
        (M, "Element default stays default; themes are opt-in."), (J, "Agree with Mira, but the gallery should be one click away."),
        (L, "Could we pick by OS dark mode? Paper Black at night."), (TH, "Daylight variants do exactly that."),
        (M, "Let's look at the walkthrough grid on Friday and vote."), (J, "+1"), (L, "+1, I'll bring cake 🍰"),
        (TH, "Adding a poll to Coffee for the cake flavour."), (M, "Summary: default unchanged, gallery button in quick settings."),
        (J, "Ship it."), (L, "Shipping 🚢"), (TH, "Closing the thread 👍")])],
    ("react-target", M, "msg", T("New gallery screenshots are up: 65 themes, all regions. React if your favourite made it!"), {}),
    *[(f"r{i}", s, "react", ("react-target", e), {}) for i, (s, e) in enumerate([
        (J, "👍"), (L, "👍"), (TH, "👍"), (J, "🎉"), (L, "❤️"), (TH, "🚀"), (L, "😂"), (J, "👀"), (TH, "🖖"), (L, "🎨"),
        (J, "🔥"), (TH, "✅"), (M, "🙏")])],
    *[(f"r-md{i}", s, "react", ("md", e), {}) for i, (s, e) in enumerate([(J, "👍"), (TH, "💯")])],
    ("typo", TH, "msg", T("Teh blueprint theme needs more contrast on code blocks"), {}),
    ("typo-edit", TH, "edit", ("typo", T("The blueprint theme needs more contrast on code blocks (edited: fixed typo)")), {}),
    ("oops", J, "msg", T("this message will be deleted"), {}),
    ("oops-redact", J, "redact", "oops", {}),
    ("poll", L, "ev", poll("Which layout do you use?", ["Modern", "Message bubbles", "IRC"]), {}),
    *[(f"pv{i}", s, "ev", ("org.matrix.msc3381.poll.response", {"org.matrix.msc3381.poll.response": {"answers": [a]}}), {"ref": "poll"})
      for i, (s, a) in enumerate([(J, "a0"), (M, "a1"), (TH, "a2"), (L, "a0")])],
    ("poll2", J, "ev", poll("Ship the loader this week?", ["Yes", "No", "Next sprint"]), {}),
    *[(f"pw{i}", s, "ev", ("org.matrix.msc3381.poll.response", {"org.matrix.msc3381.poll.response": {"answers": [a]}}), {"ref": "poll2"})
      for i, (s, a) in enumerate([(L, "a0"), (TH, "a0"), (M, "a2")])],
    ("poll2-end", J, "ev", ("org.matrix.msc3381.poll.end", {"org.matrix.msc3381.poll.end": {}, "org.matrix.msc1767.text": "Ended poll"}), {"ref": "poll2"}),
    ("img1", TH, "image", ("photo-sunset.png", "Sunset over the theme lab"), {}),
    ("img2", L, "image", ("palette.png", "palette.png"), {}),
    ("img3", M, "image", ("diagram-tall.png", "diagram-tall.png"), {}),
    ("file1", J, "file", ("release-notes.pdf", "application/pdf"), {}),
    ("file2", L, "file", ("compound-tokens.json", "application/json"), {}),
    ("voice", TH, "voice", "voice.ogg", {}),
    ("location", L, "location", ("c-base, Berlin", "geo:52.5130,13.4200;u=20"), {}),
    ("sticker", J, "sticker", ("sticker-smile.png", "Smiling face"), {}),
    ("spoiler", M, "msg", T("Friday's winner is [Spoiler](LCARS TNG)",
                            'Friday\'s winner is <span data-mx-spoiler="vote result">LCARS TNG</span>'), {}),
    ("emoji1", J, "msg", T("🎉🎨🚀"), {}),
    ("emoji2", L, "msg", T("❤️"), {}),
    ("emote", TH, "msg", T("is rendering 65 walkthroughs at once", msgtype="m.emote"), {}),
    ("notice", M, "msg", T("ℹ️ Automated notice: nightly screenshots finished (65/65 themes, 0 failures).", msgtype="m.notice"), {}),
    ("atroom", M, "msg", mention(T("@room heads-up: theme freeze tomorrow at 10:00, last chance for fixes."), room=True), {}),
    ("rtl-mix", L, "msg", T("Mixed direction: English then العربية ثم עברית and back to English."), {}),
    ("code-rust", TH, "msg", code_msg("Unrelated but pretty:", CODE_RUST, "rust"), {}),
    ("code-plain", J, "msg", T("```\nplain preformatted block\n  no language, keeps    spacing\n```",
                               "<pre><code>plain preformatted block\n  no language, keeps    spacing\n</code></pre>"), {}),
    ("last", L, "msg", T("That's the full set. Screenshot away 📸"), {}),
    ("rc-j", J, "receipt", "last", {}), ("rc-l", L, "receipt", "last", {}), ("rc-t", TH, "receipt", "emoji2", {}),
    ("rc-m", M, "receipt", "last", {}),
]

DESIGN = [
    ("d1", L, "msg", T("Crit for today: the Teams 2026 room list. Screenshot below."), {}),
    ("d-img", L, "image", ("palette.png", "teams-roomlist.png"), {}),
    ("d2", J, "msg", T("Spacing between items feels 2px too tight compared to real Teams."), {"reply": "d1"}),
    ("d3", TH, "msg", T("Hover state is perfect though."), {}),
    ("d-r1", M, "react", ("d3", "💯"), {}), ("d-r2", J, "react", ("d3", "👍"), {}),
    ("d4", M, "msg", T("I'll check density settings after lunch."), {}),
    ("rc-m", M, "receipt", "d4", {}),
    # unread + highlight for mira from here on
    ("d5", J, "msg", mention(T(f"{NAMES[M]} the badge colours look off in dark mode, can you take a look?",
                               f"{pill(M)} the badge colours look off in dark mode, can you take a look?"), M), {}),
    ("d6", L, "msg", T("Also the unread dot vanishes on hover."), {}),
]
CODE = [
    ("c1", J, "msg", code_msg("PR #42: scope all selectors at build time", CODE_DIFF, "diff"), {}),
    ("c2", M, "msg", T("Looks good. What about `@font-face` rules — they can't be scoped?",
                       "Looks good. What about <code>@font-face</code> rules — they can't be scoped?"), {"reply": "c1"}),
    ("c3", J, "msg", T("Right, those stay global but use prefixed family names."), {"thread": "c1"}),
    ("c4", TH, "msg", code_msg("Manifest example:", CODE_JSON, "json"), {"thread": "c1"}),
    ("c5", M, "msg", T("👍 approve"), {"thread": "c1"}),
    ("c6", L, "msg", code_msg("Batch screenshot script:", CODE_SH, "bash"), {"thread": "c1"}),
    ("c7", J, "msg", T("Merged."), {"thread": "c1"}),
    ("c8", TH, "msg", T("Next: enhancer lifecycle. `mount()` must never throw into Element.",
                        "Next: enhancer lifecycle. <code>mount()</code> must never throw into Element."), {}),
    ("c-edit", TH, "edit", ("c8", T("Next: enhancer lifecycle. `mount()`/`unmount()` must never throw into Element.",
                                    "Next: enhancer lifecycle. <code>mount()</code>/<code>unmount()</code> must never throw into Element.")), {}),
    ("c-r", M, "react", ("c8", "✅"), {}),
    ("rc-m", M, "receipt", "c8", {}),
]
RELEASE = [
    ("rl1", J, "msg", T("🚂 Release 0.1.0 of the theme loader is on staging."), {}),
    ("rl2", L, "msg", T("Smoke test passed on Firefox and Chrome."), {}),
    ("rl-r", M, "react", ("rl2", "🎉"), {}),
    ("rc-m", M, "receipt", "rl2", {}),
    ("rl3", J, "msg", mention(T("@room production deploy of element.datanauten.de at 14:00 — expect a reload."), room=True), {}),
    ("rl4", TH, "msg", T("Rollback plan is in the runbook."), {}),
]
COFFEE = [
    ("cf1", TH, "msg", T("Who's up for lunch at 12:30?"), {}),
    ("cf-poll", TH, "ev", poll("Cake flavour for Friday?", ["Chocolate", "Lemon", "Carrot", "Surprise me"]), {}),
    *[(f"cfv{i}", s, "ev", ("org.matrix.msc3381.poll.response", {"org.matrix.msc3381.poll.response": {"answers": [a]}}), {"ref": "cf-poll"})
      for i, (s, a) in enumerate([(J, "a0"), (L, "a1")])],
    ("cf2", L, "msg", T("😺😺😺"), {}),
    ("cf3", J, "msg", T("The cat is sitting on the keyboard again", "The cat is sitting on the keyboard again"), {}),
    ("rc-m", M, "receipt", "cf3", {}),
    ("cf4", L, "msg", T("Pizza place has a new vegan option 🍕"), {}),
    ("cf5", TH, "msg", T("I'm in."), {}),
    ("cf6", J, "msg", T("Same, see you downstairs."), {}),
]
RTL = [
    ("rt1", L, "msg", T("مرحبا بالجميع! هذه رسالة باللغة العربية لاختبار اتجاه النص من اليمين إلى اليسار في الواجهة."), {}),
    ("rt2", TH, "msg", T("שלום לכולם! זו הודעה בעברית כדי לבדוק כיוון טקסט מימין לשמאל."), {}),
    ("rt3", J, "msg", T("Mixed: the theme ‏«لوحة الألوان»‏ works, but עברית with numbers 2026 and English words breaks?"), {}),
    ("rt4", L, "msg", T("**قائمة:**\n- العنصر الأول\n- العنصر الثاني",
                        "<p><strong>قائمة:</strong></p>\n<ul>\n<li>العنصر الأول</li>\n<li>العنصر الثاني</li>\n</ul>\n"), {}),
    ("rt5", TH, "msg", T("> ציטוט בעברית\nותשובה מתחת", "<blockquote>\n<p>ציטוט בעברית</p>\n</blockquote>\n<p>ותשובה מתחת</p>\n"), {}),
    ("rt-r", M, "react", ("rt1", "👍"), {}),
    ("rc-m", M, "receipt", "rt5", {}),
]
LONG = [
    ("ln-name", M, "state", ("m.room.name", "", {"name": ROOMS["long"][0]}), {}),
    ("ln-nick", TH, "nick", LONG_NICK, {}),
    ("ln1", TH, "msg", T("My name in this room is ridiculous on purpose. Does it truncate in the IRC column?"), {}),
    ("ln-leave", L, "leave", None, {}),
    ("ln-join", L, "join", None, {}),
    ("ln-nick2", L, "nick", "Lena (out of office until Monday, ping Jonas for anything urgent)", {}),
    ("ln2", L, "msg", T("Back again, with a long status-style display name."), {}),
    ("ln-topic", M, "state", ("m.room.topic", "", {"topic": ROOMS["long"][1]}), {}),
    ("ln3", J, "msg", T("Supercalifragilisticexpialidocious-Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft"), {}),
    ("rc-m", M, "receipt", "ln3", {}),
]
SANDBOX = [
    ("sb1", M, "msg", T("Sandbox for walkthrough recordings. Messages below are sent by the harness."), {}),
    ("rc-m", M, "receipt", "sb1", {}),
]
DM_JONAS = [
    ("dj1", J, "msg", T("Hey Mira, quick question about the LCARS fonts — is Antonio OFL?"), {}),
    ("dj2", M, "msg", T("Yes, SIL OFL 1.1, fine to bundle."), {}),
    ("dj3", J, "msg", T("Perfect, thanks! 🙏"), {}),
    ("rc-m", M, "receipt", "dj3", {}),
]
DM_LENA = [
    ("dl1", L, "msg", T("Can you send me the walkthrough grid when it's rendered?"), {}),
    ("dl2", M, "msg", T("Sure, tonight."), {}),
    ("rc-m", M, "receipt", "dl2", {}),
    ("dl3", L, "msg", T("Great, no rush ✨"), {}),
]
DM_THEO = [
    ("dt1", TH, "msg", T("Mira! The blueprint theme crashed my browser 😅"), {}),
    ("dt2", TH, "msg", T("Never mind, it was an extension."), {}),
]
SCRIPTS = {"showcase": SHOWCASE, "design": DESIGN, "code": CODE, "release": RELEASE, "coffee": COFFEE, "rtl": RTL,
           "long": LONG, "sandbox": SANDBOX, "dm-jonas": DM_JONAS, "dm-lena": DM_LENA, "dm-theo": DM_THEO}

# Rooms that should show unread (+highlight) for mira, and what to post when the harness/`unread` finds them read.
UNREAD = {"design": (J, True), "release": (J, "room"), "coffee": (L, False), "dm-theo": (TH, False), "dm-lena": (L, False)}


async def send(rkey, lp, evtype, content):
    rid = room_id(rkey)
    if is_encrypted(rkey) and evtype not in ("m.reaction",):
        return await nio_send(lp, rid, evtype, content)
    return api(lp, "PUT", f"/_matrix/client/v3/rooms/{q(rid)}/send/{q(evtype)}/{txn()}", content)["event_id"]


async def media_content(rkey, lp, name):
    if is_encrypted(rkey):
        return {"file": {k: v for k, v in (await nio_upload_encrypted(lp, name)).items()}}
    return {"url": upload(name, lp)}


async def run_item(rkey, item, ev):
    key, lp, kind, payload, opts = item
    rid = room_id(rkey)
    evtype, content = "m.room.message", None
    if kind == "msg": content = json.loads(json.dumps(payload))
    elif kind == "ev": evtype, content = payload[0], json.loads(json.dumps(payload[1]))
    elif kind == "image":
        name, body = payload; w, h = png_size(name)
        content = {"msgtype": "m.image", "body": body, "info": {"w": w, "h": h, "mimetype": "image/png", "size": (ASSETS / name).stat().st_size}}
        content.update(await media_content(rkey, lp, name))
    elif kind == "sticker":
        name, body = payload; w, h = png_size(name); evtype = "m.sticker"
        content = {"body": body, "info": {"w": 200, "h": 200, "mimetype": "image/png", "size": (ASSETS / name).stat().st_size}}
        content.update(await media_content(rkey, lp, name))
        if "file" in content: content["url"] = content["file"]["url"]   # stickers are never encrypted media
    elif kind == "file":
        name, mime = payload
        content = {"msgtype": "m.file", "body": name, "filename": name, "info": {"mimetype": mime, "size": (ASSETS / name).stat().st_size}}
        content.update(await media_content(rkey, lp, name))
    elif kind == "voice":
        size = (ASSETS / payload).stat().st_size
        content = {"msgtype": "m.audio", "body": "Voice message", "info": {"mimetype": "audio/ogg", "duration": 7000, "size": size},
                   "org.matrix.msc1767.audio": {"duration": 7000, "waveform": WAVE}, "org.matrix.msc3245.voice": {},
                   "org.matrix.msc1767.text": "Voice message"}
        content.update(await media_content(rkey, lp, payload))
    elif kind == "location":
        desc, geo = payload
        content = {"msgtype": "m.location", "body": f"{desc} ({geo})", "geo_uri": geo,
                   "org.matrix.msc3488.location": {"uri": geo, "description": desc}, "org.matrix.msc3488.asset": {"type": "m.pin"},
                   "org.matrix.msc1767.text": f"{desc} ({geo})", "org.matrix.msc3488.ts": int(time.time() * 1000)}
    elif kind == "react":
        tkey, emoji = payload; evtype = "m.reaction"
        content = {"m.relates_to": {"rel_type": "m.annotation", "event_id": ev[tkey], "key": emoji}}
    elif kind == "edit":
        tkey, new = payload
        content = {**{k: v for k, v in new.items()}, "body": "* " + new["body"], "m.new_content": new,
                   "m.relates_to": {"rel_type": "m.replace", "event_id": ev[tkey]}}
        if "formatted_body" in new: content["formatted_body"] = "* " + new["formatted_body"]
    elif kind == "redact":
        return api(lp, "PUT", f"/_matrix/client/v3/rooms/{q(rid)}/redact/{q(ev[payload])}/{txn()}", {"reason": "fixture: redaction"})["event_id"]
    elif kind == "state":
        typ, sk, c = payload
        return api(lp, "PUT", f"/_matrix/client/v3/rooms/{q(rid)}/state/{q(typ)}/{q(sk)}", c)["event_id"]
    elif kind == "nick":
        cur = api(lp, "GET", f"/_matrix/client/v3/rooms/{q(rid)}/state/m.room.member/{q(uid(lp))}")
        return api(lp, "PUT", f"/_matrix/client/v3/rooms/{q(rid)}/state/m.room.member/{q(uid(lp))}", {**cur, "displayname": payload})["event_id"]
    elif kind == "leave":
        api(lp, "POST", f"/_matrix/client/v3/rooms/{q(rid)}/leave", {}); return "left"
    elif kind == "join":
        api("themes-mira", "POST", f"/_matrix/client/v3/rooms/{q(rid)}/invite", {"user_id": uid(lp)})
        return api(lp, "POST", f"/_matrix/client/v3/join/{q(rid)}", {})["room_id"]
    elif kind == "receipt":
        target = ev[payload]
        api(lp, "POST", f"/_matrix/client/v3/rooms/{q(rid)}/receipt/m.read/{q(target)}", {})
        if lp == "themes-mira":
            api(lp, "POST", f"/_matrix/client/v3/rooms/{q(rid)}/read_markers", {"m.fully_read": target, "m.read": target})
        return target
    rel = None
    if "reply" in opts: rel = {"m.in_reply_to": {"event_id": ev[opts["reply"]]}}
    if "thread" in opts:
        root = ev[opts["thread"]]
        prev = [ev[k] for (k, _, _, _, o) in SCRIPTS[rkey] if o.get("thread") == opts["thread"] and k in ev]
        rel = {"rel_type": "m.thread", "event_id": root, "is_falling_back": True, "m.in_reply_to": {"event_id": prev[-1] if prev else root}}
    if "ref" in opts: rel = {"rel_type": "m.reference", "event_id": ev[opts["ref"]]}
    if rel: content["m.relates_to"] = rel
    return await send(rkey, lp, evtype, content)


def cmd_history(only=None):
    need_nio()
    import asyncio

    async def run():
        for rkey, script in SCRIPTS.items():
            if only and rkey not in only: continue
            if not room_id(rkey): print("missing room", rkey, "- run base first"); continue
            ev = S["events"].setdefault(rkey, {})
            todo = [it for it in script if it[0] not in ev]
            print(f"{rkey}: {len(script) - len(todo)} done, {len(todo)} to send", flush=True)
            for it in todo:
                ev[it[0]] = await run_item(rkey, it, ev)
                save()
        await nio_close()
    asyncio.run(run())


def mira_unread():
    flt = json.dumps({"room": {"timeline": {"limit": 1}, "state": {"lazy_load_members": True, "types": []},
                               "ephemeral": {"types": []}, "account_data": {"types": []}}, "presence": {"types": []}, "account_data": {"types": []}})
    r = api("themes-mira", "GET", "/_matrix/client/v3/sync", query={"filter": flt, "timeout": "0"})
    out = {}
    for rid, j in r.get("rooms", {}).get("join", {}).items():
        out[rid] = j.get("unread_notifications", {})
    return out


UNREAD_TEXTS = ["Quick ping — new screenshots are in.", "Any update on this?", "Pushed another fix, please re-check.",
                "Lunch later?", "Heads-up: theme freeze moved by one hour."]


def cmd_unread():
    need_nio()
    import asyncio
    counts = mira_unread()

    async def run():
        for rkey, (lp, hl) in UNREAD.items():
            rid = room_id(rkey)
            if not rid: continue
            c = counts.get(rid, {})
            if c.get("notification_count", 0) > 0 and (not hl or c.get("highlight_count", 0) > 0 or is_encrypted(rkey)):
                print(f" {rkey}: already unread {c}"); continue
            n = S["seq"].get(rkey, 0); S["seq"][rkey] = n + 1; save()
            text = UNREAD_TEXTS[n % len(UNREAD_TEXTS)]
            if hl == "room": content = mention(T("@room " + text), room=True)
            elif hl: content = mention(T(f"{NAMES[M]}: {text}", f"{pill(M)}: {text}"), M)
            else: content = T(text)
            await send(rkey, lp, "m.room.message", content)
            print(f" {rkey}: posted unread message ({'highlight' if hl else 'plain'})")
        await nio_close()
    asyncio.run(run())


def cmd_status():
    print("rooms:")
    for k, rid in S["rooms"].items():
        name = ROOMS.get(k, ("Theme Lab space" if k == "space" else f"DM with {DMS.get(k, ('?',))[0]}",))[0]
        print(f"  {k:9} {rid}  {len(S['events'].get(k, {})):3} events  {name}")
    counts = mira_unread() if TOKENS.exists() else {}
    for k, rid in S["rooms"].items():
        if rid in counts and counts[rid].get("notification_count"): print(f"  unread for mira: {k} {counts[rid]}")
    print("recovery key stored:", (STATE / "themes-mira.recovery").exists())


def cmd_all():
    need_nio()
    cmd_login(); cmd_base()
    if not (STATE / "themes-mira.recovery").exists():
        subprocess.run(["node", str(ROOT / "tests/harness/session.mjs"), "themes-mira", "--bootstrap"], check=True)
    cmd_xsign()
    cmd_history()
    cmd_unread()
    subprocess.run(["node", str(ROOT / "tests/harness/session.mjs"), "themes-mira", "--sync"], check=True)
    cmd_status()


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    fn = {"login": cmd_login, "base": cmd_base, "xsign": cmd_xsign, "unread": cmd_unread, "status": cmd_status, "all": cmd_all}.get(cmd)
    if cmd == "history": cmd_history(sys.argv[2:] or None)
    elif fn: fn()
    else: sys.exit(__doc__)
