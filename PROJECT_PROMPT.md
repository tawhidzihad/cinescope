# 🎬 Movie Website — Senior Frontend Developer Project Prompt

You are working as a **Senior Frontend Engineer and UI/UX-focused Web Developer**.

Build a polished, modern, responsive **English Movie Discovery Website** using:

* HTML5
* SCSS
* Vanilla JavaScript
* No React
* No Vue
* No Angular
* No Tailwind CSS
* No UI framework

The website should feel like a professionally designed production-quality movie platform, not a basic demo project.

---

## 1. Core Concept

Create a movie website where users can browse English-language movies.

Each movie should display:

* Movie poster/image
* Movie title
* Short description
* Rating
* Optional release year
* Optional genre/category

The website should have a visually impressive movie-card-based interface.

The overall experience should feel similar to a modern streaming/movie discovery platform, while maintaining an original design.

---

# 2. Design Direction

The design must be:

* Modern
* Premium
* Minimal
* Cinematic
* Clean
* Professional
* Responsive
* Visually balanced

Use a strong visual hierarchy.

Do not make the interface unnecessarily complicated.

The design should prioritize:

1. Movie artwork
2. Movie title
3. Rating
4. Short description
5. Easy interaction

Use appropriate spacing, typography, shadows, borders, gradients and subtle visual effects.

The website should look intentionally designed rather than generated from a generic template.

---

# 3. Theme System

Implement both:

* Dark mode
* Light mode

Provide a clear theme toggle in the navbar.

### Dark mode

Dark mode should feel cinematic.

Use:

* Dark background
* High contrast text
* Subtle borders
* Soft shadows
* Cinematic gradients

### Light mode

Light mode should remain clean and elegant.

Do not simply invert the dark theme.

Both themes should have their own properly considered visual hierarchy.

Use **CSS custom properties** for theme-related values.

Example concept:

```scss
:root {
    --bg-primary: ...;
    --bg-secondary: ...;
    --text-primary: ...;
    --text-secondary: ...;
    --accent: ...;
}
```

The actual design decisions are up to you.

Persist the selected theme using `localStorage`.

Respect the user's system preference when no theme has previously been selected.

---

# 4. Page Structure

Create a polished single-page movie discovery experience.

Suggested structure:

## Navbar

Include:

* Logo / brand name
* Navigation links
* Search control
* Theme toggle

The navbar should be responsive.

On smaller screens, use an animated mobile navigation menu.

---

## Hero Section

Create an attractive cinematic hero section.

It should include:

* Large headline
* Short supporting text
* CTA button
* Featured movie visual/background

The hero should not overpower the movie browsing experience.

Add subtle entrance animations.

---

## Movie Section

Create a movie discovery section containing movie cards.

Possible heading:

> Discover Movies

Include a clean layout for browsing movies.

The section should work beautifully across:

* Desktop
* Tablet
* Mobile

---

# 5. Movie Cards

Each movie card should contain:

* Movie poster
* Movie title
* Rating
* Short description
* Genre/year if appropriate

Cards should have polished hover interactions.

For example:

* Slight scale animation
* Image zoom
* Overlay gradient
* Rating emphasis
* Subtle shadow
* Smooth transition

Do NOT over-animate the cards.

Animations should feel intentional and premium.

---

# 6. Movie Details Overlay

This is one of the most important interactions.

When the user clicks a movie card:

**Do not navigate to another page.**

Instead, open an animated movie-details overlay/modal.

The overlay should contain:

* Large movie poster
* Movie title
* Rating
* Release year
* Genre
* Short description
* Additional movie information if available
* Close button

The overlay should appear with a smooth animation.

Suggested animation flow:

1. Background overlay fades in.
2. Movie details panel slightly scales/fades into view.
3. Content enters smoothly.
4. Closing reverses the animation.

The background behind the modal should become visually subdued.

---

## Modal Interaction Requirements

The user should be able to close the modal by:

* Clicking the close button
* Clicking outside the modal
* Pressing `Escape`

Prevent unnecessary page scrolling while the modal is open.

Restore scrolling when the modal closes.

The modal should be fully responsive.

On mobile, the modal should adapt naturally to the viewport instead of behaving like a desktop dialog squeezed into a small screen.

---

# 7. Animation System

Animations are required.

Use **CSS transitions/animations and Vanilla JavaScript**.

Do not use an animation library unless there is a genuinely strong reason.

Include subtle animations for:

* Page entrance
* Hero content
* Navbar
* Movie cards
* Card hover
* Modal opening
* Modal closing
* Theme switching
* Mobile menu
* Buttons
* Interactive elements

Animations must be:

* Smooth
* Short
* Purposeful
* Consistent

Avoid excessive animation.

Do not make the website feel like a motion demo.

Also respect:

```css
@media (prefers-reduced-motion: reduce)
```

Reduce or disable non-essential animations for users who prefer reduced motion.

---

# 8. Movie Data

Keep movie data separate from the UI logic.

Use a JavaScript data structure such as:

```js
const movies = [
    {
        id: 1,
        title: "...",
        description: "...",
        rating: 8.5,
        year: 2024,
        genre: "...",
        image: "...",
    },
];
```

Use realistic English-language movie data.

Do not hardcode every movie card manually in HTML.

Render movie cards dynamically using JavaScript.

The movie details overlay should also be populated dynamically from the selected movie object.

---

# 9. Search

Add movie search functionality.

Users should be able to search movies by title.

Search should:

* Update results dynamically
* Be case-insensitive
* Handle empty searches gracefully
* Show a proper empty-state message when no movie matches

Do not write unnecessary complex search logic.

Keep it readable and maintainable.

---

# 10. Filtering / Sorting

If appropriate, include simple movie filtering or sorting.

Possible options:

* All
* Action
* Drama
* Sci-Fi
* Thriller
* Comedy

And/or:

* Highest Rated
* Newest
* A-Z

Only implement features that genuinely improve the UX.

Do not add features just to increase code size.

---

# 11. SCSS Architecture

Use SCSS properly.

Do NOT create one massive SCSS file containing everything.

Organize styles logically.

For example:

```text
scss/
├── abstracts/
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── _functions.scss
│
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _global.scss
│
├── components/
│   ├── _navbar.scss
│   ├── _buttons.scss
│   ├── _movie-card.scss
│   ├── _modal.scss
│   └── _theme-toggle.scss
│
├── sections/
│   ├── _hero.scss
│   └── _movies.scss
│
└── main.scss
```

Use SCSS features where they genuinely improve maintainability.

Do not use SCSS features just for the sake of using them.

---

# 12. JavaScript Architecture

JavaScript should also be organized cleanly.

Avoid creating one enormous JavaScript file with unrelated logic.

Separate responsibilities where appropriate.

For example:

```text
js/
├── data/
│   └── movies.js
│
├── components/
│   ├── movie-card.js
│   └── movie-modal.js
│
├── features/
│   ├── search.js
│   ├── theme.js
│   └── filters.js
│
└── main.js
```

Use ES modules.

Keep responsibilities separated.

Functions should have clear names.

Avoid generic names such as:

```js
doSomething()
handleIt()
processData()
function1()
```

Prefer meaningful names such as:

```js
renderMovieCards()
openMovieDetails()
closeMovieDetails()
filterMoviesByGenre()
saveThemePreference()
```

---

# 13. Accessibility

The website must be accessible.

Include:

* Semantic HTML
* Proper button elements
* Accessible labels
* Keyboard navigation
* Visible focus states
* Appropriate ARIA attributes where necessary
* Keyboard-accessible modal
* `Escape` support
* Meaningful alt text
* Good color contrast

Do not use clickable `<div>` elements when a `<button>` is the correct semantic element.

---

# 14. Responsive Design

The website must be fully responsive.

Test the design mentally and structurally for:

### Mobile

Approximately:

* 320px
* 375px
* 430px

### Tablet

Approximately:

* 768px
* 1024px

### Desktop

Approximately:

* 1280px
* 1440px
* 1920px

Do not simply shrink desktop elements.

Design layouts specifically for different screen sizes.

---

# 15. Code Quality — VERY IMPORTANT

You are expected to write code like a **senior developer**, not like an AI generating random code.

Follow these principles:

* DRY
* Single Responsibility Principle
* Separation of concerns
* Meaningful naming
* Reusable functions
* Small focused functions
* Predictable state management
* Minimal DOM manipulation
* Clean event handling
* Maintainable CSS architecture
* Consistent formatting

Comments should explain **why**, not obvious things.

Bad:

```js
// Set title
title.textContent = movie.title;
```

Good:

```js
// Keep modal content in sync with the selected movie.
title.textContent = movie.title;
```

Only add comments when they provide meaningful context.

---

# 16. ABSOLUTELY NO SLOP CODE

This rule is extremely important.

Do NOT generate:

* Duplicate code
* Repeated CSS
* Unnecessary wrappers
* Giant functions
* Giant files
* Random utility classes
* Unused variables
* Unused functions
* Dead code
* Unnecessary abstractions
* Over-engineered architecture
* Copy-pasted event listeners
* Repeated DOM queries
* Magic numbers without reason
* Meaningless comments
* AI-style verbose comments
* Fake complexity
* Code written only to increase line count

Every piece of code must have a clear purpose.

If something can be implemented cleanly with less code, prefer the simpler implementation.

---

# 17. ABSOLUTELY NO SLOP DESIGN

Do not create a generic AI-looking website.

Avoid:

* Excessive gradients
* Excessive glassmorphism
* Random glowing effects
* Huge rounded cards everywhere
* Too many colors
* Excessive shadows
* Poor typography hierarchy
* Random animations
* Overcrowded sections
* Generic hero sections
* Unnecessary badges
* Too many buttons
* Poor spacing
* Inconsistent border radius
* Inconsistent typography
* Unnecessary decorative elements

The UI should feel like it was designed by an experienced product designer.

Every visual element should have a reason.

---

# 18. No Fake Complexity

Do not add:

* Fake authentication
* Fake backend architecture
* Fake APIs
* Unnecessary classes
* Unnecessary design patterns
* State management libraries
* Framework-like abstractions
* Complex build systems

This is a frontend demo project.

Keep the technology simple:

**HTML + SCSS + Vanilla JavaScript**

But make the implementation high quality.

---

# 19. Performance

Keep the website performant.

Pay attention to:

* Image loading
* DOM size
* Event listeners
* Animations
* Layout shifts
* Unnecessary reflows
* Unnecessary JavaScript execution

Use event delegation where appropriate.

Use lazy loading for movie images when appropriate.

Prefer CSS animations for visual transitions when possible.

---

# 20. Error / Empty States

Do not leave the interface broken when there is no data.

Provide appropriate UI for:

* No search results
* Invalid movie selection
* Empty movie list
* Missing movie image

The UI should fail gracefully.

---

# 21. File Structure

Create a clean project structure similar to:

```text
movie-website/
│
├── index.html
│
├── assets/
│   ├── images/
│   └── icons/
│
├── scss/
│   ├── abstracts/
│   ├── base/
│   ├── components/
│   ├── sections/
│   └── main.scss
│
├── css/
│   └── main.css
│
├── js/
│   ├── data/
│   ├── components/
│   ├── features/
│   └── main.js
│
└── README.md
```

Adjust the structure if there is a genuinely better architecture, but do not over-engineer it.

---

# 22. Development Process

Before writing the final implementation:

1. Understand the complete requirements.
2. Plan the UI architecture.
3. Plan the JavaScript responsibilities.
4. Plan the SCSS architecture.
5. Identify reusable components.
6. Then implement the project.

Do not start by randomly writing HTML, SCSS and JavaScript.

Build the project systematically.

---

# 23. Visual Quality Requirement

Before considering the project complete, review it as if you were a senior frontend developer reviewing a junior developer's submission.

Check:

* Is the spacing consistent?
* Is typography consistent?
* Are cards visually balanced?
* Is the modal polished?
* Are animations smooth?
* Does dark mode actually look good?
* Does light mode actually look good?
* Does mobile look intentionally designed?
* Are interactions intuitive?
* Is the code maintainable?
* Is there duplicated code?
* Is there unnecessary complexity?
* Is there any unused code?
* Does anything look like generic AI-generated UI?

If something looks generic or poorly designed, improve it before finishing.

---

# 24. Final Rule

Do not optimize for the amount of code written.

Optimize for:

**Quality > Quantity**

**Clarity > Cleverness**

**Maintainability > Complexity**

**UX > Decoration**

**Consistency > Random Creativity**

The final result should look like a **real, polished movie discovery product built by a senior frontend developer**, not a coding exercise or an AI-generated template.

Build the complete website and ensure all interactions work correctly.
