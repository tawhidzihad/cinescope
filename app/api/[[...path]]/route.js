// ==========================================================================
// Vercel-compatible API bridge
// ==========================================================================
// Mounts the Express app (backend/app.js) through serverless-http so the
// exact same backend serves requests locally (node backend/server.js) and on
// Vercel serverless functions, under /api/*.

import serverlessHttp from 'serverless-http';
import { createApp } from '../../../backend/app.js';
import { getDb } from '../../../backend/config/db.js';
import { seedAdmin } from '../../../backend/services/authService.js';

// Cache the wrapped app across warm invocations.
let handler = null;
let bootPromise = null;

async function boot() {
    if (!handler) {
        const app = createApp();
        handler = serverlessHttp(app);
    }
    if (!bootPromise) {
        bootPromise = (async () => {
            await getDb();
            await seedAdmin();
        })();
    }
    await bootPromise;
}

async function handle(request) {
    try {
        await boot();
    } catch (err) {
        console.error('API boot error:', err.message);
        return Response.json(
            { success: false, message: 'Backend database is unavailable. Please try again later.' },
            { status: 500 }
        );
    }

    // Pass the Request through as-is — the Express app already defines its
    // routes under /api/auth, /api/genres, /api/movies, so the original
    // pathname (including /api) matches directly.
    return handler(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
export const HEAD = handle;