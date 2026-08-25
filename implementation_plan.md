# Implementation Plan - Modern English Movie Discovery Website (CineScope)

Build a production-quality, responsive English Movie Discovery web application using semantic HTML5, modular SCSS (compiled to vanilla CSS), and modular Vanilla JavaScript (ES modules) with zero external frameworks, following all design, accessibility, performance, and anti-slop guidelines in `PROJECT_PROMPT.md`.

## User Review Required

> [!IMPORTANT]
> **Tech Stack & Tooling**:
> - **Language / Framework**: Vanilla HTML5, SCSS, and ES6+ JavaScript modules. No React, Vue, Angular, or Tailwind CSS.
> - **SCSS Compilation**: We will use `sass` (via npm devDependency) to compile `scss/main.scss` into `css/main.css`.
> - **Movie Catalog**: Rich, realistic English-language movie dataset with curated high-res poster and backdrop imagery, full ratings, tags, durations, cast, and directors, with fallback image handlers for resilient loading.

> [!NOTE]
> **Key UX Highlights**:
> 1. **Cinematic Dark & Clean Light Themes**: Custom CSS properties with smooth transitions, persistent `localStorage` preference, and OS `prefers-color-scheme` detection.
> 2. **Interactive Hero Section**: Featured spotlight movie with direct action CTA, dynamic backdrop, and subtle entrance motion.
> 3. **Smart Discovery Grid**: Dynamic card rendering, live debounced search, genre pill filtering, and sorting (Rating, Newest, Title A-Z).
> 4. **Animated Movie Details Modal**: Backdrop blur, smooth scale-in, complete movie metadata, keyboard `Escape` support, outside click dismiss, focus management, and scroll locking.
> 5. **Fully Responsive & Accessible**: Mobile slide-out navigation, fluid clamp typography, WCAG AA contrast, and reduced-motion media query support.

---

## Proposed Project Architecture & File Structure

```text
c:/projects/test-project/
├── index.html
├── package.json
├── assets/
│   └── images/
│       └── poster-fallback.svg
├── scss/
│   ├── abstracts/
│   │   ├── _variables.scss       # Design tokens, color palettes, spacing, shadows, breakpoints
│   │   ├── _mixins.scss          # Flex/Grid helpers, responsive breakpoints, typography clamps
│   │   └── _functions.scss       # Color/unit helper functions
│   ├── base/
│   │   ├── _reset.scss           # Modern CSS reset and box-sizing
│   │   ├── _typography.scss      # Font imports, scale, and hierarchy
│   │   └── _global.scss          # Base layout, container utilities, focus rings, reduced motion
│   ├── components/
│   │   ├── _navbar.scss          # Brand, desktop nav, mobile toggle, search bar
│   │   ├── _buttons.scss         # Primary, secondary, icon, and pill button styles
│   │   ├── _movie-card.scss      # Poster card, rating badge, hover lifts, badges
│   │   ├── _modal.scss           # Modal overlay, dialog container, backdrop blur, details layout
│   │   ├── _theme-toggle.scss    # Polished animated sun/moon toggle
│   │   ├── _filters.scss         # Genre filter pills and sort dropdown
│   │   └── _empty-state.scss     # Visual empty state for zero search results
│   ├── sections/
│   │   ├── _hero.scss            # Cinematic hero spotlight, gradient overlays, CTAs
│   │   ├── _movies.scss          # Discover movies section grid & section headers
│   │   └── _footer.scss          # Minimal clean footer with branding and links
│   └── main.scss                 # Main SCSS entrypoint
├── css/
│   └── main.css                  # Compiled production CSS
├── js/
│   ├── data/
│   │   └── movies.js             # Realistic 16+ English movies dataset with complete metadata
│   ├── components/
│   │   ├── movie-card.js         # Card DOM generation with lazy loading & rating indicators
│   │   ├── movie-modal.js        # Dynamic modal renderer, focus trap, and scroll lock
│   │   └── empty-state.js        # Clean empty-state component
│   ├── features/
│   │   ├── theme.js              # Theme manager (dark/light, local storage, system sync)
│   │   ├── search.js             # Real-time search controller with debouncing
│   │   ├── filters.js            # Genre filtering and sorting engine
│   │   └── mobile-nav.js         # Mobile drawer menu navigation toggle
│   └── main.js                   # Application coordinator & event delegation
└── README.md
```

---

## Detailed Component Specifications

### 1. Data Layer (`js/data/movies.js`)
- Comprehensive collection of top English movies across diverse genres (Sci-Fi, Action, Drama, Thriller, Comedy, Animation, Adventure).
- Schema:
  ```js
  {
    id: "dune-part-two",
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    year: 2024,
    rating: 8.6,
    votes: "480K",
    duration: "2h 46m",
    genres: ["Sci-Fi", "Adventure", "Action"],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    fullOverview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    poster: "https://...",
    backdrop: "https://...",
    featured: true
  }
  ```

### 2. SCSS Architecture & Design System (`scss/`)
- **Theme Custom Properties**:
  - Dark Theme: Deep cinematic tones (`--bg-primary: #0b0f19`, `--bg-surface: #121826`, `--bg-card: #182234`, `--accent: #e50914` / `#3b82f6` / `#f59e0b`, `--text-primary: #f8fafc`, `--text-secondary: #94a3b8`, `--border: rgba(255,255,255,0.08)`).
  - Light Theme: Refined luminous tones (`--bg-primary: #f8fafc`, `--bg-surface: #ffffff`, `--bg-card: #ffffff`, `--accent: #e50914`, `--text-primary: #0f172a`, `--text-secondary: #64748b`, `--border: rgba(0,0,0,0.08)`).
- **Typography**: Google Fonts Inter & Outfit with fluid `clamp()` sizing.
- **Mixins**: Breakpoints (`sm`, `md`, `lg`, `xl`), aspect ratio utilities, text truncation, glass effect.

### 3. Features & Logic (`js/`)
- **Theme Toggle**: Switch between Dark and Light mode with icon transitions, aria labels, and `localStorage` sync.
- **Hero Controller**: Displays a featured title with backdrop and direct "View Details" CTA opening the modal.
- **Search & Filter Manager**: Real-time filtering by search query and genre pills, combined with sorting (Rating descending, Year descending, Title ascending).
- **Modal Controller**: Accessible modal with backdrop blur, scroll locking, ESC handler, outside-click close, focus restoration, and keyboard navigation.

---

## Verification Plan

### Automated Verification
- Run Sass build script (`npx sass scss/main.scss css/main.css --no-source-map`) to ensure clean SCSS compilation with no warnings.
- Validate HTML semantics and syntax.

### Interactive Browser Verification
- Use `browser_subagent` to test the live webpage:
  1. Verify visual design in both dark and light modes.
  2. Verify Hero section presentation and CTA.
  3. Verify movie card grid layout across desktop (1440px), tablet (768px), and mobile (375px).
  4. Test live search filtering and verify instant response.
  5. Test genre pill filtering and sorting dropdown.
  6. Test modal opening on card click, verify movie details content, and test closing via Close button, Backdrop click, and `Escape` key.
  7. Verify mobile drawer menu opening and navigation.
  8. Test empty search query state ("No movies found matching 'xyz'").
