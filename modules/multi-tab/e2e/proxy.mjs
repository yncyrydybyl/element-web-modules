#!/usr/bin/env node
// Logging reverse proxy between the browser and a homeserver. No dependencies.
//
//   node e2e/proxy.mjs --target http://127.0.0.1:18460 --port 18461 [--log e2e/.run/proxy-18461.jsonl]
//
// Everything is passed through unchanged (CORS preflights, streaming bodies, long-polls). One JSON line per
// request is appended to the log when the response ends or the connection drops:
//   {ts, end, method, path, since, timeout, tokenSuffix, status, durMs, aborted?, nextBatch?, bytes}
// `ts` is the request start (ms epoch), `end` the finish, so /sync intervals can be checked for overlap.
// `nextBatch` is parsed from successful /sync responses so since-chains can be reconstructed.
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
    process.argv
        .slice(2)
        .reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const target = new URL(args.target ?? "http://127.0.0.1:18460");
const port = Number(args.port ?? 18461);
const host = args.host ?? "127.0.0.1";
const logFile = path.resolve(args.log ?? `e2e/.run/proxy-${port}.jsonl`);
fs.mkdirSync(path.dirname(logFile), { recursive: true });
const log = fs.createWriteStream(logFile, { flags: "a" });
const client = target.protocol === "https:" ? https : http;
const agent = new client.Agent({ keepAlive: true, maxSockets: 256 });

const HOP = new Set(["connection", "keep-alive", "transfer-encoding", "proxy-connection", "upgrade"]);
const SYNC_RE = /^\/_matrix\/client\/[^/]+\/sync$/;

function tokenSuffix(req, url) {
    const auth = req.headers.authorization ?? "";
    const tok = auth.startsWith("Bearer ") ? auth.slice(7) : (url.searchParams.get("access_token") ?? "");
    return tok ? tok.slice(-6) : null;
}

const server = http.createServer((req, res) => {
    const start = Date.now();
    const url = new URL(req.url, "http://x");
    const isSync = req.method === "GET" && SYNC_RE.test(url.pathname);
    const entry = {
        ts: start,
        method: req.method,
        path: url.pathname,
        since: url.searchParams.get("since"),
        timeout: url.searchParams.has("timeout") ? Number(url.searchParams.get("timeout")) : null,
        tokenSuffix: tokenSuffix(req, url),
        status: 0,
    };
    let written = false;
    let bytes = 0;
    const finish = (extra = {}) => {
        if (written) return;
        written = true;
        const end = Date.now();
        log.write(JSON.stringify({ ...entry, ...extra, end, durMs: end - start, bytes }) + "\n");
    };

    const headers = { ...req.headers, host: target.host };
    for (const h of HOP) delete headers[h];
    // Parse next_batch out of /sync bodies: ask upstream for an uncompressed body there (identity only).
    if (isSync) delete headers["accept-encoding"];
    const upstream = client.request(
        {
            protocol: target.protocol,
            hostname: target.hostname,
            port: target.port || (target.protocol === "https:" ? 443 : 80),
            method: req.method,
            path: req.url,
            headers,
            agent,
            servername: target.hostname,
        },
        (up) => {
            entry.status = up.statusCode;
            const out = [];
            for (let i = 0; i < up.rawHeaders.length; i += 2)
                if (!HOP.has(up.rawHeaders[i].toLowerCase())) out.push(up.rawHeaders[i], up.rawHeaders[i + 1]);
            res.writeHead(up.statusCode, up.statusMessage, out);
            const chunks = isSync && up.statusCode === 200 ? [] : null;
            up.on("data", (c) => {
                bytes += c.length;
                if (chunks) chunks.push(c);
            });
            up.pipe(res);
            up.on("end", () => {
                let nextBatch;
                if (chunks) {
                    try {
                        nextBatch = JSON.parse(Buffer.concat(chunks).toString("utf8")).next_batch;
                    } catch {
                        nextBatch = "<unparsed>";
                    }
                }
                finish(nextBatch ? { nextBatch } : {});
            });
            up.on("error", () => finish({ aborted: true }));
        },
    );
    upstream.setTimeout(0);
    upstream.on("error", (e) => {
        finish({ aborted: true, error: e.code ?? String(e) });
        if (!res.headersSent) {
            res.writeHead(502, { "content-type": "application/json", "access-control-allow-origin": "*" });
            res.end(JSON.stringify({ errcode: "M_UNKNOWN", error: `proxy: ${e.message}` }));
        } else res.destroy();
    });
    // Browser went away (tab closed/crashed, request aborted): drop the upstream long-poll too.
    res.on("close", () => {
        if (!res.writableFinished) {
            finish({ aborted: true });
            upstream.destroy();
        }
    });
    req.pipe(upstream);
});
server.requestTimeout = 0;
server.headersTimeout = 60_000;
server.keepAliveTimeout = 65_000;
server.timeout = 0;
server.listen(port, host, () => {
    process.stdout.write(`proxy http://${host}:${port} -> ${target.origin}  log ${logFile}\n`);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => (log.end(), process.exit(0)));
