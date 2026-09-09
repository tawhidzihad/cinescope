// ==========================================================================
// Local Backend Entry Point — development/standalone use only.
// On Vercel, the same createApp() is mounted via app/api/[...path]/route.js
// ==========================================================================

import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { getDb } from './config/db.js';
import { seedAdmin } from './services/authService.js';

const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

async function start() {
    await getDb();
    await seedAdmin();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`CineScope backend listening on http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error('Backend failed to start:', err.message);
    process.exit(1);
});