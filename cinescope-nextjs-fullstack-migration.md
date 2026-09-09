# CineScope — Next.js Full-Stack Migration Specification

## Mission

Transform the existing CineScope repository into a polished, production-ready **full-stack JavaScript application** using the **latest stable production release of Next.js available at implementation time**.

Repository: https://github.com/tawhidzihad/cinescope  
Live site: https://cinescope-movie-details.netlify.app/  
Deployment: **Vercel**

## Autonomous Execution

Act as a **Senior Full-Stack Developer, Next.js Architect, Backend Engineer, UI/UX Engineer, Performance Engineer, Security Engineer, DevOps Engineer, and QA Engineer**.

Read this entire document before changing code. **Do not ask for permission before normal engineering steps.** Inspect the current repository, make reasonable decisions, implement the complete migration, test it, fix issues, clean up, and continue until every acceptance criterion is satisfied.

Do not stop after planning. Do not repeatedly ask whether you should continue. Only stop if a required external value genuinely cannot be inferred or found.

---

# 1. Non-Negotiable Requirements

- Use the **latest stable production Next.js version** available at implementation time; do not use canary/pre-release.
- Use the **App Router**.
- Use **JavaScript + JSX only**; no TypeScript.
- Use **SCSS**; do not use Tailwind CSS.
- Keep frontend and backend in the same repository.
- Create a root-level **`backend/`** folder.
- Backend: **Node.js + Express.js + native MongoDB Node.js driver**.
- **Never use Mongoose.** If it exists, migrate all usages and remove it completely.
- Server Components/server-side rendering are the default.
- Client Components are allowed only for actual browser interaction.
- Preserve and reuse useful existing files/assets/features; do not blindly delete or rebuild.
- Use **Swiper.js** for the homepage hero/banner carousel.
- Vercel is the production deployment target.
- Update `README.md` with final setup and deployment instructions.

---

# 2. First: Audit, Then Migrate

Before editing:

1. Inspect the complete repository.
2. Run the current project if possible.
3. Inspect `index.html`, `package.json`, current server code, `js/`, `scss/`, `css/`, `assets/`, admin/dashboard, movie data, pagination, search, filters, sorting, trailer, watchlist, theme, environment files, `.gitignore`, and deployment config.
4. Identify features already implemented by previous agents.
5. Identify reusable assets and logic.
6. Identify obsolete files only after checking their references.
7. Make an internal implementation plan and execute it without approval checkpoints.

**Do not delete the current project and create a blank Next.js starter.** Migrate the current CineScope into Next.js.

---

# 3. Migration Rules

Prefer:

```text
Existing HTML → Next.js JSX
Existing JS → JS utilities / React components / server modules
Existing SCSS → SCSS / SCSS modules
Existing assets → public/
Existing features → migrated/reused components
```

Preserve the current CineScope visual identity and useful work.

Delete only files that are proven obsolete after migration.

---

# 4. Next.js App Router

Use a structure similar to:

```text
app/
  layout.jsx
  page.jsx
  movies/
    page.jsx
  movie/
    [id]/
      page.jsx
  admin/
    page.jsx
  loading.jsx
  error.jsx
  not-found.jsx

components/
  movie/
  hero/
  pagination/
  admin/
  ui/

lib/
services/
styles/
public/
backend/
scripts/
```

Adapt this to the repository where appropriate.

---

# 5. Server-First Rendering

Use Server Components by default.

Prefer:

```text
Server Component
  ↓
Server-side data fetch
  ↓
Rendered HTML
```

Do not use `useEffect()` + client fetch for data that can be obtained on the server.

Keep Client Components small and isolated for:

- Swiper
- interactive search controls
- watchlist buttons
- theme toggle
- modal/trailer player
- interactive pagination
- admin form state
- file upload/preview
- browser-only animations

Do not add `"use client"` to large parents simply because a child is interactive.

---

# 6. SEO / SSR

Use Next.js metadata APIs.

Dynamic movie pages should generate useful server-side metadata from movie data, including title, description, Open Graph image, and canonical information where appropriate.

Movie detail content must be present in server-rendered HTML before hydration.

---

# 7. Backend Location and Stack

Create:

```text
backend/
```

Use:

- Node.js
- Express.js
- native `mongodb` driver

Never use:

- Mongoose
- Prisma
- Sequelize
- TypeORM
- another ODM/ORM

Suggested structure:

```text
backend/
  config/
    env.js
    db.js
  controllers/
  middleware/
  routes/
  services/
  utils/
  app.js
  server.js
```

Do not put all backend logic into `server.js`.

---

# 8. Express App Separation

`backend/app.js` should create/configure the Express app.

`backend/server.js` should only be the local process entry point.

Conceptually:

```js
export function createApp() {
  const app = express();
  // middleware
  // routes
  // error handler
  return app;
}
```

This allows the same app to work locally and within Vercel server/function execution.

---

# 9. MongoDB

Use the supplied MongoDB URI via:

```env
MONGODB_URI=...
```

Never hardcode it.

Never expose it to the browser.

Build a reusable, Vercel/serverless-friendly MongoDB connection helper that avoids opening an unnecessary new connection for every invocation.

---

# 10. Database Collections

Create/use at least:

```text
movies
genres
```

Movie data should support the current CineScope fields plus:

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

Use only fields that are actually useful.

---

# 11. Genres

Keep a dedicated `genres` collection.

Example:

```js
{
  name,
  slug,
  createdAt,
  updatedAt
}
```

Prevent duplicates with appropriate unique indexes.

Synchronize genres when movies are created, edited, seeded, or bulk imported.

---

# 12. Existing Data Migration

The current static/dummy movie data must be migrated into MongoDB.

Create a repeatable script such as:

```text
scripts/seed-mongodb.mjs
```

It must:

- read existing movie data
- normalize records
- insert/update MongoDB
- synchronize genres
- preserve important existing IDs/slugs
- prevent accidental duplicates
- report inserted/updated/skipped counts
- avoid destructive database wipes by default

Prefer an idempotent seed process.

After migration is verified, MongoDB becomes the production source of truth.

---

# 13. Remove Mongoose

If Mongoose is already installed or used:

1. Find every import/use.
2. Replace schemas/models with plain MongoDB operations.
3. Replace queries with the native driver.
4. Verify behavior.
5. Remove the `mongoose` dependency.
6. Update the lockfile.
7. Search again to ensure no Mongoose usage remains.

Final backend must contain **zero Mongoose usage**.

---

# 14. REST API

Implement real endpoints:

```text
GET    /api/movies
GET    /api/movies/:id
POST   /api/movies
PUT    /api/movies/:id
DELETE /api/movies/:id

GET    /api/genres
GET    /api/movies/latest-releases

POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

POST   /api/movies/bulk
```

Adapt naming only when existing conventions make another form clearly better.

---

# 15. Server-Side Pagination

The old client-side pagination must be removed from the production data flow.

Never send the complete movie database to the browser.

Correct:

```text
Next.js/server
  ↓
API or server service
  ↓
MongoDB
  ↓
filter/search/sort
  ↓
pagination
  ↓
current page only
```

Use URL search parameters such as:

```text
/movies?page=2&limit=12
```

The API/service must return pagination metadata:

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

Choose a sensible page size. The existing mobile design must remain two movie cards per row.

---

# 16. Server-Side Search, Filter, Sort

Search, genre filtering, and sorting must operate on MongoDB/server data before pagination.

Correct order:

```text
Search
→ Filter
→ Sort
→ Pagination
→ Render
```

Support combinations such as:

```text
/movies?search=batman&genre=Action&sort=newest&page=2&limit=12
```

Do not filter a full 250+ movie array in the browser.

Use allowlisted sort fields and validated query parameters.

---

# 17. Admin Authentication

Create/fix:

```text
/admin
```

Use secure authentication suitable for Vercel.

Prefer secure HTTP-only cookies/session authentication where practical.

Initial credentials must be supplied only through environment variables, for example:

```env
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Hash the password before database storage.

Never put the real credentials in:

- frontend code
- JSX
- README
- API responses
- tracked configuration

---

# 18. Protected Routes

Protect all admin write operations, including:

```text
POST   /api/movies
PUT    /api/movies/:id
DELETE /api/movies/:id
POST   /api/movies/bulk
```

Protect any other admin-only endpoint too.

Do not rely only on hiding admin UI.

---

# 19. Admin Dashboard

Migrate/improve the current dashboard inside Next.js.

It must provide:

- login
- movie list
- server-side pagination
- search
- filters
- sorting
- add movie
- edit movie
- delete movie
- delete confirmation
- bulk JSON import
- loading states
- success/error feedback
- logout

Keep it visually consistent with CineScope.

---

# 20. Admin Pagination

Admin list must also be server-side paginated.

Choose a good page size such as 10–25 based on layout.

Use ellipsis pagination for many pages.

Do not load the entire database into the admin browser.

---

# 21. CRUD Forms

Add/edit forms should support the actual Movie model, including:

- title
- slug
- TMDB ID
- tagline
- release date
- year
- rating
- votes
- runtime/duration
- genres
- director
- cast
- description
- full overview
- poster
- backdrop
- trailer fields
- `isNewRelease`

Use grouped form sections.

Validate on both client and server.

---

# 22. Delete Safety

Require confirmation before deletion.

After deletion:

- refresh results
- update pagination
- update counts
- move to the last valid page if necessary
- show success feedback

---

# 23. Bulk JSON Import

Keep/improve the existing bulk movie import.

Admin workflow:

```text
Choose JSON file
→ Validate
→ Preview/result
→ Import
```

Do not make one request per movie.

Send the batch once and use MongoDB bulk operations such as `insertMany` or `bulkWrite`.

---

# 24. Bulk Validation

Validate:

- file type
- file size
- JSON syntax
- root structure
- required fields
- field types
- arrays
- dates
- ratings
- URLs
- duplicate IDs
- duplicate slugs
- duplicate TMDB IDs
- genres
- `isNewRelease`

Return useful record-level errors.

Do not silently overwrite records.

Report:

```text
inserted
updated
skipped
affected/invalid
```

---

# 25. Latest Release Data

Add/use:

```text
isNewRelease
```

and store `releaseDate` where possible.

This field must be editable from the admin dashboard.

---

# 26. Dynamic Homepage Hero

Remove the static hardcoded Dune hero dependency.

Create/use an endpoint/service such as:

```text
GET /api/movies/latest-releases
```

Query:

```text
isNewRelease = true
sort by releaseDate DESC
```

Return only a sensible number of hero slides.

Do not hardcode a specific movie as the permanent hero.

If there are no new releases, show a graceful neutral/database fallback without falsely labeling it a new release.

---

# 27. Swiper.js

Use **Swiper.js** for the homepage banner.

Architecture:

```text
app/page.jsx                 Server Component
       ↓
fetch latest releases server-side
       ↓
HeroCarousel.jsx             Client Component
       ↓
Swiper.js
```

Do not make the entire homepage a Client Component just because Swiper is interactive.

Swiper should support:

- autoplay
- next/previous controls
- pagination indicators where useful
- touch/swipe
- responsive slides
- keyboard support where practical
- reduced-motion behavior
- accessible labels

Keep animation cinematic and restrained.

---

# 28. Loading States

Use Next.js loading boundaries such as:

```text
loading.jsx
```

and reusable skeleton components where useful.

Required loading UI for:

- public movie list
- hero
- movie details
- admin list
- add/edit/delete mutations
- bulk import
- login

Do not add fake delays just to show loading.

---

# 29. Error States

Use appropriate Next.js and backend error boundaries:

```text
error.jsx
```

API errors should be structured and user-safe.

Do not expose:

- stack traces
- MongoDB internals
- secrets
- internal file paths

Offer retry actions where useful.

---

# 30. 404

Implement:

```text
app/not-found.jsx
```

Use `notFound()` for missing movie/detail resources where appropriate.

The 404 page must be polished, responsive, branded, and theme-compatible.

API 404s must return JSON rather than the HTML 404 page.

---

# 31. Existing Movie Details

Use a dynamic route such as:

```text
app/movie/[id]/page.jsx
```

It should fetch its movie server-side.

Client-side behavior should be isolated to:

- trailer player
- watchlist toggle
- interactive actions

Direct refresh/deep links must work.

---

# 32. Trailer

Preserve the previous trailer behavior:

- real YouTube trailer → play it
- missing trailer → show a toast
- never fabricate trailer IDs
- do not use `alert()` for normal application feedback

Movie data should provide trailer information from the database/server layer.

---

# 33. Watchlist

Preserve existing watchlist behavior.

If localStorage is used, keep it inside Client Components only.

Handle deleted movies gracefully.

---

# 34. Mobile Grid

Preserve the requirement:

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

# 35. SCSS — No Tailwind

Do not use Tailwind.

Use SCSS and keep a clear structure such as:

```text
styles/
  abstracts/
  base/
  components/
  layout/
  pages/
  themes/
  main.scss
```

Use SCSS variables/tokens for:

- colors
- spacing
- typography
- radii
- shadows
- breakpoints
- transitions

Keep nesting controlled.

---

# 36. Design Rules

Preserve CineScope's identity:

- cinematic
- modern
- premium
- clean
- restrained
- accessible

Polish:

- navbar
- hero
- movie cards
- search
- filters
- pagination
- details
- trailer
- loading
- 404
- admin dashboard
- forms
- buttons
- spacing
- typography

Avoid:

- generic SaaS styling
- excessive glassmorphism
- excessive gradients
- huge shadows
- random colors
- noisy animations
- unnecessary borders

---

# 37. Animation Rules

Use animation where it improves UX:

- Swiper transitions
- subtle card hover/focus
- button feedback
- modal transitions
- skeleton shimmer
- page UI transitions

Prefer `transform` and `opacity` for smooth animations.

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable/reduce nonessential movement.

---

# 38. Image Handling

Use Next.js image optimization where appropriate.

Configure only trusted remote image hosts such as the required movie-image source.

Preserve useful local assets in `public/`.

Movie images should have useful alt text.

Use stable aspect ratios to avoid layout shift.

---

# 39. Performance

Prioritize:

- Server Components
- server-side data fetching
- small Client Components
- server-side pagination
- efficient MongoDB queries
- useful indexes
- optimized images
- minimal hydration
- lazy images
- sensible caching/revalidation

Do not load the full movie catalog into the browser.

---

# 40. Next.js Caching / Revalidation

Use the current stable Next.js caching/revalidation mechanisms where useful.

Public movie data can be cached/revalidated when appropriate.

After admin mutations:

- revalidate affected movie data
- refresh latest-release data if relevant
- refresh list/count data

Do not cache admin responses incorrectly.

---

# 41. Backend API Architecture

Keep the backend flow modular:

```text
Route
 ↓
Middleware / Validation
 ↓
Controller
 ↓
Service
 ↓
MongoDB
```

Do not put raw database logic throughout route files.

---

# 42. API Response Consistency

Use predictable structures.

Example:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Movie not found"
}
```

Validation errors may include an `errors` object.

---

# 43. Security

Implement sensible production protections:

- password hashing
- protected admin routes
- secure HTTP-only auth cookies where appropriate
- request/body-size limits
- login rate limiting
- safe MongoDB queries
- allowlisted sort fields
- validated input
- restrictive CORS where needed
- safe error responses

Do not over-engineer.

---

# 44. Environment Variables

Use `.env` for local development.

Possible server-only variables:

```env
MONGODB_URI=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
SESSION_SECRET=...
JWT_SECRET=...
TMDB_API_TOKEN=...
YOUTUBE_API_KEY=...
```

Only include variables actually used.

Never expose secrets using `NEXT_PUBLIC_*`.

Real production secrets must be configured in Vercel environment settings.

---

# 45. Git Safety

`.env` must be ignored.

Verify:

```bash
git status
```

No:

- MongoDB URI
- admin password
- API key
- session secret
- JWT secret

may be committed or bundled for the client.

Search the repository for accidental secret exposure before finishing.

---

# 46. README

Update `README.md` to document:

- CineScope overview
- Next.js App Router architecture
- Server/Client Component strategy
- backend architecture
- native MongoDB driver
- environment variables
- local setup
- MongoDB seed
- admin setup
- API overview
- bulk JSON format
- Vercel deployment
- project structure
- scripts

Remove any real admin email/password from the README.

Do not include real MongoDB credentials or API keys.

---

# 47. ESLint

Use the current ESLint setup appropriate for the installed stable Next.js version.

Keep lint rules focused on:

- unused variables/imports
- unreachable code
- React/Next best practices
- hooks correctness
- unsafe patterns
- accidental globals
- maintainable imports

Do not disable rules without a reason.

Keep the project lint-clean.

---

# 48. JavaScript Code Rules

Use modern JavaScript.

Prefer:

- `const` / `let`
- small focused functions
- clear names
- early returns
- module boundaries
- reusable services
- predictable state

Avoid:

- giant functions
- global mutable state
- duplicate logic
- inline style hacks
- unnecessary abstractions
- browser APIs inside Server Components

---

# 49. React Component Rules

Prefer focused components such as:

```text
MovieCard
MovieMeta
MovieActions
MovieGrid
Pagination
HeroCarousel
TrailerPlayer
Toast
AdminMovieTable
MovieForm
BulkImport
```

Do not split every trivial element into a component just for the sake of splitting.

Do not create giant page components.

---

# 50. Client Boundary Audit

After implementation, inspect every:

```text
"use client"
```

Ask:

> Does this component genuinely need browser interaction?

If not, convert it back to a Server Component.

Keep hydration surface as small as practical.

---

# 51. Browser API Audit

Search for:

```text
window
document
localStorage
navigator
```

Ensure these only run in Client Components/browser contexts.

---

# 52. Public Data Flow

Final preferred flow:

```text
MongoDB
   ↓
Express/backend service or shared server data layer
   ↓
Next.js Server Component
   ↓
HTML + minimal hydration
```

For public pages, avoid unnecessary server-to-self HTTP requests when a shared server-side service/data layer can perform the query directly.

The Express API must still exist as the backend API surface.

---

# 53. Vercel Backend Integration

Vercel is the deployment target.

Do not assume a permanently running:

```text
node backend/server.js
```

process in production.

Keep Express reusable and expose it through a Vercel-compatible function/serverless route.

Choose the current supported Vercel architecture for Express/function execution.

The exact file placement may be:

```text
api/[...path].js
```

or another supported equivalent.

Do not build a separate always-on backend service unless there is a documented technical requirement.

---

# 54. One Repository / One Deployment

Target architecture:

```text
CineScope Repository
│
├── Next.js frontend
├── backend/
│   └── Express API
├── scripts/
├── public/
└── styles/

Vercel
   ↓
Next.js + server/function runtime
   ↓
MongoDB
```

The whole project should be deployable as one Vercel project.

---

# 55. API Routing

Prefer same-origin public API URLs:

```text
/api/movies
/api/auth/login
```

Do not hardcode localhost or a production hostname in frontend code.

---

# 56. Admin Auth Flow

Expected behavior:

```text
/admin
  ↓
not authenticated
  ↓
login
  ↓
success
  ↓
dashboard
```

Authenticated users should not be unnecessarily sent back to login.

Expired/invalid sessions must return to login safely.

---

# 57. Loading / Error / Empty State Matrix

Every important data-driven section should have:

```text
Loading
Success
Error
Empty
```

At minimum:

- movie list
- hero
- movie detail
- admin list
- admin forms
- bulk import
- login

---

# 58. Request Race Conditions

For interactive Client Components, prevent stale API responses from replacing newer state.

Example:

```text
search "bat"
then immediately search "batman"
```

The older result must not overwrite the newer result.

Use cancellation/request identity tracking when needed.

---

# 59. Admin Mutation State

For add/edit/delete/bulk import:

```text
submit
→ disable duplicate action
→ loading
→ response
→ success/error
→ refresh data
```

Do not allow accidental duplicate submissions.

---

# 60. Existing Feature Preservation

Do not regress:

- search
- filtering
- sorting
- watchlist
- trailer
- theme
- responsive navigation
- movie details
- mobile two-column grid
- existing corrected movie data/posters
- existing useful admin features

If an existing implementation is broken, fix it as part of the migration.

---

# 61. Data Quality Preservation

Do not reintroduce bad movie data or shared/incorrect posters.

Existing movie records must remain valid after migration.

If the current dataset contains incorrect poster mappings, fix them rather than copying the same image across unrelated movies.

Do not fabricate movie or trailer data.

---

# 62. Bulk/Seed Data Integrity

Do not use destructive commands such as a database-wide wipe as the normal migration process.

Before migration:

- count source records
- validate required fields
- inspect duplicates

After migration:

- report inserted/updated/skipped counts
- verify genres
- verify stable IDs/slugs

---

# 63. Database Indexes

Evaluate indexes for:

- slug
- tmdbId
- title/search
- releaseDate
- isNewRelease
- genres

Only create indexes that support actual query patterns.

---

# 64. API Query Limits

Set sensible pagination defaults and a maximum page size.

For example:

```text
default = 12
max = 50
```

Choose appropriately.

Never allow huge requests that could return the entire database accidentally.

---

# 65. 404 / Routing

Use Next.js route handling and `not-found.jsx` for browser pages.

API resources must return JSON 404s.

Verify direct refresh/deep links for:

```text
/movies
/movie/[id]
/admin
```

---

# 66. Admin Bulk JSON Example

The accepted structure should be documented and should resemble:

```json
[
  {
    "title": "Movie One",
    "year": 2025,
    "rating": 8.2,
    "genres": ["Drama"],
    "poster": "https://...",
    "isNewRelease": true
  }
]
```

The final schema should follow the actual Movie model.

---

# 67. Deployment Configuration

Inspect the current Vercel/Next.js deployment behavior and configure only what is necessary.

Ensure:

- build works
- server/function routes work
- MongoDB environment variable works
- admin authentication works
- dynamic routes work
- 404 works
- images work
- SCSS builds

Do not add deployment configuration that is unnecessary for the final architecture.

---

# 68. Local Development

Make local setup straightforward.

The actual final README should document commands similar to:

```bash
npm install
npm run dev
```

and the database seed command, using the actual scripts created in the repository.

Do not document commands that do not exist.

---

# 69. Production Build

Run the actual project commands from `package.json`.

At minimum verify equivalents of:

```bash
npm install
npm run lint
npm run build
```

Run seed/validation scripts when appropriate.

Do not finish with known build or lint failures.

---

# 70. Testing

Test the full stack.

## Public

- homepage
- latest-release hero
- Swiper navigation/autoplay
- movie list
- server-side pagination
- ellipsis pagination
- search
- filters
- sorting
- combined query
- details
- trailer
- watchlist
- theme
- loading/error/empty states
- 404

## Admin

- `/admin`
- valid login
- invalid login
- logout
- session persistence
- protected routes
- list pagination
- search/filter/sort
- add
- edit
- delete
- confirmation
- bulk JSON
- validation
- loading/errors

## Backend

- MongoDB connection
- CRUD
- auth
- pagination
- search
- filters
- sorting
- genres
- latest releases
- bulk import
- validation
- protected write operations
- API 404

---

# 71. Responsive Testing

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

- two-column mobile movie grid
- hero
- pagination
- search
- filters
- movie detail
- admin dashboard
- forms
- loading states
- 404
- no horizontal overflow

---

# 72. Browser Testing

Verify modern Chrome, Edge, and Firefox where available.

Inspect:

- console errors
- hydration warnings
- failed API requests
- broken image requests
- auth problems
- client/server boundary mistakes

---

# 73. Final Code Cleanup

Remove genuinely obsolete:

- static full-catalog production imports
- old client-side pagination implementation
- Mongoose
- obsolete server code
- duplicate helpers
- dead JS
- dead SCSS/CSS
- unused dependencies
- debug logs
- temporary files

Do not delete files blindly. Verify usage first.

---

# 74. Final Security Audit

Search the whole repository for:

```text
mongodb://
mongodb+srv://
ADMIN_PASSWORD
ADMIN_EMAIL
SESSION_SECRET
JWT_SECRET
TMDB_API_KEY
TMDB_API_TOKEN
YOUTUBE_API_KEY
```

Confirm real secrets are not committed or exposed to the client.

Verify `.env` is ignored.

---

# 75. Final Acceptance Criteria

The migration is complete only when all are true:

## Framework

- [ ] Latest stable Next.js is used.
- [ ] App Router is used.
- [ ] JavaScript/JSX only.
- [ ] No TypeScript.
- [ ] No Tailwind.
- [ ] SCSS is used.
- [ ] Existing useful files/assets were migrated/reused.

## Rendering

- [ ] Server Components are the default.
- [ ] Public data is server-fetched/rendered where practical.
- [ ] Client Components are limited to actual interactivity.
- [ ] Hydration warnings are fixed.

## Backend

- [ ] Root `backend/` exists.
- [ ] Node.js + Express.js are used.
- [ ] Native MongoDB driver is used.
- [ ] Mongoose is completely removed.
- [ ] MongoDB connection is serverless-friendly.
- [ ] CRUD APIs work.
- [ ] Auth APIs work.
- [ ] Bulk import works.
- [ ] Search/filter/sort work server-side.
- [ ] Pagination works server-side.
- [ ] Genres collection works.
- [ ] Latest-release API works.

## Database

- [ ] Existing movie data is migrated.
- [ ] MongoDB is the production source of truth.
- [ ] Genres are synchronized.
- [ ] Duplicates are controlled.
- [ ] Useful indexes exist.
- [ ] Seed script is repeatable where practical.

## Admin

- [ ] `/admin` works.
- [ ] Login is secure.
- [ ] Credentials are environment-driven.
- [ ] Password is hashed.
- [ ] Write APIs are protected.
- [ ] CRUD works.
- [ ] Admin pagination is server-side.
- [ ] Bulk JSON import works.
- [ ] Validation works.
- [ ] Delete confirmation exists.
- [ ] Loading/error/toast states work.

## Public Site

- [ ] Public movie data comes from the backend/server data layer.
- [ ] Full catalog is not sent to the browser.
- [ ] Server-side pagination works.
- [ ] Search/filter/sort work.
- [ ] Existing pagination UI remains accessible and polished.
- [ ] Mobile shows 2 movie cards per row.
- [ ] Loading/error/empty states work.
- [ ] Movie details are server-rendered.
- [ ] Trailer/watchlist/theme continue to work.
- [ ] 404 works.

## Hero

- [ ] Static Dune hero is removed.
- [ ] `isNewRelease` exists.
- [ ] Admin can toggle it.
- [ ] Latest releases come from MongoDB.
- [ ] Hero uses Swiper.js.
- [ ] Swiper is isolated to a Client Component.
- [ ] Hero data is server-fetched.
- [ ] Responsive/autoplay/navigation work.
- [ ] Empty/loading states work.
- [ ] Reduced motion is respected.

## Security

- [ ] `.env` is ignored.
- [ ] MongoDB URI is not hardcoded.
- [ ] Admin password is not hardcoded in frontend.
- [ ] Credentials are absent from README.
- [ ] Server secrets are not public.
- [ ] Authentication is protected.
- [ ] Requests are validated.

## Deployment

- [ ] Vercel is the deployment target.
- [ ] Express backend is Vercel-compatible.
- [ ] API routes work on Vercel.
- [ ] MongoDB works through Vercel environment variables.
- [ ] `/admin` works on Vercel.
- [ ] Dynamic routes work.
- [ ] 404 works.
- [ ] Build succeeds.

## Quality

- [ ] ESLint passes.
- [ ] Production build passes.
- [ ] No obvious console/hydration errors remain.
- [ ] Dead code is removed safely.
- [ ] README is updated.
- [ ] Final code is maintainable and modular.

---

# 76. Implementation Order

Execute in this order without approval checkpoints:

```text
1. Audit existing CineScope
        ↓
2. Identify reusable assets/features
        ↓
3. Upgrade to latest stable Next.js App Router
        ↓
4. Migrate existing HTML/JS/SCSS into JSX/JS/SCSS
        ↓
5. Preserve existing behavior/design
        ↓
6. Create backend/
        ↓
7. Build modular Express app
        ↓
8. Implement native MongoDB connection
        ↓
9. Create movies + genres data layer
        ↓
10. Create seed/migration script
        ↓
11. Migrate existing data
        ↓
12. Implement authentication
        ↓
13. Implement CRUD APIs
        ↓
14. Implement server-side search/filter/sort/pagination
        ↓
15. Implement bulk JSON import
        ↓
16. Implement latest-release API
        ↓
17. Build/fix admin dashboard
        ↓
18. Integrate public Next.js pages with server data
        ↓
19. Replace static hero with database-driven releases
        ↓
20. Add isolated Swiper Client Component
        ↓
21. Remove client-side full-catalog dependency
        ↓
22. Add loading/error/not-found states
        ↓
23. Polish SCSS/UI/animations/responsive behavior
        ↓
24. Audit use client boundaries
        ↓
25. Remove Mongoose/obsolete dependencies/code
        ↓
26. Configure ESLint
        ↓
27. Configure Vercel-compatible Express execution
        ↓
28. Update README
        ↓
29. Run lint/tests/build
        ↓
30. Security audit
        ↓
31. Final repository review
```

---

# 77. Final Senior-Developer Instruction

This is an implementation task, not a proposal.

**Actually modify the repository.**

Do not:

- delete the entire project and start from an empty starter
- rebuild everything unnecessarily
- use Mongoose
- use Tailwind
- use TypeScript
- make the whole app a Client Component
- load the complete movie database into the browser
- hardcode the hero movie
- hardcode secrets
- create fake API responses
- leave core requirements as TODOs

Do:

- inspect first
- reuse existing work
- migrate cleanly to Next.js
- maximize SSR/Server Components
- isolate interactivity into Client Components
- build a modular Express backend
- use the native MongoDB driver
- make MongoDB the source of truth
- use server-side search/filter/sort/pagination
- use Swiper for the hero
- keep SCSS
- polish the existing design
- secure admin authentication
- make the complete repository Vercel-deployable
- test and fix the entire stack
- update README

**Start immediately by auditing the repository, then execute the complete migration through final verification.**
