# CineScope - Modern English Movie Discovery Platform

A polished, production-quality movie discovery web application built as a **Senior Frontend Developer** project, following strict anti-slop code and design rules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 — Semantic, accessible |
| Styling | SCSS (7-1 architecture) → compiled to `css/main.css` |
| Logic | Vanilla JavaScript — ES6+ modules, zero frameworks |
| Build | `sass` CLI via npm script |
| Server | Node.js `http` module (zero dependencies) |

## Features

- **Dark & Light Theme** with smooth transitions, `localStorage` persistence, and OS preference sync
- **Cinematic Hero Spotlight** with dynamic backdrop, rating badges, and CTA
- **Dynamic Movie Grid** — all 16 cards rendered from JavaScript data (no hardcoded HTML)
- **Movie Details Modal** — animated, accessible, focus-trapped, scroll-locked, ESC-closable
- **Live Search** with 200ms debounce, across title / director / cast / genres
- **Genre Filter Pills** with active state management
- **Sort Dropdown** — Highest Rated, Newest, Title A–Z/Z–A
- **Empty State** with graceful reset action
- **Fully Responsive** — mobile drawer nav, fluid typography, adaptive grid layouts
- **WCAG 2.1 AA** — skip link, visible focus rings, ARIA labels, semantic HTML

## Project Structure

```
├── index.html                    # Semantic, accessible HTML5 entry point
├── server.js                     # Lightweight Node.js dev server (no deps)
├── package.json
├── assets/
│   └── images/
│       └── poster-fallback.svg   # SVG fallback for failed poster images
├── scss/
│   ├── abstracts/
│   │   ├── _variables.scss       # Design tokens, breakpoints, spacing scale
│   │   ├── _mixins.scss          # Breakpoint, flex, clamp, scrollbar mixins
│   │   └── _functions.scss       # rem() helper
│   ├── base/
│   │   ├── _reset.scss           # Modern CSS reset
│   │   ├── _typography.scss      # Fluid clamp() type scale
│   │   └── _global.scss          # Theme custom properties, container, focus ring
│   ├── components/
│   │   ├── _buttons.scss         # Primary, secondary, glass, icon, sm variants
│   │   ├── _navbar.scss          # Desktop nav, mobile drawer, search bar
│   │   ├── _theme-toggle.scss    # Animated sun/moon toggle
│   │   ├── _movie-card.scss      # Poster card with hover effects & badges
│   │   ├── _modal.scss           # Accessible movie details dialog
│   │   ├── _filters.scss         # Genre pills & sort toolbar
│   │   └── _empty-state.scss     # Zero results visual feedback
│   ├── sections/
│   │   ├── _hero.scss            # Cinematic hero spotlight
│   │   ├── _movies.scss          # Discovery section & responsive grid
│   │   └── _footer.scss          # Brand footer with tech stack badges
│   └── main.scss                 # SCSS entry — imports in cascade order
├── css/
│   └── main.css                  # Compiled & compressed production CSS
└── js/
    ├── data/
    │   └── movies.js             # 16 realistic English films catalog + genres
    ├── components/
    │   ├── movie-card.js         # Card DOM factory with lazy loading
    │   ├── movie-modal.js        # Modal controller — focus trap, watchlist
    │   └── empty-state.js        # Empty state component factory
    ├── features/
    │   ├── theme.js              # Theme manager — dark/light + system sync
    │   ├── search.js             # Debounced search controller
    │   ├── filters.js            # Genre + sort filter engine
    │   └── mobile-nav.js         # Mobile drawer toggle manager
    └── main.js                   # App coordinator & event delegation root
```

## Running Locally

```bash
npm install      # Install sass compiler
npm run build:css  # Compile SCSS → css/main.css
npm start        # Start local server on http://localhost:3000
```

## Design Principles

- **No SLOP**: Every visual element has a clear purpose — no random gradients, no generic hero templates, no excessive glassmorphism.
- **No framework dependencies**: Zero React, Vue, Angular, or Tailwind CSS.
- **Separation of concerns**: Data, components, and features are clearly separated across modules.
- **Accessibility first**: Keyboard navigation, ARIA labels, focus management, and `prefers-reduced-motion` support throughout.
- **Performance**: Event delegation on the cards grid, CSS transitions preferred over JS, lazy loading on all poster images, DocumentFragment for batch DOM insertions.

## Live Link
[Visit CineScope](https://cinescope-movie-details.netlify.app/)