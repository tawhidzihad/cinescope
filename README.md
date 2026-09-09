# CineScope — Modern English Movie Discovery Platform

A full-stack movie discovery web application built with the **Next.js 15 App Router**
(Server Components + small client islands), **SCSS (7-1 architecture)**, an
**Express + native MongoDB** backend, REST API, admin dashboard, and a polished
public frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App | Next.js 15 App Router — JavaScript/JSX only |
| Rendering | React Server Components by default, isolated Client Components |
| Styling | SCSS (7-1 architecture) in `styles/` → imported via `app/layout.jsx` |
| Hero | Swiper.js carousel (client island), data server-fetched from MongoDB |
| Backend | Node.js + Express (`backend/`), Vercel-compatible via `app/api/[[...path]]/route.js` |
| Database | MongoDB via the native `mongodb` driver (no Mongoose) |
| Auth | express-session + connect-mongo + bcryptjs |
| Deployment | Vercel (frontend + API routes + Express bridge) |

## Features

### Public Frontend
- **Database-Driven Hero Carousel** — latest releases from MongoDB, auto-rotation, keyboard/touch accessible
- **Server-Side Pagination** — 12 movies per page, ellipsis UX
- **Server-Side Search** — across title, director, cast, and genres
- **Server-Side Genre Filtering** and **Sorting**
- **Server-Rendered Movie Detail Pages** at `/movie/[id]` (SEO metadata + canonicals)
- **Dark & Light Theme** with OS preference sync
- **Toast Notifications** for feedback
- **Loading Skeletons**, **Error States**, **Empty States**
- **404 Page** — CineScope-branded
- **Responsive** — 2-column mobile grid, fluid typography
- **WCAG 2.1 AA** — skip links, ARIA labels, keyboard navigation

### Admin Dashboard (`/admin`)
- **Authentication** — secure login with hashed passwords
- **Movie List** — server-paginated table with poster, title, year, rating, genres, actions
- **Add / Edit / Delete** movies with form validation + delete confirmation
- **Bulk JSON Import** — file upload, validation, preview, batch insert
- **Export Movies JSON** — download full catalog
- **Search / Filter / Sort** in admin
- **Responsive** — works on mobile, tablet, desktop

### Backend API
- `GET /api/movies` — paginated list with search, genre, sort
- `GET /api/movies/:id` — single movie by ID, slug, or TMDB ID
- `GET /api/movies/latest-releases` — hero carousel data
- `POST /api/movies` — create (auth required)
- `PUT /api/movies/:id` — update (auth required)
- `DELETE /api/movies/:id` — delete (auth required)
- `POST /api/movies/bulk` — bulk import (auth required)
- `GET /api/movies/export/json` — export all movies
- `POST /api/auth/login` — admin login
- `POST /api/auth/logout` — admin logout
- `GET /api/auth/me` — current user check

## Project Structure

```
|-- app/                          # Next.js App Router pages + API bridge
|   |-- page.jsx                  # Homepage (hero + top-rated)
|   |-- movies/page.jsx           # Server-rendered catalog
|   |-- movie/[id]/page.jsx       # Server-rendered detail page
|   |-- admin/page.jsx            # Admin dashboard shell
|   +-- api/[[...path]]/route.js  # Vercel bridge to backend/app.js
|-- components/                   # Server + client UI components
|-- lib/
|   |-- server-data.js            # Server data layer (direct DB via services)
|   +-- watchlist.js              # Client-only localStorage watchlist
|-- backend/                      # Express backend (native MongoDB driver)
|   |-- app.js                    # App factory (local + Vercel)
|   |-- server.js                 # Local dev entry (npm run backend)
|   |-- config/db.js              # Serverless-friendly MongoDB connection
|   |-- controllers/              # Movie + auth controllers
|   |-- middleware/               # Session auth guard, rate limiting
|   |-- routes/                   # Movie, auth, genre routes
|   |-- services/                 # Movie, auth, genre data services
|   +-- utils/validation.js       # Sort, pagination, validation helpers
|-- scripts/
|   +-- seed-mongodb.mjs          # Migrate static movie data to MongoDB
|-- styles/                       # SCSS 7-1 system + next-app additions
|-- public/images/                # Favicon + poster fallback
|-- package.json
+-- .env                          # Environment variables (git-ignored)
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cinescope
MONGODB_DB=cinescope
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=choose-a-strong-password
SESSION_SECRET=your-secure-session-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Never commit real values. `.env` is git-ignored; only `.env.example` is tracked.

### Seed Database

```bash
npm run seed
```

This migrates the legacy catalog from `js/data/movies.js` into MongoDB
(idempotent; use `npm run seed -- --upsert` to also update existing records).

### Run the App

```bash
npm run dev        # Next.js frontend (http://localhost:3000)
npm run backend    # Standalone Express API (http://localhost:5000)
```

### Admin Dashboard

Visit `http://localhost:3000/admin` and log in with the credentials from your `.env` file.

## Deployment

### Vercel — dashboard flow (recommended)

Vercel deploys this repo with **zero extra config**: `vercel.json`
declares the Next.js framework + build, `next.config.mjs` keeps the
server-only packages external, and `app/api/[[...path]]/route.js`
mounts the Express backend (`backend/app.js`) via `serverless-http`.
Public pages use the server data layer (`lib/server-data.js` →
`backend/services/*` → MongoDB) and the admin dashboard + external
clients use the same Express API under `/api/*`. There is no separate
server to host — **frontend + integrated server ship as one Vercel
project**.

> Backend changes (routes/controllers/services under `backend/`) take
> effect on Vercel automatically on the next deploy — no separate
> "server deploy" step. Locally, preview the same behavior with
> `npm run backend` (port 5000) or `npm run backend:dev` for hot reload.

1. **Import the repo** — go to <https://vercel.com/new>, choose
   **Import Git Repository**, select `tawhidzihad/cinescope`, keep
   Framework = **Next.js**, Build Command = `next build`
   (both auto-detected from `vercel.json` / `package.json`).
2. **Add environment variables** before pressing Deploy
   (**Project → Settings → Environment Variables**, apply to
   **Production**; repeat for Preview if you want staging to work):

   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | Your Atlas connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
   | `MONGODB_DB` | `cinescope` |
   | `ADMIN_EMAIL` | admin login email |
   | `ADMIN_PASSWORD` | admin login password |
   | `SESSION_SECRET` | long random string (session signing) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-site>.vercel.app` (fix after first deploy, then redeploy) |

3. **Deploy**, then open `https://<your-site>.vercel.app/api/health`
   — expect `{"success":true,"data":{"status":"ok"}}`.
4. **MongoDB Atlas access** — under **Network Access**, allow the
   deployment (e.g. `0.0.0.0/0` for dynamic serverless IPs), and make
   sure the DB user in `MONGODB_URI` has read/write on `MONGODB_DB`.
5. **Seed the catalog** (one time, from your machine with the same
   `MONGODB_URI` in local `.env`):
   `npm run seed` (insert missing) or `npm run seed -- --upsert`
   (also refresh existing). Verify with
   `https://<your-site>.vercel.app/api/movies?limit=1`.
6. **Log in** at `https://<your-site>.vercel.app/admin` with
   `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The API bridge seeds/refreshes
   the hashed admin from env on boot, so rotating the env password
   just needs a redeploy.

> `.env*` (except `.env.example`) is git-ignored — never commit real
> values; Vercel env vars are the production source of truth.

### Troubleshooting the deployed site

If the deployed site shows "Unable to Load Movies" or login fails:

1. Open `https://<your-site>.vercel.app/api/health` in a browser.
2. Confirm `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and
   `SESSION_SECRET` are all set, then redeploy so the function picks them up.
3. In MongoDB Atlas, make sure **Network Access** allows the deployment
   (e.g. `0.0.0.0/0` for dynamic serverless IPs).
4. Admin credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; on boot the
   server creates the admin if missing and resyncs the stored password if the
   environment value changed. Note for local `.env` files: quote values that
   contain `#` (e.g. `ADMIN_PASSWORD="pass@#1234"`), because dotenv treats
   `#` as the start of an inline comment.

### Alternative: always-on Node.js hosting

The same backend also runs as a traditional Node.js server
(`npm run backend`), so it can be hosted on any Node runtime if preferred:

- **Railway** — easiest MongoDB + Node.js hosting
- **Render** — free tier available
- **Fly.io** — container-based
- **VPS** (DigitalOcean, Linode, etc.)

For local development keep the `.env` file described in the [Setup](#setup) section.

## License

MIT
