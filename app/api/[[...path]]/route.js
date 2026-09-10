// ==========================================================================
// Vercel-compatible API bridge
// ==========================================================================
// The Express app (backend/app.js) needs Node-style req/res objects, while
// Next.js App Router route handlers receive Web `Request`/`Response`.
// `serverless-http` cannot wrap a Web Request (it assigns `req.body`, which
// is getter-only on undici's Request → "Cannot set property body"), so we
// instead run the Express app on a real HTTP server bound to an ephemeral
// loopback port — once per cold start — and proxy each Web Request to it.
// This preserves full Express semantics (helmet, CORS, cookie sessions via
// connect-mongo) with zero shimming, and the server is reused while warm.

import http from 'node:http';
import { createApp } from '../../../backend/app.js';
import { getDb } from '../../../backend/config/db.js';
import { seedAdmin } from '../../../backend/services/authService.js';

let serverPromise = null;
let bootPromise = null;

function ensureServer() {
    if (!serverPromise) {
        serverPromise = new Promise((resolve, reject) => {
            const server = http.createServer(createApp());
            server.on('error', (err) => {
                serverPromise = null;
                reject(err);
            });
            server.listen(0, '127.0.0.1', () => resolve(server));
        });
    }
    return serverPromise;
}

async function boot() {
    if (!bootPromise) {
        bootPromise = (async () => {
            await getDb();
            await seedAdmin();
        })().catch((err) => {
            // Reset so the next request retries boot instead of re-throwing
            // the same cached failure (e.g. transient DB/network issues).
            bootPromise = null;
            throw err;
        });
    }
    await bootPromise;
}

// Hop-by-hop / framing headers that must not be forwarded.
const STRIP_REQUEST_HEADERS = new Set([
    'host', 'connection', 'content-length', 'transfer-encoding',
    'keep-alive', 'upgrade', 'expect'
]);

const STRIP_RESPONSE_HEADERS = new Set([
    'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'te',
    'trailer', 'content-length', 'content-encoding'
]);

// Raw node:http round-trip to the loopback server. Deliberately NOT using
// global fetch: Next.js patches it (caching/instrumentation) and it exposes
// Set-Cookie only through getSetCookie(); a plain http.request is transparent.
function loopbackRequest(server, method, path, headers, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            { host: '127.0.0.1', port: server.address().port, path, method, headers },
            (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => resolve({
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.headers,
                    body: Buffer.concat(chunks)
                }));
            }
        );
        req.on('error', reject);
        if (body && body.length) req.write(body);
        req.end();
    });
}

async function handle(request) {
    try {
        await boot();
        const server = await ensureServer();
        const url = new URL(request.url);
        const method = request.method.toUpperCase();

        const headers = {};
        for (const [key, value] of request.headers.entries()) {
            if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) {
                headers[key] = value;
            }
        }

        let body;
        if (method !== 'GET' && method !== 'HEAD') {
            body = Buffer.from(await request.arrayBuffer());
            if (body.length) headers['content-length'] = String(body.length);
        }

        const upstream = await loopbackRequest(
            server, method, `${url.pathname}${url.search}`, headers, body
        );

        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(upstream.headers)) {
            const k = key.toLowerCase();
            if (STRIP_RESPONSE_HEADERS.has(k)) continue;
            if (k === 'set-cookie') {
                for (const cookie of [].concat(value)) {
                    responseHeaders.append('set-cookie', cookie);
                }
                continue;
            }
            responseHeaders.set(key, Array.isArray(value) ? value.join(', ') : String(value));
        }

        return new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: responseHeaders
        });
    } catch (err) {
        console.error('API error:', err?.name, err?.code ?? '', '-', err?.message);
        return Response.json(
            {
                success: false,
                message: 'Backend database is unavailable. Please try again later.',
                error: {
                    name: err?.name ?? 'Error',
                    code: err?.code ?? null,
                    detail: err?.message ?? String(err)
                }
            },
            { status: 500 }
        );
    }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
export const HEAD = handle;
export const OPTIONS = handle;