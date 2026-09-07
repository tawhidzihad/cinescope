# CineScope - Modern English Movie Discovery Platform

A full-stack movie discovery web application with a Node.js/Express backend, MongoDB persistence, REST API, admin dashboard, and a polished public frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 — Semantic, accessible |
| Styling | SCSS (7-1 architecture) → compiled to `css/main.css` |
| Logic | Vanilla JavaScript — ES6+ modules, zero frameworks |
| Backend | Node.js + Express |
| Database | MongoDB (via Mongoose) |
| Auth | express-session + connect-mongo + bcryptjs |
| Build | `sass` CLI via npm script |

## Features

### Public Frontend
- **Database-Driven Hero Carousel** — latest releases from MongoDB, auto-rotation, keyboard/touch accessible
- **Server-Side Pagination** — 12 movies per page, ellipsis UX
- **Server-Side Search** — across title, director, cast, and genres
- **Server-Side Genre Filtering** and **Sorting**
- **Movie Details Modal** (desktop) and **movie.html page** (mobile)
- **Dark & Light Theme** with OS preference sync
- **Toast Notifications** for feedback
- **Loading Skeletons**, **Error States**, **Empty States**
- **404 Page** — CineScope-branded
- **Responsive** — 2-column mobile grid, fluid typography
- **WCAG 2.1 AA** — skip links, ARIA labels, keyboard navigation

### Admin Dashboard (`/admin`)
- **Authentication** — secure login with hashed passwords
- **Movie List** — paginated table with poster, title, year, rating, genres, actions
- **Add / Edit / Delete** movies with form validation
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
├── index.html                    # Public movie catalog
├── movie.html                    # Standalone movie details page
├── admin.html                    # Admin dashboard
├── 404.html                      # Custom 404 page
├── server.js                     # Express server
├── package.json
├── .env                          # Environment variables (git-ignored)
├── server/
│   ├── config/db.js              # MongoDB connection
│   ├── models/
│   │   ├── Movie.js              # Movie schema with indexes
│   │   └── User.js               # Admin user schema with password hashing
│   ├── controllers/
│   │   ├── movieController.js    # CRUD, search, pagination, bulk import
│   │   └── authController.js     # Login, logout, session, admin seed
│   ├── middleware/auth.js         # Session-based auth guard
│   ├── routes/
│   │   ├── movieRoutes.js        # Movie API routes
│   │   └── authRoutes.js         # Auth API routes
│   └── utils/validation.js       # Sort, pagination, validation helpers
├── scripts/
│   └── seed-mongodb.js           # Migrate static movie data to MongoDB
├── js/
│   ├── main.js                   # Public frontend — API integration + carousel
│   ├── movie-page.js             # Movie details page — API integration
│   ├── admin.js                  # Admin dashboard logic
│   ├── components/
│   │   ├── movie-card.js         # Card DOM factory
│   │   ├── movie-modal.js        # Desktop modal controller
│   │   ├── trailer-player.js     # YouTube trailer overlay
│   │   ├── toast.js              # Toast notification system
│   │   ├── loading-state.js      # Skeleton loaders
│   │   ├── empty-state.js        # Empty state component
│   │   └── pagination.js         # Pagination UI (ellipsis)
│   ├── features/
│   │   ├── theme.js              # Dark/light theme manager
│   │   ├── search.js             # Debounced search controller
│   │   ├── filters.js            # Genre/sort (reference)
│   │   └── mobile-nav.js         # Mobile drawer toggle
│   └── data/
│       └── movies.js             # Static movie data (used by seed script)
├── scss/                         # SCSS source (7-1 architecture)
├── css/main.css                  # Compiled CSS
└── assets/images/                # Static assets
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

Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/cinescope
ADMIN_EMAIL=admin1234@gmail.com
ADMIN_PASSWORD=pass1234@#
SESSION_SECRET=your-secure-session-secret
PORT=3000
```

### Seed Database

```bash
npm run seed
```

This migrates the 250 existing movies from `js/data/movies.js` into MongoDB.

### Start Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The app runs at `http://localhost:3000`.

### Admin Dashboard

Visit `http://localhost:3000/admin` and log in with the credentials from your `.env` file.

## Deployment

CineScope is now a full-stack application requiring a Node.js hosting environment. Options include:

- **Railway** — easiest MongoDB + Node.js hosting
- **Render** — free tier available
- **Fly.io** — container-based
- **VPS** (DigitalOcean, Linode, etc.)

Netlify is no longer suitable for the backend API server. The static frontend could be deployed separately, but the full application requires a Node.js runtime.

## License

MIT
