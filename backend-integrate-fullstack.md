# CineScope — Full-Stack Migration & Netlify Deployment Specification

## Role

Act as the **Senior Full-Stack Engineer, Software Architect, DevOps Engineer, and QA Engineer** responsible for converting the existing CineScope repository into a production-ready full-stack application.

Repository:
https://github.com/tawhidzihad/cinescope

Live site:
https://cinescope-movie-details.netlify.app/

### Autonomous execution rule

**Do not ask for permission before normal engineering steps.**

Read this document completely, inspect the current repository, make reasonable technical decisions, implement the work step by step, test it, fix errors, and continue until the acceptance criteria are satisfied.

Do not stop after planning.
Do not repeatedly ask whether you should continue.
Only request clarification when a required value is genuinely unavailable and cannot safely be inferred.

---

# 1. Main Goal

Convert the existing CineScope project into a **real full-stack application** while preserving the current frontend and previous completed work.

Final architecture:

```text
CineScope Frontend
       ↓
Express / Node.js API
       ↓
MongoDB
```

The project must remain deployable on **Netlify**.

Because Netlify does not provide a traditional always-running Node process, the Express application must be structured so it can run locally with Node and also be wrapped by a Netlify Function/serverless adapter in production.

Do **not** create a local-only Express server and assume it will run persistently on Netlify.

---

# 2. First Step — Audit the Existing Repository

Before changing anything:

1. Inspect the complete repository.
2. Run the current project.
3. Understand the existing frontend architecture.
4. Inspect:
   - `index.html`
   - `package.json`
   - existing `server.js`
   - `js/`
   - `js/data/`
   - `js/components/`
   - `js/features/`
   - `scss/`
   - `css/`
   - current admin/dashboard
   - current movie data
   - current pagination
   - search/filter/sort
   - trailer
   - watchlist
   - theme
   - `.env`, `.env.example`, `env.example`
   - `.gitignore`
   - Netlify configuration
5. Identify work already completed by previous agents.
6. Preserve useful existing work.
7. Do not rebuild working features unnecessarily.

After the audit, implement the specification directly.

---

# 3. Create the Backend

Create this folder at the project root:

```text
backend/
```

Use:

- Node.js
- Express.js
- MongoDB

Prefer a clean structure like:

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
  app.js
  server.js
```

Adapt the exact structure to the existing project when appropriate.

Do not migrate the project to another backend framework.

---

# 4. Express Application Design

Separate reusable Express initialization from local startup.

### `backend/app.js`

Responsible for:

- Express initialization
- middleware
- routes
- error handling
- API configuration

### `backend/server.js`

Responsible for:

- local development startup
- calling `app.listen()`

The Express app itself must be reusable by a Netlify Function.

Do not tightly couple the app to a local-only process.

---

# 5. MongoDB

Use MongoDB as the real persistent database.

Use the MongoDB URI supplied by the project owner through environment configuration.

Do not hardcode the URI anywhere in source code.

Use:

```env
MONGODB_URI=...
```

The real value belongs in the ignored local `.env` and in Netlify environment variables for production.

Implement a reusable MongoDB connection module.

Make it **serverless-friendly**:

- avoid creating an unnecessary new connection for every invocation
- cache/reuse connections where appropriate
- handle connection errors
- support local and serverless execution

---

# 6. MongoDB Collections

Create and use at least:

```text
movies
genres
```

The `movies` collection should preserve the current CineScope movie schema while supporting the new backend features.

Recommended fields:

```js
{
  title,
  slug,
  tmdbId,
  tagline,
  year,
  releaseDate,
  rating,
  votes,
  duration,
  runtime,
  genres,
  director,
  cast,
  description,
  fullOverview,
  poster,
  backdrop,
  trailerKey,
  trailerUrl,
  trailerSource,
  isNewRelease,
  createdAt,
  updatedAt
}
```

Use only fields that are actually needed.

---

# 7. Genres Collection

Maintain a dedicated `genres` collection.

Recommended structure:

```js
{
  name: "Action",
  slug: "action",
  createdAt,
  updatedAt
}
```

Avoid duplicate genres.

Use unique indexes where appropriate.

Whenever movies are created, updated, seeded, or bulk imported, keep the genre collection synchronized.

---

# 8. Existing Movie Data Migration

The current project contains static/dummy movie data.

That data must be migrated into MongoDB.

Create a repeatable seed/migration script, for example:

```text
scripts/seed-mongodb.mjs
```

It should:

1. Read the existing movie dataset.
2. Normalize it to the MongoDB movie schema.
3. Insert/update records.
4. Synchronize genres.
5. Prevent accidental duplicates.
6. Preserve important existing IDs/slugs where required.
7. Report inserted/updated/skipped counts.

Prefer an idempotent process.

Do not use a destructive database wipe as the default seed strategy.

---

# 9. Single Source of Truth

After migration, the production data flow must become:

```text
MongoDB
   ↓
Express API
   ↓
Frontend
```

Do not keep the full static movie catalog as a competing production source of truth.

After the API migration is verified, remove obsolete frontend static-data usage where safe.

Do not break watchlist/movie-detail identifiers while doing so.

---

# 10. Movie CRUD API

Implement real CRUD:

```text
GET    /api/movies
GET    /api/movies/:id
POST   /api/movies
PUT    /api/movies/:id
DELETE /api/movies/:id
```

All write operations must require admin authentication.

Public reads may remain public.

---

# 11. Server-Side Pagination

The existing frontend pagination must be replaced with **server-side pagination**.

Do not send all movies to the browser.

Correct:

```text
Frontend
  ↓
GET /api/movies?page=2&limit=12
  ↓
Express
  ↓
MongoDB
  ↓
Only requested records
```

Incorrect:

```text
MongoDB
  ↓
All movies
  ↓
Browser
  ↓
Client-side pagination
```

Pagination metadata must come from the API.

Recommended response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 250,
    "totalPages": 21,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Adapt naming to the project if needed.

---

# 12. Pagination Size

Choose a sensible public page size using senior UX/performance judgment.

The previous UI used 6 movies per page, but now that pagination is server-side, evaluate whether 6, 12, or another reasonable size fits the current design better.

The mobile layout must remain **2 movie cards per row**.

Set a safe maximum query limit such as 50.

Do not allow huge API requests.

---

# 13. Server-Side Search

Search must be done by the backend.

Example:

```text
GET /api/movies?search=interstellar&page=1&limit=12
```

Support appropriate fields such as:

- title
- director
- cast
- genres

Do not send the complete dataset to the browser just to search it.

Use appropriate MongoDB queries/indexes.

---

# 14. Server-Side Filtering

Genre filtering must happen in MongoDB.

Example:

```text
GET /api/movies?genre=Action&page=1&limit=12
```

It must work with other query parameters.

---

# 15. Server-Side Sorting

Sorting must happen before pagination.

Preserve the existing sorting options where present, such as:

```text
rating-desc
newest
title-asc
title-desc
```

Correct pipeline:

```text
Search
→ Filter
→ Sort
→ Pagination
→ Response
```

---

# 16. Combined Queries

The API must support combined queries.

Example:

```text
/api/movies?search=batman&genre=Action&sort=newest&page=2&limit=12
```

All operations must work together.

Do not implement them in isolated ways that conflict.

---

# 17. Query Validation

Validate:

- page
- limit
- sort
- genre
- search
- movie ID

Clamp/reject invalid values appropriately.

Do not directly trust arbitrary sort-field input.

Do not expose raw MongoDB errors.

---

# 18. Database Indexing

Evaluate useful indexes for:

- slug
- tmdbId
- title/search-related fields
- releaseDate
- isNewRelease
- genres

Only add indexes that support actual query patterns.

---

# 19. Admin Authentication

The admin route must be:

```text
/admin
```

Create/fix a proper admin login flow.

Use secure password hashing.

Never store the password as plaintext in MongoDB.

The initial admin credentials supplied by the project owner must be stored via environment variables, not frontend code.

Use variables such as:

```env
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

The backend should hash the password before storing it.

Do not put the actual credentials in README.

---

# 20. Authentication Architecture

Use a secure, maintainable authentication mechanism.

Prefer secure HTTP-only cookie/session authentication where practical for this same-origin Netlify application.

If JWT is chosen:

- keep secrets in environment variables
- do not expose secrets in frontend code
- prefer secure HTTP-only cookies for browser authentication

Support:

- login
- logout
- authentication check/session state
- protected admin APIs
- unauthorized handling

---

# 21. Protected Routes

At minimum, protect:

```text
POST   /api/movies
PUT    /api/movies/:id
DELETE /api/movies/:id
POST   /api/movies/bulk
```

All future admin-only write routes must also be protected.

---

# 22. Admin Dashboard

The existing dashboard must be preserved and improved rather than discarded unnecessarily.

It should allow:

- movie list
- search
- filters
- sorting
- server-side pagination
- add movie
- edit movie
- delete movie
- bulk JSON import
- logout
- loading states
- success/error feedback

Use a professional responsive CineScope-compatible design.

---

# 23. Admin Pagination

The admin movie list must also be server-side paginated.

Choose an appropriate admin page size such as:

```text
10
20
25
```

Use your judgment.

When there are many pages, use ellipsis pagination.

Do not load the full database into the dashboard.

---

# 24. Add Movie

Admin must be able to create a movie.

Support the actual fields needed by CineScope, including where applicable:

- title
- slug
- TMDB ID
- tagline
- release date
- year
- rating
- votes
- duration/runtime
- genres
- director
- cast
- description
- full overview
- poster
- backdrop
- trailer key
- trailer URL/source
- `isNewRelease`

Use a clean grouped form.

---

# 25. Edit Movie

Reuse the movie form for editing.

Requirements:

- populate current values
- validate changes
- preserve ID
- show saving state
- prevent duplicate submissions
- show success/error feedback

---

# 26. Delete Movie

Require confirmation before deleting.

After deletion:

- refresh results
- update pagination
- update total count
- clamp to the last valid page if necessary
- show success feedback

Do not leave a blank invalid page.

---

# 27. Bulk JSON Import

The dashboard must support bulk movie import from a JSON file.

Example:

```json
[
  {
    "title": "Movie One",
    "year": 2025,
    "rating": 8.3,
    "genres": ["Drama"],
    "poster": "https://...",
    "isNewRelease": true
  },
  {
    "title": "Movie Two",
    "year": 2024,
    "rating": 7.4,
    "genres": ["Action"],
    "poster": "https://...",
    "isNewRelease": false
  }
]
```

Improve the existing bulk-import UI.

---

# 28. Bulk Import UX

Use a clear workflow:

```text
Bulk Import Movies

[ Choose JSON File ]

Selected file: movies.json

[ Validate ]
[ Import ]
```

Show useful counts:

```text
250 records detected
242 valid
8 invalid
```

A preview before import is encouraged if practical.

---

# 29. Bulk Validation

Validate server-side and client-side.

Check:

- file type
- file size
- JSON syntax
- root structure
- required fields
- field types
- arrays
- dates
- rating range
- URLs
- duplicate IDs
- duplicate slugs
- duplicate TMDB IDs
- boolean `isNewRelease`

Return actionable errors.

Example:

```text
Record 17:
title is required
```

---

# 30. Bulk Database Operation

Do not make one network request per movie.

Send the batch to the backend once and use MongoDB bulk operations such as:

```text
insertMany
bulkWrite
```

Validate before writing.

Return useful results:

```json
{
  "inserted": 185,
  "updated": 0,
  "skipped": 12,
  "invalid": 3
}
```

Adapt to the final implementation.

---

# 31. Duplicate Handling

Do not silently overwrite records.

Use stable identifiers such as:

- MongoDB `_id`
- slug
- TMDB ID

A reasonable default:

```text
duplicate → skip + report
```

If upsert mode is introduced, make it explicit.

---

# 32. Genre Synchronization

When imported movies contain genres, ensure corresponding records exist in the `genres` collection.

Avoid duplicate genres.

---

# 33. Latest Release Field

Add:

```text
isNewRelease
```

This must be editable from the admin dashboard.

Also store release date where possible.

---

# 34. Dynamic Homepage Hero

The current homepage statically highlights **Dune: Part Two**.

Remove the static dependency.

The hero must load release information from MongoDB via the API.

Create an endpoint such as:

```text
GET /api/movies/latest-releases
```

Return only suitable new-release movies.

Recommended ordering:

```text
isNewRelease = true
→ releaseDate DESC
```

---

# 35. Homepage Hero Carousel

The homepage hero should display the latest/new-release movies dynamically.

Support:

- automatic rotation
- next/previous controls
- indicators/dots where useful
- keyboard support
- touch/swipe where practical
- responsive layout
- reduced-motion support

Do not hardcode movie names.

Admin `isNewRelease` controls which movies can appear.

---

# 36. Hero Empty State

If there are no `isNewRelease` movies:

- do not break the homepage
- do not pretend a movie is a new release
- provide a graceful fallback

Do not permanently hardcode Dune again.

---

# 37. Public Frontend API Migration

Update the main website so movie data comes from the backend.

The browser should request only what it needs.

Example:

```text
GET /api/movies?page=1&limit=12
```

The full movie catalog must not remain duplicated in frontend JavaScript.

---

# 38. Public Search / Filter / Sort

Frontend controls must send the relevant query parameters to the API.

Example:

```text
/api/movies?search=batman&genre=Action&sort=newest&page=2&limit=12
```

Do not locally filter a full 250+ movie array.

---

# 39. Server-Side Pagination UI

Keep the existing polished pagination concept:

```text
1 ... 4 5 6 ... 21
```

The page numbers are based on API metadata:

```text
pagination.totalPages
```

Do not derive page count from a hardcoded movie total.

---

# 40. Public Loading State

Every asynchronous public data operation must have a loading fallback.

At minimum:

### Movie grid

Use polished skeleton cards.

### Hero

Use an appropriate hero skeleton.

### Movie details

Use a details skeleton while loading.

Do not use artificial delays just to show loading.

---

# 41. Admin Loading State

Admin must also have loading states for:

- initial dashboard load
- movie list
- add
- edit
- delete
- bulk import
- authentication

Disable duplicate actions while requests are in progress.

---

# 42. Error & Empty States

Implement clear states for:

- API unavailable
- movie list failure
- empty search result
- invalid movie
- CRUD failure
- bulk validation failure
- authentication failure
- no latest releases

Provide retry actions where appropriate.

Do not expose stack traces, raw database errors, or secrets.

---

# 43. Toast Notifications

Use/reuse a reusable toast system.

Support at least:

- success
- error
- info/warning

Examples:

```text
Movie added successfully
Movie updated successfully
Movie deleted successfully
Movies imported successfully
Unable to load movies
Trailer not available
```

Do not use browser `alert()` for normal application feedback.

---

# 44. Movie Details

Movie details should load from the backend:

```text
GET /api/movies/:id
```

The details page must work after a direct refresh and must not depend on another page's in-memory state.

---

# 45. Trailer Compatibility

Preserve the existing trailer behavior:

If a real YouTube trailer exists:

```text
play trailer
```

Otherwise:

```text
show trailer-unavailable toast
```

Never fabricate trailer IDs.

---

# 46. Watchlist Compatibility

Preserve existing watchlist behavior.

If localStorage stores movie identifiers, keep them stable where possible.

Handle deleted movies gracefully.

---

# 47. Mobile Layout

Preserve the previous requirement:

**2 movie cards per row on mobile.**

Test at:

```text
320px
360px
375px
390px
414px
```

No horizontal overflow.

---

# 48. 404 Page

Preserve/add a proper CineScope-branded 404 page.

Public unknown routes should show the CineScope 404 UI.

API 404s should return JSON.

Example:

```text
GET /api/movies/does-not-exist
→ JSON 404
```

while:

```text
/some-invalid-page
→ CineScope 404 page
```

---

# 49. Admin Login Page Fix

Inspect the current admin login.

Fix:

- form submission
- loading state
- invalid login feedback
- authentication persistence
- unauthorized handling
- redirect
- logout
- responsive design
- accessibility

Make it production quality.

---

# 50. Environment Configuration

Create/use a local `.env` file.

It may contain variables such as:

```env
MONGODB_URI=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
SESSION_SECRET=...
JWT_SECRET=...
TMDB_API_TOKEN=...
YOUTUBE_API_KEY=...
PORT=...
```

Only include variables actually used.

Do not expose these values in frontend code.

---

# 51. Existing `env.example`

Inspect any existing:

```text
.env.example
env.example
```

If it contains useful configuration:

1. preserve relevant variable names
2. move needed local values into `.env`
3. remove obsolete values
4. delete the old `env.example` as requested by the current project workflow

Do not put real secrets into a tracked example file.

---

# 52. `.gitignore`

Ensure the real `.env` is ignored.

At minimum:

```text
.env
.env.*
```

If an example file remains for any reason, explicitly allow only a placeholder example.

The critical requirement is:

**the real `.env` must never be committed.**

---

# 53. README Security Cleanup

Remove the real admin email/password from:

```text
README.md
```

README should say only that admin credentials are configured through environment variables.

Never document the real password.

---

# 54. Secrets Audit

Before completion, search the repository for:

```text
mongodb://
mongodb+srv://
ADMIN_PASSWORD
ADMIN_EMAIL
SESSION_SECRET
JWT_SECRET
TMDB
YOUTUBE
```

Confirm no real secret is present in tracked source files.

Check:

```bash
git status
```

---

# 55. Netlify-Compatible Backend

The same project must be deployable to Netlify.

Keep the Express application reusable and add a serverless wrapper.

A preferred structure is:

```text
backend/
  app.js
  server.js

netlify/
  functions/
    api.js
```

The Netlify Function should wrap the reusable Express app using an appropriate adapter.

For example, conceptually:

```js
import serverless from "serverless-http";
import { createApp } from "../../backend/app.js";

const app = createApp();

export const handler = serverless(app);
```

Use the final dependency/import syntax that matches the project.

---

# 56. Netlify API Routing

Configure `netlify.toml` or equivalent routing so:

```text
/api/*
```

reaches the Express-backed function.

Conceptually:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

Adapt to the final function path.

---

# 57. Netlify Deployment Goal

The whole repository should be deployable to Netlify with environment variables configured in Netlify.

The final deployment must support:

```text
/
    Public CineScope

/admin
    Admin login/dashboard

/api/*
    Express-backed serverless API

MongoDB
    Persistent movies + genres
```

Do not require a separate always-on Node server for the normal Netlify deployment.

---

# 58. Same-Origin API

Prefer frontend API calls like:

```text
/api/movies
/api/auth/login
```

instead of hardcoded localhost URLs.

This keeps local/prod configuration simpler.

Do not hardcode a production hostname into frontend code.

---

# 59. CORS

If frontend and API are same-origin on Netlify, keep CORS restrictive.

Do not use unrestricted:

```text
Access-Control-Allow-Origin: *
```

for authenticated admin APIs without a real reason.

---

# 60. Authentication Cookie Rules

If cookie-based auth is used, configure production cookies appropriately:

- `httpOnly`
- `secure` in production
- suitable `sameSite`
- reasonable expiration

Do not expose session secrets.

---

# 61. Serverless MongoDB Considerations

Because the Express API may run in Netlify Functions:

- cache the MongoDB connection where practical
- avoid unnecessary initialization for every invocation
- keep function startup reasonably lightweight
- do not fetch/seed the database on every API request

Database seeding must be a separate setup operation.

---

# 62. Seed Command

Provide a command such as:

```bash
npm run db:seed
```

or equivalent.

The command should:

- read current movie data
- write to MongoDB
- synchronize genres
- report results
- avoid destructive wipes
- be safe to repeat

---

# 63. API Error Handling

Implement centralized error handling.

Example:

```json
{
  "success": false,
  "message": "Movie not found"
}
```

Validation example:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

Never return production stack traces.

---

# 64. API Security

Implement sensible protections:

- password hashing
- authenticated admin routes
- input validation
- payload-size limits
- JSON body limits
- login rate limiting
- safe MongoDB queries
- safe sort-field allowlist
- CORS configuration
- safe error responses

Do not over-engineer.

---

# 65. Bulk Upload Safety

Limit bulk import size.

Reject overly large payloads/files.

Do not treat uploaded JSON as executable content.

Validate server-side before database writes.

---

# 66. Request Race Conditions

Consider frontend race conditions.

Example:

```text
search "bat"
then immediately search "batman"
```

An older response must not overwrite the newer result.

Use request cancellation or response identity tracking if appropriate.

---

# 67. Admin Duplicate Submission Protection

During add/edit:

```text
submit
→ loading state
→ disable duplicate submission
→ server response
→ success/error
→ restore UI
```

Same principle for bulk import.

---

# 68. API Response Consistency

Keep response shapes predictable across:

- list
- details
- create
- update
- delete
- bulk import
- authentication

This will make the frontend easier to maintain.

---

# 69. Public Homepage Hero

Do not hardcode:

```text
Dune: Part Two
```

as the featured movie.

The hero should be controlled by MongoDB data and the `isNewRelease` field.

---

# 70. Admin New Release Control

The add/edit movie form must include:

```text
New Release
[On / Off]
```

When this is enabled, the movie becomes eligible for the homepage hero.

The latest-release API controls actual hero ordering.

---

# 71. Public Result Flow

The final public movie flow should be:

```text
User changes search/filter/sort
          ↓
Frontend builds API query
          ↓
Express validates query
          ↓
MongoDB search/filter/sort
          ↓
Server-side pagination
          ↓
API response + pagination metadata
          ↓
Frontend renders current page
```

---

# 72. Admin Result Flow

```text
Admin dashboard
      ↓
query/search/filter/sort/page
      ↓
authenticated API
      ↓
MongoDB
      ↓
paginated response
      ↓
dashboard
```

---

# 73. Performance

The final public app must not send the full movie catalog to the browser.

Use:

- server-side pagination
- database filtering
- database sorting
- useful indexes
- lazy-loaded images
- efficient API responses

Do not implement fake performance improvements by loading everything and hiding it.

---

# 74. Code Cleanup

Remove genuinely obsolete code after migration, including where confirmed:

- old full-catalog frontend imports
- old client-side pagination logic
- obsolete mock API code
- unused modules
- duplicate helpers
- dead CSS/SCSS
- stale debug code
- unnecessary dependencies
- obsolete data files

Do not delete files blindly.

Verify each file is truly unused.

---

# 75. Preserve Existing Work

Do not accidentally remove or regress:

- correct movie data/poster fixes
- 2-column mobile grid
- trailer handling
- watchlist
- theme
- responsive navigation
- loading states already implemented
- 404 page already implemented
- public pagination UI
- existing dashboard features

Improve them when necessary, but preserve working behavior.

---

# 76. README Update

Update README with:

- architecture
- backend setup
- MongoDB configuration
- environment variables
- seed command
- admin route
- authentication setup
- API overview
- bulk JSON format
- Netlify deployment
- production environment setup

Do not include real admin credentials or real MongoDB URI.

---

# 77. Testing — Backend

Test:

### Authentication

- valid login
- invalid login
- logout
- protected routes
- unauthenticated access

### CRUD

- create
- read
- update
- delete

### Search

- title
- director
- cast
- no results

### Filtering

- genres
- empty filter result

### Sorting

- rating
- newest
- title ascending
- title descending

### Pagination

- first page
- middle page
- last page
- invalid page
- invalid limit

### Bulk

- valid file
- malformed JSON
- missing fields
- invalid types
- duplicates
- mixed valid/invalid records
- large payload rejection

### Latest Releases

- filtering by `isNewRelease`
- release-date ordering
- empty state

---

# 78. Testing — Frontend

Verify:

- homepage API load
- hero API load
- movie grid API load
- server-side pagination
- search
- filter
- sort
- combined query
- movie details
- trailer
- watchlist
- loading states
- error states
- empty state
- 404

---

# 79. Testing — Admin

Verify:

- `/admin`
- login
- logout
- auth persistence
- dashboard
- pagination
- search
- filters
- sorting
- add
- edit
- delete
- confirmation
- bulk JSON
- validation
- loading
- success/error feedback
- responsive layout

---

# 80. Responsive Testing

Test:

```text
320px
360px
375px
390px
414px
768px
1024px
1280px
1440px+
```

Check:

- movie grid
- pagination
- hero
- search
- filters
- details
- admin
- forms
- 404
- loading states
- no horizontal overflow

---

# 81. Browser Testing

Verify in modern:

- Chrome
- Edge
- Firefox

Inspect the browser console and network panel for:

- JS errors
- failed modules
- API failures
- broken assets
- broken images
- auth issues

---

# 82. Build Verification

Inspect `package.json` and run the correct project commands.

At minimum verify equivalents of:

```bash
npm install
npm run build:css
npm start
```

Also verify the Netlify build configuration.

Do not assume exact script names.

---

# 83. Final Security Review

Search for accidental exposure of:

- MongoDB URI
- admin password
- API keys
- session secret
- JWT secret

Verify:

```bash
git status
```

Confirm the real `.env` is ignored and no secret is staged.

---

# 84. Final Acceptance Criteria

The task is complete only when all of the following are true:

## Backend

- [ ] `backend/` exists.
- [ ] Node.js backend exists.
- [ ] Express.js is used.
- [ ] Express app is reusable locally and through Netlify Functions.
- [ ] MongoDB connection works.
- [ ] `movies` collection exists.
- [ ] `genres` collection exists.
- [ ] Existing movie data is migrated.
- [ ] Seed/migration command exists.
- [ ] CRUD APIs work.
- [ ] Search is server-side.
- [ ] Filtering is server-side.
- [ ] Sorting is server-side.
- [ ] Pagination is server-side.
- [ ] API returns pagination metadata.
- [ ] Latest-release API exists.
- [ ] Bulk JSON import exists.
- [ ] Validation exists.
- [ ] Error handling is structured.

## Authentication

- [ ] `/admin` works.
- [ ] Login works.
- [ ] Supplied initial admin credentials are sourced from environment variables.
- [ ] Password is hashed before database storage.
- [ ] Password is never exposed in frontend code.
- [ ] Write endpoints require authentication.
- [ ] Logout works.
- [ ] Unauthorized requests are handled cleanly.

## Admin Dashboard

- [ ] Dashboard exists.
- [ ] Login page is fixed/polished.
- [ ] Movie list uses server-side pagination.
- [ ] Search works.
- [ ] Filter works.
- [ ] Sorting works.
- [ ] Add movie works.
- [ ] Edit movie works.
- [ ] Delete movie works.
- [ ] Delete confirmation exists.
- [ ] Bulk JSON import works.
- [ ] Bulk validation works.
- [ ] Loading states exist.
- [ ] Toast feedback exists.
- [ ] Dashboard is responsive.

## Database

- [ ] MongoDB is the production source of truth.
- [ ] Existing movie catalog is migrated.
- [ ] Genres are synchronized.
- [ ] Duplicates are controlled.
- [ ] Useful indexes exist.
- [ ] Seed is repeatable/idempotent where practical.

## Public Website

- [ ] Full movie catalog is not sent to the browser.
- [ ] Data loads from API.
- [ ] Server-side pagination works.
- [ ] Search is server-side.
- [ ] Filtering is server-side.
- [ ] Sorting is server-side.
- [ ] Combined queries work.
- [ ] Pagination UI uses ellipsis.
- [ ] Loading skeleton exists.
- [ ] Error/empty states exist.
- [ ] Mobile has 2 movie cards per row.
- [ ] Existing watchlist works.
- [ ] Existing trailer behavior works.
- [ ] Movie details load from backend.

## Homepage

- [ ] Static Dune hero dependency is removed.
- [ ] `isNewRelease` exists.
- [ ] Admin can toggle `isNewRelease`.
- [ ] Latest releases come from MongoDB.
- [ ] Hero is a dynamic carousel.
- [ ] Carousel is responsive.
- [ ] Carousel supports loading/empty states.
- [ ] Reduced motion is respected.

## Environment/Security

- [ ] Real `.env` is configured locally.
- [ ] `.env` is ignored.
- [ ] MongoDB URI is not hardcoded.
- [ ] Admin password is not hardcoded in frontend.
- [ ] README has no real credentials.
- [ ] Old environment example was inspected and useful variables preserved.
- [ ] Old `env.example` is removed as requested.
- [ ] No real secrets are committed.

## Netlify

- [ ] Express API runs through a Netlify Function/serverless wrapper.
- [ ] `/api/*` redirects correctly.
- [ ] Frontend remains deployable.
- [ ] `/admin` works on Netlify.
- [ ] API works on Netlify.
- [ ] MongoDB works through Netlify environment variables.
- [ ] 404 works.
- [ ] No persistent external Node server is required for the normal deployment.
- [ ] Deployment configuration is documented.

## Code Quality

- [ ] Architecture is modular.
- [ ] No unnecessary framework migration.
- [ ] No duplicated production data source.
- [ ] Obsolete client-side pagination is removed.
- [ ] Obsolete static-data usage is removed after migration.
- [ ] Dead code is removed safely.
- [ ] Debug code is removed.
- [ ] Documentation is updated.
- [ ] Build succeeds.
- [ ] No obvious console/backend errors remain.

---

# 85. Final Implementation Order

Execute in this sequence:

```text
1. Audit current repository
       ↓
2. Understand existing/previously completed work
       ↓
3. Create backend/
       ↓
4. Build reusable Express app
       ↓
5. Implement MongoDB connection
       ↓
6. Create Movie + Genre models
       ↓
7. Create seed/migration script
       ↓
8. Migrate existing movie data
       ↓
9. Implement admin authentication
       ↓
10. Implement protected CRUD
       ↓
11. Implement server-side search/filter/sort/pagination
       ↓
12. Implement bulk JSON import
       ↓
13. Implement latest-release API
       ↓
14. Fix/improve admin dashboard
       ↓
15. Integrate frontend with API
       ↓
16. Replace static Dune hero with dynamic carousel
       ↓
17. Replace client-side movie loading/pagination with API pagination
       ↓
18. Add loading/error/empty states
       ↓
19. Fix admin login
       ↓
20. Update environment handling
       ↓
21. Add Netlify Function wrapper
       ↓
22. Configure Netlify API rewrites
       ↓
23. Remove obsolete code safely
       ↓
24. Update README
       ↓
25. Run tests
       ↓
26. Run security audit
       ↓
27. Run production build
       ↓
28. Verify Netlify deployment configuration
       ↓
29. Final acceptance review
```

---

# 86. Final Autonomous Instruction

Implement this as a **real full-stack production-oriented migration**, not a mock/demo.

Do not stop after planning.

Do not stop after creating the backend.

Do not stop after connecting MongoDB.

Do not stop after CRUD.

Do not stop after authentication.

Do not stop after creating the dashboard.

Do not stop after API integration.

Continue through frontend integration, dynamic hero, server-side pagination, loading/error states, Netlify configuration, testing, security review, cleanup, and final verification.

Do not ask for permission between normal implementation steps.

Use senior engineering judgment.

Preserve existing working functionality.

Do not fabricate data.

Do not fabricate API responses.

Do not hardcode secrets.

Do not expose the supplied MongoDB URI or admin password.

Make MongoDB the production source of truth.

Make the Express application reusable locally and through Netlify Functions.

The final result must be a **real full-stack CineScope application with MongoDB persistence, Express APIs, secure admin authentication, CRUD, bulk JSON management, server-side search/filter/sort/pagination, database-driven latest-release carousel, loading/error states, and a Netlify-compatible deployment architecture.**

**Start by auditing the repository and then implement the complete specification autonomously.**
