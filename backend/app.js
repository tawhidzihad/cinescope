// ==========================================================================
// Express App Factory — reusable locally and inside Vercel functions
// ==========================================================================

import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import cors from 'cors';

import movieRoutes from './routes/movieRoutes.js';
import authRoutes from './routes/authRoutes.js';
import genreRoutes from './routes/genreRoutes.js';

export function createApp() {
    const app = express();

    // Behind Vercel/Netlify (or any reverse proxy) TLS is terminated upstream.
    // Trusting the proxy makes `req.secure` honor `X-Forwarded-Proto`, which
    // is required for express-session to set its `Secure` cookie in production.
    app.set('trust proxy', 1);

    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));

    app.use(cors({
        origin: true,
        credentials: true
    }));

    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ extended: true, limit: '5mb' }));

    const sessionConfig = {
        name: 'cinescope.sid',
        secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        }
    };

    if (process.env.MONGODB_URI) {
        sessionConfig.store = MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            dbName: process.env.MONGODB_DB || 'cinescope',
            collectionName: 'sessions',
            ttl: 24 * 60 * 60
        });
    }

    app.use(session(sessionConfig));

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/genres', genreRoutes);
    app.use('/api/movies', movieRoutes);

    // API health check
    app.get('/api/health', (req, res) => {
        res.json({ success: true, data: { status: 'ok' } });
    });

    // JSON 404 for unknown API routes (never the HTML 404 page)
    app.use('/api', (req, res) => {
        res.status(404).json({ success: false, message: 'API endpoint not found' });
    });

    // Structured, user-safe error handler — no stack traces or internals
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err.type === 'entity.too.large') {
            return res.status(413).json({ success: false, message: 'Request body too large' });
        }
        if (err.type === 'entity.parse.failed') {
            return res.status(400).json({ success: false, message: 'Invalid JSON body' });
        }
        console.error('Unhandled API error:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    });

    return app;
}