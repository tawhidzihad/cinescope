# CineScope — Update & Implementation Specification

> **Purpose:** This document is the single source of truth for the next CineScope implementation.  
> **Repository:** https://github.com/tawhidzihad/cinescope  
> **Current live site:** https://cinescope-movie-details.netlify.app/  
> **Implementation style:** Work as a small senior engineering team, execute the work in phases, and do not stop for approval between phases.

---

## 1. Project Context

CineScope is currently a **Vanilla JavaScript + HTML5 + SCSS** movie discovery application.

Current architecture includes:

- `js/data/movies.js` — static movie catalog
- `js/components/movie-card.js` — movie card renderer
- `js/components/movie-modal.js` — desktop movie-details modal
- `js/features/search.js` — debounced search
- `js/features/filters.js` — genre/sort filtering
- `js/main.js` — application coordinator
- `scss/` — 7-1 style SCSS architecture
- `css/main.css` — compiled production CSS
- `server.js` — lightweight Node development server
- Current catalog contains **16 movies**

The current application already has a polished visual foundation. Do **not** replace the project with React, Vue, Tailwind, Bootstrap, or another framework.

The implementation must preserve the existing architecture and improve it cleanly.

---

# 2. Main Objectives

Implement all of the following in one coordinated update:

1. Fix the mobile search icon alignment.
2. Add approximately **200 new movie records** while preserving the existing movies.
3. Add real YouTube trailer support for existing and newly added movies.
4. If a movie has no usable YouTube trailer, show a proper toast message instead of a fake/placeholder trailer.
5. Keep the current desktop movie-click behavior as a modal.
6. On mobile/tablet-sized screens, clicking a movie card must open the movie details in a **new browser tab/page**, not a modal.
7. Refresh the overall UI slightly while preserving CineScope's current visual identity.
8. Make the larger movie catalog performant and usable.
9. Keep accessibility and responsive behavior at a high standard.
10. Add validation/testing so the update is production-ready.

---

# 3. Important Rules for the AI/Engineering Team

## Do not blindly rewrite the project

First inspect the existing implementation and understand how the current architecture works.

Do not replace working features unnecessarily.

## Do not manually type 200 fake movie objects

The new movie dataset must be generated/enriched through a repeatable data-generation process.

Use a trusted movie data source such as **TMDB** for metadata.

The repository should end with a deterministic/static movie dataset so the frontend does not need to make 200+ metadata requests every time the page loads.

## Do not invent trailer URLs

Never fabricate YouTube IDs.

A trailer should only be stored when a real, valid YouTube trailer/video result is found.

## Never expose API secrets

API keys/tokens must stay server-side or in environment variables.

Never place TMDB or YouTube private credentials inside frontend JavaScript.

## Do not break desktop behavior

Desktop currently uses the movie-details modal.

That behavior must remain.

The mobile requirement is an additional responsive behavior, not a replacement for the desktop modal.

## Work sequentially, but complete everything automatically

Treat this task as if the following team members are working together:

- Product/Tech Lead
- Backend/Data Engineer
- Frontend Engineer
- UI/UX Engineer
- QA Engineer

The same AI agent may perform all roles, but it should reason and execute in that order.

Do not pause after each role asking for permission.

---

# 4. Team Workflow

## Phase 0 — Tech Lead / Existing-System Audit

Before changing code:

1. Inspect the repository structure.
2. Inspect:
   - `index.html`
   - `js/main.js`
   - `js/data/movies.js`
   - `js/components/movie-card.js`
   - `js/components/movie-modal.js`
   - `js/features/search.js`
   - `js/features/filters.js`
   - mobile navigation
   - navbar SCSS
   - modal SCSS
   - movie-card SCSS
   - existing package scripts
   - `server.js`
3. Run the application locally.
4. Verify the current desktop and mobile behavior.
5. Identify the smallest safe set of files that need modification.
6. Preserve existing conventions and naming patterns.

Create a short internal implementation plan before editing, then execute it.

---

# 5. Feature A — Fix Mobile Search Icon

## Current issue

On mobile, the search icon inside the search input is visually misaligned.

The target is the search field shown in the supplied screenshot:

- Search icon should sit vertically centered.
- It should have consistent left spacing.
- It must not overlap the input text.
- It must remain correctly aligned across common mobile widths.
- It should remain correct in both light and dark themes.

## Expected behavior

For the mobile search field:

- Icon: vertically centered.
- Input text: vertically centered.
- Left padding must account for the icon.
- Right-side clear button must not collide with the icon/input text.
- No magic positioning that breaks at different viewport widths.

Inspect the existing `.mobile-search`, `.search-icon`, and `.search-input` rules before changing them.

Prefer a robust CSS solution using:

- `position: relative`
- `top: 50%`
- `transform: translateY(-50%)`

or an equally reliable layout solution.

Do not use JavaScript to position the icon.

## QA

Test at minimum:

- 320px
- 360px
- 375px
- 390px
- 414px
- 768px

---

# 6. Feature B — Expand Movie Catalog by ~200 Movies

## Requirement

The current project has 16 movies.

Add approximately **200 new unique movies**, resulting in roughly:

**216 total movies**

The exact final number may be slightly above 216 if needed to maintain data quality, but the implementation must clearly add at least 200 genuinely new movie records.

## Data quality requirements

New movies should:

- Be real movies.
- Have unique IDs.
- Have meaningful titles.
- Have valid release years.
- Have valid ratings.
- Have useful descriptions/overviews.
- Have genres.
- Have director information where available.
- Have cast information where available.
- Have valid poster URLs.
- Have valid backdrop URLs where available.
- Be searchable.
- Work with the existing sorting system.
- Work with genre filtering.
- Work with the existing movie-card component.
- Work with the movie-details page/modal.

Avoid fake/random placeholder records.

## Preferred source

Use **TMDB API** as the primary source for movie metadata.

TMDB API documentation:

https://developer.themoviedb.org/docs/getting-started

Authentication documentation:

https://developer.themoviedb.org/docs/authentication-application

## Recommended implementation

Create a repeatable data-generation/seed script, for example:

```text
scripts/
  generate-movie-catalog.mjs
```

The script should:

1. Fetch a curated set of movie candidates from TMDB.
2. Select approximately 200 movies that are not already in the existing 16.
3. Avoid duplicate titles/IDs.
4. Preserve the existing 16 records.
5. Normalize all records into CineScope's existing movie schema.
6. Add a stable `tmdbId`.
7. Fetch/enrich trailer information.
8. Generate/update the static catalog file.
9. Produce deterministic output.

Do not make the user's browser fetch metadata for 216 movies on every page load.

---

# 7. Recommended Movie Schema

Maintain compatibility with the existing schema, but extend it where useful.

Recommended shape:

```js
{
  id: "movie-slug",
  tmdbId: 12345,
  title: "Movie Title",
  tagline: "Optional tagline",
  year: 2024,
  rating: 8.2,
  votes: "450K",
  duration: "2h 10m",
  genres: ["Drama", "Thriller"],
  director: "Director Name",
  cast: ["Actor One", "Actor Two"],
  description: "Short description.",
  fullOverview: "Full movie overview.",
  poster: "https://...",
  backdrop: "https://...",
  trailerKey: "YOUTUBE_VIDEO_ID_OR_NULL",
  trailerUrl: "https://www.youtube.com/watch?v=...",
  trailerSource: "youtube",
  featured: false
}
```

`trailerKey` should be `null` when no usable trailer exists.

Do not put fake values such as:

```js
trailerKey: "placeholder"
```

---

# 8. Trailer System

## User requirement

For **both existing movies and newly added movies**:

- If a YouTube trailer is available → use that real trailer.
- If a trailer is not available → show a toast explaining that no trailer was found.

The current implementation uses an `alert()` saying that a trailer is "ready". That must be removed.

The trailer feature must become real.

---

# 9. Trailer Data Strategy

Prefer this flow:

### Step 1 — TMDB movie lookup

Use the movie's `tmdbId`.

### Step 2 — Retrieve movie videos

Use TMDB's movie details/video capability.

TMDB supports `append_to_response`, so movie details and videos can be retrieved efficiently.

Documentation:

https://developer.themoviedb.org/docs/append-to-response

### Step 3 — Select a YouTube trailer

From returned video data:

Prefer:

1. `site === "YouTube"`
2. `type === "Trailer"`
3. official/trustworthy result where available
4. English-language result where practical
5. usable video key

If no suitable trailer exists:

```js
trailerKey: null
```

Do not guess.

---

# 10. Optional YouTube Verification Layer

If the implementation needs additional YouTube validation, use the official YouTube Data API from the backend only.

Documentation:

https://developers.google.com/youtube/v3/docs/search/list

The API supports filtering/searching videos and can restrict results to embeddable videos.

If used:

- Keep credentials server-side.
- Do not call it directly from public frontend code with a secret key.
- Cache results.
- Avoid one request per page render.
- Never make the user wait for hundreds of trailer requests.

---

# 11. Trailer UI Behavior

Replace the current fake `alert()` implementation.

When the user clicks **Watch Trailer**:

### Case A — Trailer exists

Open a proper trailer player.

Preferred UX:

- Dedicated trailer overlay/lightbox or trailer section.
- Responsive 16:9 video.
- YouTube iframe/embed.
- Close button.
- ESC support.
- Click-outside-to-close if using an overlay.
- Do not autoplay with sound unless browser rules and UX justify it.
- Stop/remove the iframe when closing so playback stops.
- Keep keyboard accessibility.

Example embed pattern:

```text
https://www.youtube.com/embed/{trailerKey}
```

Do not hardcode actual IDs in the UI component.

### Case B — Trailer does not exist

Show a non-blocking toast:

> **Trailer not available**  
> We couldn't find a YouTube trailer for this movie.

The toast should:

- not use `alert()`
- be visually consistent with CineScope
- appear without blocking the page
- automatically disappear after a few seconds
- support light/dark themes
- have `role="status"` or an appropriate accessible live-region strategy

---

# 12. Trailer Component Architecture

Do not put all trailer logic inside `movie-modal.js`.

Create a small reusable feature/component, for example:

```text
js/components/trailer-player.js
js/components/toast.js
```

or an equivalent architecture that fits the existing codebase.

Suggested responsibilities:

### `trailer-player.js`

- open trailer
- render iframe
- close trailer
- cleanup iframe
- keyboard handling
- accessibility

### `toast.js`

- show message
- hide message
- queue messages if necessary
- support success/info/warning/error variants if useful

Keep the architecture simple.

Do not over-engineer it.

---

# 13. Feature C — Desktop vs Mobile Movie Details

## Desktop requirement

Desktop must continue to work as it currently does:

**Movie card click → movie details modal**

Do not remove the desktop modal.

## Mobile requirement

On mobile/tablet-sized viewports:

**Movie card click → open movie details in a new browser tab**

Do NOT open the current modal.

The new tab should contain a proper full-page movie-details experience.

---

# 14. Recommended Mobile Detail Page

Create a reusable detail page, for example:

```text
movie.html?id=<movie-id>
```

or an equivalent route if the implementation prefers the existing app shell.

Example:

```text
/movie.html?id=dune-part-two
```

The page must:

- load the requested movie
- display poster/backdrop
- title
- tagline
- rating
- year
- duration
- genres
- director
- cast
- overview
- Watch Trailer
- Add to Watchlist
- trailer-unavailable toast
- proper loading/error state

Do not duplicate the entire movie dataset inside `movie.html`.

Reuse:

```js
js/data/movies.js
```

and shared components where possible.

---

# 15. Mobile Click Detection

The movie-card click handler currently sends every click to the modal.

Change the behavior so the event handler determines the viewport.

Preferred approach:

```js
const isMobile = window.matchMedia('(max-width: 767px)').matches;
```

Use the project's existing breakpoint system if it has a better established breakpoint.

### Mobile

```js
window.open(
  `./movie.html?id=${encodeURIComponent(movie.id)}`,
  '_blank',
  'noopener,noreferrer'
);
```

### Desktop

```js
movieModal.open(movie, card);
```

Important:

- Open the new tab directly from the user click event.
- Do not use a delayed `setTimeout()` before `window.open()`.
- Prevent popup-blocker issues.
- Make the destination accessible and functional even if JavaScript navigation fails where practical.

---

# 16. Keyboard Behavior

The existing movie cards support:

- Enter
- Space

Maintain this.

For keyboard activation:

- Desktop → modal.
- Mobile → new movie details tab/page.

The behavior should match mouse/touch interaction.

---

# 17. Mobile Detail Page UX

The mobile detail page should feel like a natural part of CineScope, not like a separate application.

Recommended structure:

```text
Header
  └── CineScope brand
      Back/Home action

Movie Hero
  ├── backdrop
  ├── gradient overlay
  └── movie title

Movie Information
  ├── poster
  ├── rating
  ├── year
  ├── duration
  ├── genres
  ├── tagline
  └── overview

Credits
  ├── director
  └── cast

Actions
  ├── Watch Trailer
  └── Add to Watchlist

Footer
```

Optimize for one-handed mobile use.

---

# 18. Feature D — Overall Design Refresh

This is a **refinement**, not a complete redesign.

Keep CineScope's current identity:

- cinematic
- clean
- modern
- dark/light theme
- red/accent brand language
- strong typography
- card-based movie discovery

Do not introduce:

- random gradients
- excessive glassmorphism
- huge unnecessary animations
- generic SaaS UI
- excessive shadows
- unrelated color palettes

---

# 19. Suggested UI Improvements

Review and improve:

### Navbar

- Better spacing.
- Better mobile alignment.
- More polished search field.
- Stronger active navigation state.
- Consistent icon sizing.
- Ensure controls remain comfortable for touch.

### Movie Cards

With 216+ movies:

- improve hover/focus state
- maintain consistent poster aspect ratio
- prevent description overflow
- improve title truncation where necessary
- keep cards visually lightweight
- make touch interaction obvious
- ensure keyboard focus is visible

### Filter/Sort Area

Make it easier to scan with a large catalog.

Consider:

- stronger section hierarchy
- better spacing
- clearer active genre pill
- better select/dropdown appearance
- result count

The result count should dynamically reflect the filtered list.

Example:

```text
Showing 42 of 216 movies
```

### Hero Section

Keep the current hero concept.

Improve only where needed:

- responsive spacing
- typography
- CTA hierarchy
- image readability
- mobile layout

Do not make the hero consume excessive vertical space on mobile.

---

# 20. Large Catalog Performance

216 movies is not huge, but the application should still behave smoothly.

Keep/use:

- `DocumentFragment`
- event delegation
- lazy-loaded poster images
- efficient filtering
- debounced search
- minimal DOM work

Avoid:

- individual event listeners on every card when delegation works
- unnecessary re-fetching
- rendering duplicate hidden copies of the entire catalog
- expensive layout-triggering JavaScript

If useful, improve rendering without introducing a framework.

---

# 21. Search Requirements

Search must work across the expanded catalog.

At minimum search:

- title
- director
- cast
- genres

Search should remain case-insensitive.

Test:

- exact title
- partial title
- director name
- actor name
- genre
- no result
- clearing search

The existing debounce behavior should be preserved unless there is a clear reason to improve it.

---

# 22. Filter Requirements

Genre filtering must work with the expanded dataset.

The available genre list should be generated/updated from the actual dataset where practical.

Avoid manually maintaining a stale genre list if a reliable derived approach fits the current architecture.

Do not break the existing:

- All
- Action
- Adventure
- Animation
- Comedy
- Crime
- Drama
- Sci-Fi
- Thriller

behavior.

If new genres are introduced, add them intelligently.

---

# 23. Sorting Requirements

Existing sorting must continue to work:

- Highest Rated
- Newest
- Title A–Z
- Title Z–A

Validate sorting against the 216+ movie catalog.

---

# 24. Watchlist Compatibility

The existing watchlist uses localStorage.

Do not break it.

The watchlist must continue to work from:

- desktop modal
- mobile movie-details page

Existing saved movie IDs must remain compatible.

---

# 25. Error Handling

Add graceful handling for:

### Invalid movie ID

Show:

```text
Movie not found
```

with a clear return/home action.

### Missing poster

Use the existing fallback poster.

### Missing backdrop

Fall back to poster or a sensible placeholder.

### Missing trailer

Show the toast.

### Trailer iframe failure

Show a useful non-blocking error message.

### Data generation/API failure

The app itself should still work with the last successfully generated static dataset.

---

# 26. Backend/Data Engineer Responsibilities

The backend/data role should:

1. Design the movie-data generation pipeline.
2. Add environment-variable support.
3. Add TMDB integration.
4. Enrich movies with `tmdbId`.
5. Retrieve trailer metadata.
6. Generate deterministic static data.
7. Add caching where useful.
8. Never expose credentials to the frontend.
9. Document required environment variables.
10. Make the process repeatable.

Suggested files:

```text
scripts/
  generate-movie-catalog.mjs

data/
  movies.generated.js
```

The exact structure can be adapted to the existing repository.

---

# 27. Frontend Engineer Responsibilities

The frontend role should:

1. Integrate the expanded movie catalog.
2. Fix mobile search icon alignment.
3. Implement responsive desktop/mobile movie-opening behavior.
4. Implement the movie-details page.
5. Replace fake trailer alert with real trailer player.
6. Implement toast notifications.
7. Preserve watchlist behavior.
8. Preserve search/filter/sort.
9. Improve responsive styling.
10. Keep accessibility intact.

---

# 28. UI/UX Engineer Responsibilities

Review every changed screen:

### Desktop

- Navbar
- Hero
- Filters
- Movie grid
- Modal
- Trailer player
- Toast

### Mobile

- Navbar
- Mobile drawer
- Search
- Movie grid
- Movie details page
- Trailer player
- Toast

Check:

- spacing
- hierarchy
- touch targets
- readability
- focus states
- dark/light theme
- animation restraint

---

# 29. QA Engineer Responsibilities

Do not consider the work finished just because the code compiles.

Test:

## Desktop

- Chrome
- Edge
- Firefox where available
- movie card → modal
- modal close
- ESC
- watchlist
- trailer
- missing trailer toast
- search
- filters
- sorting
- theme toggle

## Mobile

Test common widths:

- 320px
- 360px
- 375px
- 390px
- 414px
- 768px

Verify:

- search icon alignment
- movie card click opens a new tab
- modal does NOT open from mobile card click
- new movie detail page works
- trailer works
- missing trailer toast works
- watchlist works
- navigation works

## Accessibility

Verify:

- keyboard navigation
- visible focus
- modal focus trap on desktop
- ESC behavior
- proper labels
- toast announcement
- sensible heading hierarchy
- sufficient contrast
- reduced-motion behavior

---

# 30. Data Validation Checklist

After generating the catalog, run a validation script.

Validate:

```text
Total movies >= 216
Unique IDs = total movies
No duplicate TMDB IDs
Title is present
Year is valid
Rating is numeric
Genres is a non-empty array
Poster URL is present
Description/overview is present
```

Trailer validation:

```text
If trailerKey exists:
  trailerKey must be a real YouTube video key
  trailerSource === "youtube"
```

If no trailer:

```text
trailerKey === null
```

Do not remove movies just because they do not have trailers. They should remain searchable and viewable.

---

# 31. Do Not Make Trailer Availability a Hard Requirement for Movie Inclusion

A movie without a YouTube trailer is still a valid movie record.

Example:

```js
{
  title: "Some Movie",
  trailerKey: null,
  trailerSource: null
}
```

When the user clicks Watch Trailer:

```text
Trailer not available
We couldn't find a YouTube trailer for this movie.
```

That is the expected behavior.

---

# 32. Netlify Deployment Requirement

The current project is deployed on Netlify.

Ensure the final implementation works on Netlify.

If server-side API functionality is needed, prefer a Netlify-compatible serverless function architecture rather than assuming the local `server.js` process will run in production.

For example:

```text
netlify/
  functions/
    trailer.js
```

Only introduce a serverless function if the chosen architecture actually requires runtime API access.

For a static generated catalog, prefer resolving/enriching trailer data during the data-generation step when possible.

---

# 33. Environment Variables

If TMDB/YouTube API credentials are needed:

Use something like:

```env
TMDB_API_TOKEN=your_token_here
YOUTUBE_API_KEY=your_key_here
```

Never commit:

```text
.env
```

or real credentials.

Add:

```text
.env.example
```

with safe placeholders.

Example:

```env
TMDB_API_TOKEN=
YOUTUBE_API_KEY=
```

Document how to configure them.

---

# 34. Recommended NPM Scripts

Add only what is useful.

Possible scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "build:css": "sass scss/main.scss css/main.css --no-source-map --style=compressed",
    "watch:css": "sass scss/main.scss css/main.css --watch",
    "data:generate": "node scripts/generate-movie-catalog.mjs",
    "data:validate": "node scripts/validate-movie-catalog.mjs"
  }
}
```

Adapt these to the final architecture.

Do not add unnecessary dependencies.

---

# 35. Code Quality Rules

Continue using:

- ES modules
- Vanilla JavaScript
- SCSS
- semantic HTML
- small focused modules
- clear naming
- comments only where they provide value

Avoid:

- giant functions
- duplicated logic
- inline style hacks
- global variables without need
- deeply coupled components
- unnecessary libraries

---

# 36. Important Responsive Rule

Use the project's actual breakpoint system consistently.

Do not create five different definitions of "mobile".

There should be one clear breakpoint strategy.

For example:

```text
Mobile:
< 768px

Desktop:
>= 768px
```

If the existing project has a better established breakpoint, use that instead.

The important behavior is:

```text
Mobile/tablet → new movie-details tab/page
Desktop → existing modal
```

---

# 37. Important Trailer UX Rule

The trailer button must communicate state correctly.

If trailer exists:

```text
▶ Watch Trailer
```

If no trailer exists:

Keep the action available if the product wants a consistent layout, but clicking it should immediately show:

```text
Trailer not available
We couldn't find a YouTube trailer for this movie.
```

Do not show a fake player.

Do not show a fake "ready" message.

Do not open an empty iframe.

---

# 38. Important Mobile Navigation Rule

When a user opens a movie in a new tab:

- The new tab must be a real movie-details experience.
- It must not depend on the original tab's DOM state.
- It must work after refreshing the new tab.
- It must work when the URL is copied/shared.
- The URL must identify the movie deterministically.

Example:

```text
movie.html?id=interstellar
```

---

# 39. Final Acceptance Criteria

The implementation is complete only when all are true:

- [ ] Existing 16 movies still exist.
- [ ] At least 200 new unique movies were added.
- [ ] Total catalog is approximately 216+.
- [ ] All movies render correctly.
- [ ] Search works across the expanded catalog.
- [ ] Genre filtering works.
- [ ] Sorting works.
- [ ] Watchlist still works.
- [ ] Mobile search icon is correctly aligned.
- [ ] Desktop movie click still opens the modal.
- [ ] Mobile/tablet movie click opens a new tab.
- [ ] New movie detail page works after refresh.
- [ ] Existing movies also work on the new detail page.
- [ ] Real YouTube trailers play when available.
- [ ] No fake trailer IDs are used.
- [ ] Missing trailers show a toast.
- [ ] Trailer player cleans itself up when closed.
- [ ] Dark theme works.
- [ ] Light theme works.
- [ ] Responsive layout works.
- [ ] Keyboard navigation works.
- [ ] Accessibility behavior remains strong.
- [ ] No API secrets are exposed.
- [ ] Netlify deployment remains functional.
- [ ] CSS is rebuilt.
- [ ] Data validation passes.
- [ ] No obvious console errors remain.

---

# 40. Final Execution Order

Execute in exactly this order unless the existing codebase requires a small dependency adjustment:

### Step 1
Audit the existing repository and run the application.

### Step 2
Fix the mobile search icon alignment.

### Step 3
Design and implement the movie-data generation pipeline.

### Step 4
Generate approximately 200 additional high-quality movies.

### Step 5
Preserve and normalize the existing 16 movies.

### Step 6
Enrich all movies with TMDB IDs and trailer metadata.

### Step 7
Add trailer player and toast components.

### Step 8
Replace the existing fake trailer `alert()` behavior.

### Step 9
Implement the reusable movie-details page.

### Step 10
Change responsive movie-card behavior:

```text
Desktop → modal
Mobile/tablet → new tab
```

### Step 11
Refine the visual design.

### Step 12
Run data validation.

### Step 13
Run application/build tests.

### Step 14
Test desktop and mobile manually.

### Step 15
Fix all discovered issues.

### Step 16
Run the final production build.

### Step 17
Confirm Netlify compatibility.

### Step 18
Update documentation/README where needed.

---

# 41. Final Instruction to the Implementing Agent

You are not being asked to produce a conceptual proposal.

You are being asked to **implement the complete update in the existing CineScope repository**.

Work like a senior product engineering team:

1. Inspect first.
2. Plan internally.
3. Implement incrementally.
4. Reuse existing architecture.
5. Validate every major feature.
6. Fix regressions before moving on.
7. Do not stop to ask for approval after each phase.
8. Do not leave TODO placeholders for core requirements.
9. Do not fake data, trailer IDs, or functionality.
10. Finish with a working, production-ready implementation.

If a technical decision has multiple valid options, choose the option that:

- requires the least unnecessary architectural change,
- protects API credentials,
- works on Netlify,
- preserves the current CineScope design,
- is easy to maintain,
- and provides the best responsive UX.

The final result should feel like a **polished second version of the existing CineScope**, not a completely different project.

---

## Reference Links

- CineScope repository: https://github.com/tawhidzihad/cinescope
- CineScope live site: https://cinescope-movie-details.netlify.app/
- TMDB API getting started: https://developer.themoviedb.org/docs/getting-started
- TMDB authentication: https://developer.themoviedb.org/docs/authentication-application
- TMDB append-to-response: https://developer.themoviedb.org/docs/append-to-response
- YouTube Data API search: https://developers.google.com/youtube/v3/docs/search/list
- YouTube Data API videos: https://developers.google.com/youtube/v3/docs/videos/list
