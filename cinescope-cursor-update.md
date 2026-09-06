# CineScope — Cursor Implementation Update

## Project

- Repository: https://github.com/tawhidzihad/cinescope
- Live site: https://cinescope-movie-details.netlify.app/
- Role: **Senior Frontend Developer**
- Editor/Agent: **Cursor**
- Stack: preserve the existing Vanilla JavaScript + HTML5 + SCSS architecture.

This is an implementation specification. Do not only explain the solution. Inspect the repository, implement the requirements, test them, and clean up the code.

---

# 1. First: Audit the Existing Project

Before editing anything:

1. Inspect the complete repository structure.
2. Inspect `index.html`, `package.json`, `server.js`, `js/`, `scss/`, `css/`, `assets/`, and any existing configuration.
3. Understand:
   - movie data structure
   - movie rendering
   - search
   - filters
   - sorting
   - movie details
   - watchlist
   - trailer behavior
   - theme
   - responsive layout
4. Identify unused JavaScript, SCSS, CSS, assets, experimental files, debug code, and stale AI-generated files.
5. Do not delete anything until you verify it is genuinely unused.
6. Make a concise implementation plan internally, then execute it without waiting for approval.

Do **not** migrate the project to React, Vue, Angular, Tailwind, or another framework.

---

# 2. Current Movie Catalog

The project currently contains approximately **250 movies**.

Keep the complete catalog.

Do not remove movies merely to make pagination easier.

The final application must continue to provide the full movie collection.

---

# 3. Pagination — 6 Movies Per Page

Add client-side pagination to the movie catalog.

## Required behavior

Display exactly:

**6 movies per page**

when at least 6 results exist.

For approximately 250 movies this will produce roughly 42 pages.

Do **not** render all 250 movie cards and hide most of them with CSS.

Only the current page's movies should be rendered into the movie grid.

---

# 4. Pagination With Ellipsis

Because there are many pages, do not render every page number.

The pagination must use an ellipsis strategy.

Examples:

```text
Previous  1  2  3  4  5  ...  42  Next
```

Middle:

```text
Previous  1  ...  19  20  21  22  23  ...  42  Next
```

End:

```text
Previous  1  ...  38  39  40  41  42  Next
```

The exact visible range may be adjusted for the design, but:

- first page must always be reachable
- last page must always be reachable
- current page must always be visible
- nearby pages should be visible
- ellipsis must represent a hidden range
- ellipsis must not be clickable
- no unnecessary duplicate numbers
- Previous disabled on first page
- Next disabled on last page

---

# 5. Pagination Component

Keep pagination logic separate from the application coordinator.

Prefer a reusable component such as:

```text
js/components/pagination.js
```

or another location consistent with the existing project.

It should handle:

- page calculation
- visible page ranges
- ellipsis
- Previous/Next
- active page
- disabled states
- page-change events

Do not put all pagination logic inside `main.js`.

---

# 6. Correct Data Flow

Pagination must happen **after** search, filtering, and sorting.

Correct:

```text
All Movies
   ↓
Search
   ↓
Genre Filter
   ↓
Sort
   ↓
Pagination
   ↓
Render 6 Movies
```

Never do this:

```text
All Movies
   ↓
Take first 6
   ↓
Search/filter/sort
```

Search and filters must operate over the complete ~250 movie dataset.

---

# 7. Reset Pagination When Results Change

Whenever search, genre, or sorting changes, reset to page 1 where appropriate.

Examples:

```text
Search changes → page 1
Genre changes → page 1
Sort changes → page 1
```

If the current page becomes invalid because the result set becomes smaller, clamp it to the last valid page.

Never leave the user on an empty page when valid results exist.

---

# 8. Result Count

Show a useful dynamic result count.

Examples:

```text
Showing 1–6 of 250 movies
```

```text
Showing 7–12 of 250 movies
```

After filtering:

```text
Showing 1–6 of 18 movies
```

The count must always match the filtered/sorted dataset.

---

# 9. Pagination + Empty State

If there are no results:

```text
Movie grid → empty state
Pagination → hidden
```

If there is only one page, do not show unnecessary pagination controls.

If there are multiple pages, show pagination.

---

# 10. Pagination Accessibility

Use semantic pagination navigation:

```html
<nav aria-label="Movie pagination">
```

The current page must have:

```html
aria-current="page"
```

Previous/Next must have clear accessible labels.

Disabled controls must expose their disabled state.

Ellipsis must not be treated as a button.

Keyboard focus must remain visible.

---

# 11. Pagination on Mobile

Pagination must remain usable on small screens.

Do not allow dozens of buttons to overflow horizontally.

A compact mobile pattern is acceptable, for example:

```text
‹  1  ...  20  21  22  ...  42  ›
```

or an equivalent clean responsive design.

Test at:

```text
320px
360px
375px
390px
414px
```

There must be no horizontal page overflow.

---

# 12. Movie Data Quality — Important

A major current problem is incorrect poster data.

I have noticed that many movies are incorrectly using the same **Oppenheimer poster** or another unrelated poster.

Fix the entire dataset.

Each movie must use the poster belonging to that exact movie.

Do **not** simply replace one shared URL with another random URL.

---

# 13. Original / Correct Movie Data

Review the approximately 250 movie records.

For every movie, verify as much as the current schema supports:

- title
- release year
- poster
- backdrop
- rating
- genres
- director
- cast
- overview/description
- runtime
- TMDB ID
- trailer information

The metadata must actually belong to that movie.

Do not fabricate movie information.

Do not associate one movie's poster with another movie.

Do not use random Google Image URLs.

---

# 14. Preferred Data Source

Use **TMDB** as the preferred authoritative movie-data source:

https://www.themoviedb.org/

Documentation:

https://developer.themoviedb.org/

Where possible, use stable TMDB IDs and correct TMDB poster paths.

If the existing movie schema already contains stable IDs used by watchlists or URLs, preserve them unless there is a compelling reason to migrate them.

---

# 15. Poster Validation

Audit the complete dataset for:

- duplicated poster URLs
- incorrect poster/movie combinations
- missing posters
- malformed URLs
- broken images
- accidental placeholder images
- Oppenheimer poster reused for unrelated movies

A fallback poster can remain for genuinely unavailable images.

But the fallback must not replace a real poster when the correct poster exists.

---

# 16. Movie Card Images

Movie cards should continue to use lazy loading.

Use useful alt text:

```html
<img
  src="..."
  alt="Poster for Inception"
  loading="lazy"
/>
```

Do not use the same generic alt text for every movie.

Images should have a stable aspect ratio to prevent layout shift.

Gracefully handle image-loading errors.

---

# 17. Mobile Movie Grid — 2 Columns

The mobile design currently shows one movie per row.

Change this.

On mobile, show **2 movies side-by-side**.

Expected:

```text
┌────────┐ ┌────────┐
│ Movie 1│ │ Movie 2│
│        │ │        │
└────────┘ └────────┘

┌────────┐ ┌────────┐
│ Movie 3│ │ Movie 4│
│        │ │        │
└────────┘ └────────┘
```

Use CSS Grid rather than hard-coded widths.

A suitable starting point is:

```css
.movies-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

Adapt it to the existing SCSS/design system.

---

# 18. Responsive Grid

Use a sensible responsive strategy:

```text
Desktop → multiple columns based on available width
Tablet → 3 columns where appropriate
Mobile → 2 columns
```

The exact desktop/tablet breakpoints should follow the existing project tokens where possible.

Do not create horizontal overflow.

---

# 19. Mobile Card Design

Because two cards share each row:

- preserve poster proportions
- keep card gaps consistent
- keep titles readable
- prevent title overflow
- keep rating badges compact
- keep touch interactions comfortable
- avoid excessive card padding
- avoid cards becoming visually cramped

Test all common mobile widths.

---

# 20. Overall Design Refinement

Improve the overall design without replacing the CineScope identity.

Keep it:

- cinematic
- modern
- clean
- premium
- restrained
- accessible

Review and refine:

- navbar
- search
- hero
- filter controls
- sort control
- movie cards
- movie grid
- pagination
- empty state
- movie details
- trailer UI
- footer
- mobile layout
- spacing
- typography
- buttons
- focus states

Avoid:

- excessive gradients
- excessive glassmorphism
- random animations
- generic SaaS styling
- unnecessary shadows
- excessive borders
- unrelated colors
- visual clutter

This is a refinement, not a complete redesign.

---

# 21. Loading State — Required

Add a polished loading state.

Do not use only:

```text
Loading...
```

Prefer a movie-card skeleton loading UI that matches the existing CineScope design.

Example:

```text
┌──────────┐ ┌──────────┐
│          │ │          │
│ skeleton │ │ skeleton │
│  poster  │ │  poster  │
│          │ │          │
├──────────┤ ├──────────┤
│ ████████ │ │ ████████ │
│ ██████   │ │ ██████   │
└──────────┘ └──────────┘
```

The exact design is up to you.

It should feel like a real product loading state.

---

# 22. Loading State Behavior

Show loading UI when there is an actual asynchronous operation, such as:

- initial asynchronous movie-data preparation
- movie details loading
- trailer/data loading where applicable

Do **not** add artificial delays just to display a loader.

If pagination is a synchronous local array operation, do not pretend it is asynchronous.

A reusable component such as:

```text
js/components/loading-state.js
```

is preferred if it fits the current architecture.

---

# 23. Loading Accessibility

Use an appropriate live/status region.

For example:

```html
<div
  class="loading-state"
  role="status"
  aria-live="polite"
  aria-label="Loading movies"
>
```

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

If a skeleton shimmer is used, reduce/disable the animation for reduced-motion users.

---

# 24. 404 Page — Required

Add a proper CineScope-branded 404 page.

It must not look like a browser default error page.

Suggested structure:

```text
404

Page not found

The page you're looking for doesn't exist or may have been moved.

Back to Home
```

Improve the copy if appropriate.

Include a clear primary CTA to return home.

---

# 25. 404 Design

The 404 page should:

- use CineScope branding
- work in light and dark themes
- be responsive
- have a clear heading hierarchy
- have an obvious home action
- feel consistent with the rest of the application
- avoid unnecessary visual clutter

---

# 26. 404 Routing / Deployment

Inspect the current `server.js` and Netlify setup.

Make the 404 experience work in local development and Netlify.

If Netlify requires a redirect/fallback configuration, add the appropriate configuration.

Do not assume local Node routing and Netlify routing behave identically.

---

# 27. Preserve Existing Features

Do not break:

- search
- genre filters
- sorting
- theme toggle
- watchlist
- movie details
- trailer behavior
- desktop modal behavior
- mobile movie-details behavior
- mobile navigation
- accessibility

If an existing implementation is broken, fix it while implementing this update.

---

# 28. Search Must Work Across All Movies

Search the full dataset.

Correct:

```text
250 movies
   ↓
Search all 250
   ↓
Results
   ↓
Pagination
```

Incorrect:

```text
250 movies
   ↓
Current 6
   ↓
Search only 6
```

Search should continue to work for:

- title
- director
- cast
- genres

according to the existing implementation.

---

# 29. Filters Must Work Before Pagination

Genre filtering must operate over the full dataset.

Example:

```text
All Movies
   ↓
Genre Filter
   ↓
Sort
   ↓
Pagination
```

Pagination must always be the final data-selection step before rendering.

---

# 30. Sorting Must Work Before Pagination

Sorting must operate over the complete filtered/search result set.

Correct:

```text
250 movies
   ↓
Sort
   ↓
Take current page's 6
```

Incorrect:

```text
Take first 6
   ↓
Sort only those 6
```

---

# 31. State

Keep state simple.

A suitable model could be:

```js
{
  movies,
  searchQuery,
  selectedGenre,
  sortBy,
  currentPage,
  moviesPerPage: 6
}
```

Do not introduce Redux/Zustand/etc.

Keep state transitions predictable.

---

# 32. Code Architecture

Keep responsibilities separated.

Prefer:

```text
js/
  data/
  components/
  features/
  main.js
```

Pagination should not become a giant block inside `main.js`.

Loading should be isolated if useful.

Movie data should remain separate from rendering logic.

Do not duplicate the movie dataset inside HTML or components.

---

# 33. Clean Code — Required

Remove genuinely unused code.

Audit for:

- unused JS files
- unused imports
- unused functions
- unused variables
- unreachable branches
- duplicate helpers
- obsolete event listeners
- stale debug code
- unnecessary `console.log`
- obsolete comments
- unused SCSS partials
- dead CSS selectors
- old experimental files
- unused assets
- unnecessary dependencies

Do not delete a file just because it is not imported directly. Verify it is truly unused first.

---

# 34. SCSS/CSS Cleanup

Audit the existing 7-1 SCSS architecture.

Remove:

- duplicate selectors
- conflicting overrides
- obsolete media queries
- unused variables
- unused mixins
- temporary hacks
- redundant magic numbers

Keep the architecture organized.

Do not collapse all styling into one huge file.

---

# 35. JavaScript Cleanup

Keep modules focused.

Avoid:

- giant functions
- duplicated logic
- global state everywhere
- repeated DOM queries
- duplicate event listeners
- inline styling hacks
- unnecessary abstractions

Use event delegation where appropriate.

---

# 36. Performance

Pagination should improve performance.

Only render 6 movie cards at a time.

Continue using:

- lazy-loaded images
- event delegation
- DocumentFragment where appropriate
- efficient filtering/search
- minimal DOM updates

Do not render all 250 cards and hide most of them.

Do not create hundreds of unnecessary event listeners.

Do not add artificial loading delays.

---

# 37. Page Change UX

When the user changes page:

1. Update the current page.
2. Render the new 6 movies.
3. Update the pagination UI.
4. Update the result count.
5. Scroll to the movie-results section when appropriate.

Prefer scrolling to the results section rather than blindly scrolling to the absolute top of the document.

Respect reduced-motion preferences.

---

# 38. URL State (Optional)

If the existing architecture benefits from it, pagination may use:

```text
?page=2
```

But do not add URL complexity unnecessarily.

If URL pagination is implemented:

- refresh should preserve the page
- invalid values should be handled
- search/filter changes should reset page appropriately

---

# 39. Testing Requirements

After implementation, test:

## Pagination

- page 1
- page 2
- middle pages
- final page
- Previous
- Next
- first page
- last page
- ellipsis
- disabled states

## Search

- exact title
- partial title
- director
- actor
- genre
- no results
- clear search

## Filters

- each major genre
- reset/all
- filters + pagination

## Sorting

- highest rated
- newest
- A–Z
- Z–A
- sorting + pagination

## Combined behavior

Test:

```text
Search + Filter + Sort + Pagination
```

The result must remain correct.

---

# 40. Responsive Testing

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

- two-column mobile grid
- pagination
- ellipsis
- search
- filters
- movie cards
- modal/details
- loading state
- 404
- navigation
- no horizontal overflow

---

# 41. Browser Testing

Verify in modern:

- Chrome
- Edge
- Firefox

Check the browser console for:

- JavaScript errors
- module errors
- failed assets
- broken image requests
- duplicate listeners
- pagination exceptions

---

# 42. Build Verification

Run the project's actual commands.

At minimum, verify the equivalent of:

```bash
npm install
npm run build:css
npm start
```

Do not assume these exact scripts exist; inspect `package.json` and use the correct project commands.

The final SCSS/CSS build must succeed.

---

# 43. Data Validation

Before finishing, verify:

- approximately 250 movie records remain
- IDs are unique
- titles are present
- posters are present where expected
- posters map to the correct movies
- unrelated movies do not share the same poster accidentally
- Oppenheimer's poster is not reused incorrectly
- years are valid
- ratings are valid
- genres are valid
- existing watchlist identifiers remain compatible

Do not silently remove movies to hide data problems.

Fix the underlying data.

---

# 44. Acceptance Criteria

The implementation is complete only when:

- [ ] ~250 movies remain available.
- [ ] All movies are no longer rendered on one page.
- [ ] 6 movies are displayed per page.
- [ ] Pagination works.
- [ ] Pagination uses ellipsis for large page counts.
- [ ] First/last pages are accessible.
- [ ] Previous/Next work.
- [ ] Pagination is mobile-friendly.
- [ ] Search works across the entire dataset.
- [ ] Filters work across the entire dataset.
- [ ] Sorting works across the entire dataset.
- [ ] Search/filter/sort correctly reset or clamp pagination.
- [ ] Result count is accurate.
- [ ] Empty state works.
- [ ] Incorrect/reused Oppenheimer posters are fixed.
- [ ] Movie posters correspond to their actual movies.
- [ ] Movie metadata is consistent.
- [ ] Mobile shows exactly 2 movie cards per row.
- [ ] No horizontal overflow occurs on mobile.
- [ ] A polished loading state exists.
- [ ] Loading state is accessible.
- [ ] A proper 404 page exists.
- [ ] 404 is responsive and theme-compatible.
- [ ] Existing movie details still work.
- [ ] Existing trailer behavior still works.
- [ ] Existing watchlist still works.
- [ ] Existing theme still works.
- [ ] Existing navigation still works.
- [ ] Unused/dead code has been removed safely.
- [ ] Unused CSS/SCSS has been cleaned.
- [ ] No unnecessary files remain.
- [ ] No obvious console errors remain.
- [ ] CSS build succeeds.
- [ ] Local application runs successfully.
- [ ] Netlify compatibility is preserved.

---

# 45. Final Senior Developer Instruction

Do not stop after writing a plan.

Do not ask for approval between implementation steps.

Do not provide a conceptual answer instead of changing the code.

Work directly in the repository.

Use this order:

```text
Audit
  ↓
Data audit
  ↓
Fix movie metadata/posters
  ↓
Pagination
  ↓
Search/filter/sort integration
  ↓
Mobile 2-column grid
  ↓
Loading state
  ↓
404 page
  ↓
Design refinement
  ↓
Code cleanup
  ↓
Testing
  ↓
Build verification
  ↓
Final review
```

Use the smallest clean architectural changes necessary.

Preserve existing features.

Do not fabricate movie data.

Do not fabricate poster URLs.

Do not render all 250 movies and hide them with CSS.

Do not paginate before search/filter/sort.

Do not add unnecessary frameworks or dependencies.

Finish the implementation only after the acceptance criteria above have been verified.

The final result should look and behave like a **professionally maintained second version of CineScope**, not an AI-generated rewrite.
