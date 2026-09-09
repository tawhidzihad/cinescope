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

### Vercel (supported)

- Frontend + backend ship together: `app/api/[[...path]]/route.js` mounts the
  Express app via `serverless-http`.
- Set `MONGODB_URI`, `MONGODB_DB`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
  `SESSION_SECRET`, and `NEXT_PUBLIC_SITE_URL` in the Vercel dashboard
  (**Project → Settings → Environment Variables**).
- `npm run build` must succeed; dynamic routes and `/admin` work on Vercel
  with MongoDB reached through environment variables.

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
