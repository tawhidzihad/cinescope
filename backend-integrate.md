# CineScope — Backend Integration & Admin Dashboard Specification

## Role

Act as the **Senior Full-Stack Engineer / Technical Lead** responsible for implementing the backend integration for the existing CineScope project.

Repository: https://github.com/tawhidzihad/cinescope  
Live site: https://cinescope-movie-details.netlify.app/

This document is the source of truth for this task.

### Critical execution rule

**Do not ask me for permission before starting any normal engineering step.** Inspect the repository, make the required technical decisions yourself, implement the complete feature set, test everything, fix errors, clean up the code, and continue until the acceptance criteria are satisfied.

Do not stop after planning. Do not repeatedly ask whether you should continue.

Only ask for information that is genuinely impossible to infer or obtain from the repository/environment, such as a missing MongoDB URI.

---

# 1. Goal

Transform CineScope from a mostly static movie website into a proper full-stack movie application with:

- Node.js backend inside the same repository
- MongoDB persistence
- REST API
- secure admin authentication
- `/admin` dashboard
- movie CRUD operations
- bulk JSON movie import
- server-side search/filter/sort/pagination
- dynamic latest-release hero carousel
- loading/error/empty states
- 404 page
- clean responsive UI
- production-minded security and validation

Preserve the existing Vanilla JS + HTML + SCSS approach unless a different choice is genuinely required.

Do **not** migrate the project to React, Vue, Angular, Tailwind, or another framework just for this work.

---

# 2. First Step — Audit the Existing Project

Before editing anything:

1. Inspect the complete repository.
2. Inspect `index.html`, `package.json`, `server.js`, `js/`, `scss/`, `css/`, `assets/`, deployment configuration, and any files added by earlier agents.
3. Understand current:
   - movie data structure
   - movie rendering
   - search
   - filters
   - sorting
   - movie details
   - watchlist
   - trailers
   - theme
   - responsive behavior
   - pagination
   - Netlify setup
4. Identify old/dead client-side movie-data and pagination code that can eventually be removed.
5. Do not delete anything until you verify it is genuinely unused.
6. Determine the smallest clean architecture change required.

Make the implementation plan internally and then execute it without waiting for approval.

---

# 3. Backend Architecture

Build the backend in the same CineScope repository.

Prefer the existing Node.js setup if compatible.

Use a clean structure such as:

```text
server/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
```

or an equivalent structure that fits the current project.

Keep route files thin. Put business logic into services/controllers where practical.

---

# 4. MongoDB

Use **MongoDB** as the production source of truth for movies and admin users.

MongoDB URI must come from:

```env
MONGODB_URI=
```

Never hardcode the URI.

Create one reusable database connection module. Do not open a new database connection for every request.

Handle startup failures and graceful shutdown cleanly.

---

# 5. Movie Model

Create a proper MongoDB Movie model based on the existing CineScope schema.

Support fields such as:

```js
{
  title,
  slug,
  tmdbId,
  tagline,
  year,
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
  releaseDate,
  createdAt,
  updatedAt
}
```

Adapt the exact shape to the current project instead of duplicating incompatible fields.

Preserve existing IDs/slugs where they are relied on by watchlists or URLs.

---

# 6. New Release Flag

Add a clear boolean field:

```text
isNewRelease
```

The admin movie form must allow:

```text
New Release
[ ] Yes
[ ] No
```

Also store `releaseDate` where available.

This flag controls eligibility for the homepage hero carousel.

---

# 7. Replace Static Dune Hero

The homepage currently statically highlights Dune: Part Two.

Remove that static dependency.

The homepage hero must be database-driven.

Use an endpoint such as:

```text
GET /api/movies/latest-releases
```

Return movies where:

```text
isNewRelease = true
```

ordered by release date descending.

Do not hardcode movie titles/posters into the homepage hero.

---

# 8. Latest Release Carousel

Create a polished carousel for the latest/new-release movies.

Required behavior:

- automatic rotation
- previous/next controls
- indicator dots if useful
- smooth but restrained transitions
- keyboard accessibility
- touch/swipe support where practical
- responsive layout
- pause/interaction behavior where useful
- reduced-motion support

If there are no new-release movies, provide a graceful fallback. Do not permanently fall back to Dune: Part Two.

---

# 9. Movie REST API

Implement at least:

```text
GET    /api/movies
GET    /api/movies/:id
GET    /api/movies/latest-releases
POST   /api/movies
PUT    /api/movies/:id
DELETE /api/movies/:id
POST   /api/movies/bulk
```

Add auth endpoints such as:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Adapt naming to the existing project if necessary.

---

# 10. Server-Side Pagination — Required

The main public movie catalog must use **server-side pagination**.

Do not send all ~250+ movies to the browser and paginate locally.

Correct flow:

```text
Browser
  ↓
GET /api/movies?page=2&limit=12
  ↓
Backend
  ↓
MongoDB filter/search/sort + pagination
  ↓
Only requested records returned
```

The old client-side full-catalog pagination should be removed after the backend migration is working.

---

# 11. Pagination API Response

Return pagination metadata.

Recommended shape:

```json
{
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

Use the project's final naming conventions consistently.

---

# 12. Search — Server Side

Search must operate on MongoDB, not the full browser dataset.

Support a query such as:

```text
GET /api/movies?search=inception&page=1&limit=12
```

Search relevant fields, such as:

- title
- director
- cast
- genres

Use proper validation/indexing. Avoid unsafe uncontrolled MongoDB query construction.

---

# 13. Filters — Server Side

Genre filtering must be handled by the backend.

Example:

```text
GET /api/movies?genre=Action&page=1&limit=12
```

Search, genre, sort, and pagination must work together.

---

# 14. Sorting — Server Side

Support the existing sort behavior through backend query parameters.

Examples:

```text
sort=rating-desc
sort=newest
sort=title-asc
sort=title-desc
```

Allow only known sort keys.

Correct query pipeline:

```text
search/filter
   ↓
sort
   ↓
skip/limit
   ↓
response
```

Never paginate first and sort afterwards.

---

# 15. Pagination Defaults

Choose a sensible public page size. The previous frontend used 6 movies per page, but now that pagination is server-side, choose the best practical size for the current CineScope layout.

A reasonable default such as 12 is acceptable if it suits the design.

Set a safe maximum, for example 50.

Clamp invalid `page`/`limit` values.

Do not allow huge requests such as:

```text
?limit=1000000
```

---

# 16. MongoDB Indexes

Evaluate useful indexes for real query patterns, including:

- `slug`
- `tmdbId`
- `title`
- `releaseDate`
- `isNewRelease`
- `genres`

Do not add unnecessary indexes blindly.

---

# 17. Admin Authentication

Create an admin area at:

```text
/admin
```

Initial credentials supplied for the first local/initial setup:

```text
Email: example@gmail.com
Password: pass1234
```

Security requirements:

- never hardcode these credentials in frontend JavaScript
- never store plaintext passwords in MongoDB
- hash the password before storing it
- use secure authentication/session handling
- protect all write endpoints
- provide logout
- do not return passwords from APIs

Use environment variables for initial setup:

```env
ADMIN_EMAIL=example@gmail.com
ADMIN_PASSWORD=pass1234
```

A seed/setup process should create the admin user from these values and store only the password hash.

---

# 18. Authentication Mechanism

Choose a secure and maintainable mechanism.

A secure HTTP-only cookie/session approach is preferred when practical for this admin dashboard. JWT is acceptable if implemented correctly.

Requirements:

- secure password hashing
- authenticated admin routes
- protected CRUD
- protected bulk import
- logout
- safe handling of expired/invalid sessions
- no credentials exposed to the frontend

---

# 19. Admin Dashboard

Build a polished dashboard at:

```text
/admin
```

It should include:

- admin header
- authentication state
- movie list/table
- search
- filters
- sorting
- pagination
- add movie
- edit movie
- delete movie
- bulk JSON import
- success/error feedback
- loading states
- logout

Keep the visual language consistent with CineScope.

---

# 20. Admin Pagination

The admin movie list must also use pagination.

Choose the best page size yourself (for example 10, 20, or 25) based on usability.

Use ellipsis when there are many pages.

Do not render the entire database in the dashboard at once.

---

# 21. Admin Movie List

Show useful fields such as:

- poster thumbnail
- title
- year
- rating
- genres
- release date
- new-release status
- updated date
- actions

Actions:

```text
Edit
Delete
```

Destructive actions must be clearly distinguished.

---

# 22. Add Movie

Create a polished movie form.

Support the fields required by the final Movie model, including at minimum:

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
- New Release toggle

Group fields logically rather than creating one overwhelming column.

---

# 23. Edit Movie

Reuse the add form where practical.

On edit:

- prefill existing values
- allow updating important fields
- preserve the record identifier
- validate changes
- show submitting/loading state
- show success/error feedback

---

# 24. Delete Movie

Require confirmation before deletion.

After deletion:

- refresh the current result set
- maintain valid pagination
- update counts
- show success feedback
- handle deleting the last item on a page gracefully

---

# 25. Bulk JSON Import — Required

The admin dashboard must support uploading a JSON file containing multiple movie records.

Example:

```json
[
  {
    "title": "Movie One",
    "year": 2024,
    "rating": 8.2,
    "genres": ["Drama"],
    "poster": "https://...",
    "isNewRelease": true
  },
  {
    "title": "Movie Two",
    "year": 2023,
    "rating": 7.5,
    "genres": ["Action"],
    "poster": "https://...",
    "isNewRelease": false
  }
]
```

The actual accepted schema should match the final Movie model.

---

# 26. Bulk Import UX

Provide a clear workflow:

```text
Bulk Import Movies
[ Choose JSON File ]

Selected file: movies.json

[ Validate ]
[ Import Movies ]
```

A preview is strongly recommended if it can be implemented cleanly.

Show counts such as:

```text
200 movies detected
195 valid
5 invalid
```

---

# 27. Bulk Import Validation

Validate both client-side and server-side.

Check:

- file type
- file size
- valid JSON
- root structure
- required fields
- field types
- arrays where expected
- valid URLs where supplied
- duplicate IDs
- duplicate TMDB IDs
- duplicate slugs
- invalid dates
- invalid ratings
- invalid `isNewRelease`

Provide actionable errors with record/row context where possible.

---

# 28. Bulk Import Execution

Do not create one browser request per movie.

The backend must process the dataset as a batch using `insertMany`, `bulkWrite`, or an equivalent strategy.

Recommended behavior:

1. validate the complete file
2. identify invalid records
3. prevent accidental duplicates
4. import valid records in bulk
5. report inserted/skipped/invalid counts
6. never silently overwrite existing movies unless the user explicitly chose an update/upsert mode

---

# 29. Bulk Import Result

Return useful result data, for example:

```json
{
  "inserted": 185,
  "skipped": 12,
  "invalid": 3,
  "errors": []
}
```

Render the result clearly in the dashboard.

---

# 30. Recommended JSON Export

Add an `Export Movies JSON` feature if it can be implemented cleanly.

This gives the admin a simple backup/migration workflow.

Do not compromise the main requirements to build it.

---

# 31. Existing Data Migration

The old static movie catalog must be migrated into MongoDB.

Create a repeatable seed/migration script, for example:

```text
scripts/seed-movies.mjs
```

It should:

- read the existing data
- validate it
- connect using `MONGODB_URI`
- preserve stable IDs/slugs
- prevent duplicates
- report inserted/updated/skipped counts
- be safe to run repeatedly where practical

MongoDB becomes the production source of truth.

---

# 32. Single Source of Truth

Final data flow must be:

```text
MongoDB
   ↓
Backend API
   ↓
CineScope Frontend
```

Do not leave two competing production sources such as:

```text
static movies.js
+
MongoDB
```

Once migration is verified, remove obsolete static-data loading from the production frontend.

---

# 33. Public Frontend API Integration

Update the public frontend to consume the backend API.

For example:

```text
GET /api/movies?page=1&limit=12
```

The frontend must not receive the full movie catalog just to render one page.

---

# 34. Public Search/Filter/Sort

Update frontend controls to send backend queries.

Example combined query:

```text
/api/movies?search=batman&genre=Action&sort=newest&page=2&limit=12
```

The frontend should use API pagination metadata as the source of truth.

Do not calculate total pages from a local copy of the entire catalog.

---

# 35. Public Movie Details

Movie detail pages/modals must load movie data from the backend by stable ID/slug.

Example:

```text
GET /api/movies/:id
```

Direct navigation and refresh must work.

Do not depend on another page's DOM state.

---

# 36. Watchlist Compatibility

Preserve the existing localStorage watchlist behavior where possible.

Ensure saved movie IDs remain compatible after the migration.

Handle stale/deleted watchlist items gracefully.

---

# 37. Trailer Compatibility

Preserve the existing trailer requirement:

- real YouTube trailer → play it
- no trailer → show a toast
- never fabricate a trailer key
- never use blocking `alert()` for normal feedback

Trailer fields should come from MongoDB when available.

---

# 38. Loading States — Required

Every important asynchronous operation needs a polished loading state.

At minimum:

### Public movie catalog
Skeleton movie cards while the API request is pending.

### Hero carousel
Hero skeleton/placeholder while latest releases load.

### Movie details
Details skeleton/loading fallback where applicable.

### Admin dashboard
Table/list skeleton while loading.

### Add/Edit
Submitting state and duplicate-submit prevention.

### Bulk import
Upload/import loading state.

Do not add artificial delays just to make a loader appear.

---

# 39. Error + Empty States

Every major data-driven UI should handle:

```text
Loading
Success
Error
Empty
```

Examples:

```text
Unable to load movies
[Retry]
```

```text
No movies found
```

```text
No new releases available
```

Do not expose backend stack traces to users.

---

# 40. Toast System

Use a reusable toast/notification system for normal feedback.

Support at least:

- success
- error
- warning/info

Examples:

```text
Movie added successfully
Movie updated successfully
Movie deleted successfully
185 movies imported
Trailer not available
Unable to load movies
```

Do not use blocking `alert()` for routine UI feedback.

---

# 41. 404 Page

Implement a polished CineScope-branded 404 page.

Suggested structure:

```text
404

Page not found

The page you're looking for doesn't exist or may have been moved.

[ Back to Home ]
```

It must work in light/dark theme and on mobile/desktop.

---

# 42. Routing / 404 Behavior

Inspect current `server.js` and Netlify routing.

Make browser-facing unknown pages show the CineScope 404 experience.

API not-found responses must remain JSON.

Do not confuse page 404 behavior with API 404 behavior.

---

# 43. Admin UI Design

The admin panel should feel like a natural extension of CineScope.

Keep:

- cinematic visual language
- clean spacing
- clear hierarchy
- responsive controls
- accessible buttons/forms
- light/dark theme compatibility

Avoid a generic unrelated dashboard template.

---

# 44. Admin Responsive Design

The dashboard must work across mobile, tablet and desktop.

On small screens:

- switch tables to a card/list representation when useful
- stack forms intelligently
- keep bulk upload usable
- keep pagination readable
- keep actions touch-friendly

Avoid horizontal overflow unless there is no practical alternative.

---

# 45. Public UI Refinement

While integrating the backend, fix obvious design inconsistencies and polish the public site.

Review:

- hero carousel
- movie cards
- server-side pagination UI
- search
- filters
- loading states
- empty states
- movie details
- trailer UI
- mobile layout
- 404
- footer

Do not turn this into a completely different brand.

---

# 46. Mobile Movie Grid

Preserve the existing mobile requirement:

**2 movie cards per row.**

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

# 47. Public Pagination UI

The public pagination still needs the previous polished ellipsis UX, but the page state comes from the backend.

Example:

```text
1 ... 4 5 6 ... 21
```

The UI should use `pagination.totalPages`, `pagination.page`, and related metadata from the API.

Do not build pagination from the full client-side movie array.

---

# 48. Admin Form Validation

Validate important fields on the client for UX and on the server for security/correctness.

At minimum evaluate:

- title required
- valid year
- valid release date
- rating numeric and within the intended range
- genres array
- URL validation where applicable
- `isNewRelease` boolean

Server validation is authoritative.

---

# 49. API Security

Implement reasonable production-minded protections:

- authenticated write endpoints
- secure cookies if using sessions
- password hashing
- validation
- request body size limits
- JSON payload limits
- rate limiting on login if practical
- CORS restricted to intended origins where needed
- safe error responses
- safe handling of regex/search input

Do not over-engineer.

---

# 50. Bulk Upload Security

The bulk JSON endpoint must:

- require admin authentication
- validate file/content size
- validate JSON
- validate every record
- avoid arbitrary file execution/storage
- avoid uncontrolled MongoDB operators
- report safe errors

---

# 51. Query Safety

Never pass uncontrolled user query parameters directly into MongoDB operators.

Whitelist:

- sort fields
- sort directions
- filter names
- pagination values

For regex/text search, escape user input appropriately or use a safer indexing/search strategy suited to the project's scale.

---

# 52. Environment Variables

Create a real local `.env` file.

At minimum:

```env
MONGODB_URI=YOUR_MONGODB_URI
ADMIN_EMAIL=example@gmail.com
ADMIN_PASSWORD=pass1234
```

Add only other values actually used by the final implementation, such as:

```env
SESSION_SECRET=
JWT_SECRET=
TMDB_API_TOKEN=
YOUTUBE_API_KEY=
PORT=
```

Do not create unused environment variables merely for appearance.

---

# 53. Existing `env.example`

There is already an `env.example` file.

Inspect it first.

If it contains useful variables, migrate the relevant variable names/settings into the real local `.env`.

Then **delete `env.example` as requested**.

Do not copy real secrets into a tracked example file.

---

# 54. `.gitignore`

Ensure `.env` is ignored.

Use an appropriate rule such as:

```text
.env
.env.*
!.env.example
```

Since `env.example` is being removed, the important requirement is that the real `.env` can never be accidentally committed.

Also ensure secrets are not included in generated frontend bundles.

---

# 55. Git Secret Audit

Before finishing:

```bash
git status
```

Search the repository for:

- supplied admin password
- MongoDB URI
- session/JWT secrets
- API keys
- tokens

The real `.env` must be ignored and no real secrets should exist in tracked source files.

If a secret was accidentally written into a tracked file, remove it before completion.

---

# 56. Admin Authentication UX

Unauthenticated visit:

```text
/admin
   ↓
Admin Login
```

After login:

```text
/admin
   ↓
Dashboard
```

Dashboard must provide logout.

Expired/invalid authentication should return the user to the login flow cleanly.

---

# 57. Admin CRUD UX

All CRUD operations should feel immediate and reliable.

Create:

```text
Fill form
→ Save
→ loading state
→ API
→ success toast
→ refresh data
```

Edit:

```text
Edit
→ Save
→ loading state
→ success toast
→ refresh current list
```

Delete:

```text
Delete
→ confirm
→ API
→ success toast
→ refresh current page
```

---

# 58. API Error Contract

Use a consistent response shape.

Example success:

```json
{
  "success": true,
  "data": {}
}
```

Example error:

```json
{
  "success": false,
  "message": "Movie not found"
}
```

Validation can include:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

Adapt to the project's conventions while keeping consistency.

---

# 59. Latest Releases API

Implement a focused endpoint that returns only the movies needed for the hero carousel.

Example:

```text
GET /api/movies/latest-releases
```

It should:

- filter `isNewRelease = true`
- sort by `releaseDate` descending
- return a sensible number of records
- not return the full catalog

---

# 60. Data Quality

Do not blindly migrate bad static records into MongoDB.

During migration/seed, validate and normalize existing data.

Where possible verify:

- title
- year
- poster
- backdrop
- rating
- genres
- director
- cast
- description
- TMDB ID
- trailer values
- release date

Do not invent values just to satisfy a schema.

---

# 61. Data Backup / Migration Safety

Do not make destructive migrations without a safe plan.

When replacing static data with MongoDB:

1. preserve the old data until migration is confirmed
2. validate imported record counts
3. compare key identifiers
4. verify the frontend against the database
5. only then remove obsolete production data-loading code

---

# 62. Logging

Add useful server-side logs for:

- startup
- MongoDB connection
- important errors
- bulk imports
- authentication failures where appropriate

Never log:

- passwords
- API keys
- MongoDB credentials
- session/JWT secrets
- full auth tokens

---

# 63. Documentation

Update README or backend documentation with:

- setup steps
- environment variables
- MongoDB configuration
- admin initialization
- API endpoints
- pagination query parameters
- bulk JSON format
- seed/migration commands
- local development commands
- production deployment notes

Do not claim a deployment architecture that has not been verified.

---

# 64. Netlify Compatibility

The live site is deployed on Netlify.

Inspect its current configuration before choosing the final backend deployment approach.

If Netlify Functions/serverless functions are required, use them appropriately.

If the backend must run as a separate Node service, document that clearly.

Do not assume a persistent `server.js` process will automatically run on Netlify.

Verify:

- frontend build
- API connectivity
- MongoDB connectivity in deployment configuration
- environment variables
- `/admin`
- 404 behavior
- public movie routes

---

# 65. Performance

The browser must not receive the entire movie catalog for normal browsing.

Use:

- server-side pagination
- database filtering
- database sorting
- appropriate indexes
- lazy image loading
- compact API responses
- minimal DOM updates

Do not add complicated caching before it is necessary.

---

# 66. Public Loading Fallback

The user must see a proper loading fallback while waiting for movie data.

Avoid blank screens.

Avoid fake delays.

Skeleton cards are preferred for the movie grid.

Hero should have its own lightweight loading state.

---

# 67. Accessibility

Preserve or improve:

- semantic HTML
- keyboard navigation
- visible focus states
- ARIA labels
- pagination semantics
- button semantics
- loading announcements
- toast accessibility
- modal accessibility
- heading hierarchy
- useful image alt text
- reduced-motion support
- contrast

Do not turn semantic buttons into clickable `<div>` elements.

---

# 68. Responsive Design

Test at:

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

- public catalog
- hero carousel
- pagination
- forms
- admin list
- admin forms
- movie details
- toast
- loading state
- 404
- no horizontal overflow

---

# 69. Clean Code

Remove genuinely unused:

- JavaScript modules
- imports
- functions
- variables
- CSS selectors
- SCSS partials
- old client-side pagination logic
- obsolete static data loading
- stale debug files
- unnecessary dependencies

Do not delete a file simply because it is not imported directly; verify its actual usage first.

---

# 70. Frontend State

Keep frontend state minimal.

A reasonable model could be:

```js
{
  searchQuery,
  selectedGenre,
  sortBy,
  currentPage,
  pageSize,
  movies,
  pagination
}
```

Because the backend is the source of truth, do not retain a hidden duplicate of the complete movie database in browser memory.

---

# 71. Event Handling

Avoid duplicate listeners.

Use event delegation where appropriate.

Do not rebind the same listeners every time a result page is rendered.

---

# 72. Mobile Public Grid

Keep **2 movie cards per row** on mobile.

Use CSS Grid and responsive sizing.

Cards must remain readable and touch-friendly.

---

# 73. Public Pagination UX

Keep the pagination visually polished and compact.

Example:

```text
‹  1  ...  20  21  22  ...  42  ›
```

Desktop and mobile can use different visible ranges as long as the interaction remains clear.

---

# 74. 404 + Invalid Movie

If a movie ID/slug does not exist:

- return an API 404 response for API requests
- show a user-friendly not-found state/page for browser-facing movie details
- provide a clear Home/Back action

Do not show raw JSON or stack traces to normal users.

---

# 75. Implementation Order

Follow this sequence unless the current architecture requires a small dependency adjustment:

### Step 1 — Audit
Inspect the full repository and existing behavior.

### Step 2 — Environment
Create/configure `.env`, update `.gitignore`, inspect and migrate useful values from `env.example`, then delete `env.example`.

### Step 3 — Backend Foundation
Create backend structure, app configuration, error handling, and database connection.

### Step 4 — Models
Implement Movie and Admin/User models.

### Step 5 — Authentication
Implement admin login/logout/session handling and auth middleware.

### Step 6 — Data Migration
Seed/migrate the existing movie catalog into MongoDB safely.

### Step 7 — CRUD APIs
Implement movie create/read/update/delete.

### Step 8 — Server-Side Query APIs
Implement search, genre filter, sorting, pagination, and latest releases.

### Step 9 — Bulk JSON Import
Implement validation and batch import.

### Step 10 — Admin Dashboard
Implement `/admin` and all management features.

### Step 11 — Public Frontend API Migration
Replace static client-side movie loading with backend API requests.

### Step 12 — Hero Carousel
Replace static Dune hero with database-driven latest releases.

### Step 13 — Loading/Error/Empty States
Add polished states throughout public and admin interfaces.

### Step 14 — 404
Implement browser-facing CineScope 404 behavior.

### Step 15 — Design Refinement
Polish public/admin layout and preserve mobile 2-column grid.

### Step 16 — Cleanup
Remove obsolete data loading, old client-side pagination, dead code, unused files and unnecessary dependencies after verification.

### Step 17 — Testing
Test auth, CRUD, bulk import, public browsing, search/filter/sort/pagination, carousel, loading, errors, 404, responsive behavior.

### Step 18 — Security Review
Audit secrets, validation, authentication, payload limits, CORS, and query safety.

### Step 19 — Build and Deployment Review
Run the complete local build/start flow and verify Netlify compatibility.

---

# 76. Final Acceptance Criteria

The task is complete only when all are satisfied.

## Backend

- [ ] Node backend is integrated into the same project.
- [ ] MongoDB works through `MONGODB_URI`.
- [ ] Movie model exists.
- [ ] CRUD APIs work.
- [ ] Search is server-side.
- [ ] Genre filtering is server-side.
- [ ] Sorting is server-side.
- [ ] Pagination is server-side.
- [ ] API returns pagination metadata.
- [ ] Latest-release API exists.
- [ ] Bulk JSON API exists.
- [ ] API errors are structured.
- [ ] Server-side validation exists.

## Authentication

- [ ] `/admin` exists.
- [ ] Admin login works.
- [ ] Supplied initial admin credentials can seed/login securely.
- [ ] Password is hashed.
- [ ] Password is not hardcoded in frontend code.
- [ ] Protected routes require authentication.
- [ ] Logout works.

## Admin Dashboard

- [ ] Movie list works.
- [ ] Admin pagination works.
- [ ] Admin search/filter/sort work.
- [ ] Add movie works.
- [ ] Edit movie works.
- [ ] Delete movie works.
- [ ] Delete confirmation exists.
- [ ] Bulk JSON upload works.
- [ ] Bulk validation works.
- [ ] Import summary is displayed.
- [ ] Loading states exist.
- [ ] Success/error feedback exists.
- [ ] Dashboard is responsive.

## Data

- [ ] Existing movie catalog is migrated.
- [ ] Duplicate records are prevented.
- [ ] Existing stable IDs/slugs remain compatible.
- [ ] `isNewRelease` exists.
- [ ] Release dates are stored where appropriate.
- [ ] Movies can be fully managed from the dashboard.

## Homepage

- [ ] Static Dune hero is removed.
- [ ] Hero uses database data.
- [ ] `isNewRelease` controls hero eligibility.
- [ ] Latest releases are ordered correctly.
- [ ] Hero is a carousel.
- [ ] Carousel works responsively.
- [ ] Carousel has loading state.
- [ ] Empty/fallback state works.

## Public Catalog

- [ ] Public catalog loads from API.
- [ ] Full movie database is not sent to the browser.
- [ ] Main pagination is server-side.
- [ ] Pagination uses ellipsis where needed.
- [ ] Search works across the database.
- [ ] Filters work across the database.
- [ ] Sorting works across the database.
- [ ] Combined search/filter/sort/pagination works.
- [ ] Result counts are accurate.
- [ ] Empty state works.

## UX

- [ ] Loading skeletons are polished.
- [ ] Error states are useful.
- [ ] Toast notifications work.
- [ ] Blocking `alert()` is not used for normal feedback.
- [ ] 404 page exists.
- [ ] Mobile movie grid remains 2 columns.
- [ ] Public/admin layouts are responsive.
- [ ] Light/dark theme remains consistent.
- [ ] Accessibility is preserved/improved.

## Environment & Security

- [ ] Local `.env` exists.
- [ ] `.env` is ignored by Git.
- [ ] Useful `env.example` values were migrated.
- [ ] `env.example` is deleted.
- [ ] No real secrets are tracked.
- [ ] MongoDB URI is not exposed to frontend.
- [ ] Admin password is not exposed to frontend.
- [ ] API keys/tokens are not exposed.

## Code Quality

- [ ] Old client-side pagination is removed after migration.
- [ ] Old static movie loading is removed after migration.
- [ ] Dead code is removed.
- [ ] Unused dependencies are removed where safe.
- [ ] Backend modules are separated cleanly.
- [ ] Frontend remains maintainable.
- [ ] Documentation is updated.

## Final Verification

- [ ] Local application starts successfully.
- [ ] MongoDB connects.
- [ ] Admin login works.
- [ ] CRUD works.
- [ ] Bulk import works.
- [ ] Public catalog works.
- [ ] Server-side pagination works.
- [ ] Search/filter/sort work.
- [ ] Latest-release carousel works.
- [ ] Loading/error/empty states work.
- [ ] 404 works.
- [ ] No obvious console errors remain.
- [ ] No obvious backend errors remain.
- [ ] No secrets are exposed.
- [ ] Deployment architecture is documented and compatible with the actual hosting setup.

---

# 77. Final Instruction to Antigravity

Implement this entire specification directly in the repository.

Do not merely produce a plan or tell me what should be done.

Do not stop after the first feature.

Do not ask for permission before ordinary engineering decisions.

Inspect the current code first, determine what previous agents have already implemented, continue from that state, and avoid redoing work that is already correct.

Make reasonable technical decisions yourself.

Use MongoDB as the source of truth.

Implement real CRUD.

Implement real admin authentication.

Implement real bulk JSON import.

Implement real server-side pagination/search/filter/sort.

Replace the static Dune hero with a database-driven latest-release carousel.

Provide polished loading, error, empty, toast, and 404 experiences.

Preserve the current CineScope visual identity and existing working features.

Clean up obsolete code only after verifying it is unused.

Run tests/builds and fix problems before finishing.

**Continue until the acceptance criteria are satisfied.**
