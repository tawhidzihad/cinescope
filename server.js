import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB, isConnected } from './server/config/db.js';
import { seedAdmin } from './server/controllers/authController.js';
import movieRoutes from './server/routes/movieRoutes.js';
import authRoutes from './server/routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Behind Netlify (or any reverse proxy) TLS is terminated upstream. Trusting
  // the proxy makes `req.secure` honor `X-Forwarded-Proto`, which is required
  // for express-session to actually set its `Secure` cookie in production —
  // without this, login succeeds but the session cookie is never stored.
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
      touchAfter: 24 * 3600,
      ttl: 24 * 60 * 60
    });
  }

  app.use(session(sessionConfig));

  const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.mjs': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  function serveStatic(req, res, next) {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return next();
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  }

  // Lightweight diagnostic endpoint: reports connectivity and which required
  // environment variables are present (booleans only — never their values).
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      data: {
        dbConnected: isConnected(),
        env: {
          MONGODB_URI: Boolean(process.env.MONGODB_URI),
          SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
          ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
          ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD)
        }
      }
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
  });

  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
  });

  app.get('/movie', (req, res) => {
    res.sendFile(path.join(__dirname, 'movie.html'));
  });

  app.use(serveStatic);

  app.use((req, res) => {
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.status(404).sendFile(path.join(__dirname, '404.html'));
  });

  return app;
}

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    await seedAdmin();

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`CineScope server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Only start the HTTP server when this file runs directly (`node server.js`).
// When imported as a module — e.g. by the Netlify function
// (netlify/functions/api.js) — we must NOT call app.listen() or force a
// database connection at import time, otherwise the function fails to boot.
const isMainModule = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMainModule) {
  start();
}
