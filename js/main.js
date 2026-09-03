// ==========================================================================
// CineScope Application Coordinator
// ==========================================================================

import { movies, availableGenres } from './data/movies.js';
import { createMovieCard } from './components/movie-card.js';
import { createEmptyState } from './components/empty-state.js';
import { movieModal } from './components/movie-modal.js';
import { initTheme } from './features/theme.js';
import { SearchController } from './features/search.js';
import { FilterController } from './features/filters.js';
import { initMobileNav } from './features/mobile-nav.js';

class App {
  constructor() {
    this.movies = movies;
    this.moviesGrid = document.getElementById('moviesGrid');
    this.genrePillsContainer = document.getElementById('genrePills');
    this.heroSection = document.getElementById('heroSection');
    this.heroDetailsBtn = document.getElementById('heroDetailsBtn');
    this.heroExploreBtn = document.getElementById('heroExploreBtn');

    this.init();
  }

  init() {
    // 1. Initialize Theme & Mobile Navigation
    initTheme();
    initMobileNav();

    // 2. Initialize Hero Spotlight
    this.initHeroSection();

    // 3. Render Genre Filter Pills
    this.renderGenrePills();

    // 4. Initialize Filter & Sort Controller
    this.filterController = new FilterController({
      allMovies: this.movies,
      onFilterChange: (filteredMovies) => this.renderMovies(filteredMovies)
    });

    // 5. Initialize Search Controller
    this.searchController = new SearchController((query) => {
      this.filterController.setSearchQuery(query);
    });

    // 6. Setup Event Delegation for Movie Cards
    this.setupGridInteractions();

    // 7. Setup Quick Nav Filter Actions
    this.setupNavLinks();

    // 8. Initial Movie Grid Render
    this.filterController.applyFilterAndSort();
  }

  initHeroSection() {
    const featuredMovie = this.movies.find(m => m.featured) || this.movies[0];
    if (!featuredMovie) return;

    // Populate hero backdrop
    const backdropImg = document.getElementById('heroBackdropImg');
    if (backdropImg) {
      backdropImg.src = featuredMovie.backdrop || featuredMovie.poster;
      backdropImg.alt = `${featuredMovie.title} featured backdrop`;
    }

    // Populate hero title
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.textContent = featuredMovie.title;

    // Populate hero metadata row
    const heroMeta = document.getElementById('heroMeta');
    if (heroMeta) {
      const genresHtml = featuredMovie.genres
        .slice(0, 2)
        .map(g => `<span class="genre-chip">${g}</span>`)
        .join('');

      heroMeta.innerHTML = `
        <div class="hero-rating" aria-label="Rating: ${featuredMovie.rating} out of 10">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span>${featuredMovie.rating.toFixed(1)}</span>
        </div>
        <span class="hero-meta-item">${featuredMovie.year}</span>
        <span class="hero-meta-item">${featuredMovie.duration}</span>
        <div class="hero-genres">${genresHtml}</div>
      `;
    }

    // Populate hero description
    const heroDesc = document.getElementById('heroDescription');
    if (heroDesc) heroDesc.textContent = featuredMovie.description;

    // Attach Hero CTA trigger
    this.heroDetailsBtn = document.getElementById('heroDetailsBtn');
    this.heroDetailsBtn?.addEventListener('click', () => {
      this.handleMovieSelection(featuredMovie, this.heroDetailsBtn);
    });

    document.getElementById('heroExploreBtn')?.addEventListener('click', () => {
      document.getElementById('discoverSection')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  handleMovieSelection(movie, triggerElement = null) {
    if (!movie) return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      window.open(
        `./movie.html?id=${encodeURIComponent(movie.id)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      movieModal.open(movie, triggerElement);
    }
  }

  renderGenrePills() {
    if (!this.genrePillsContainer) return;

    this.genrePillsContainer.innerHTML = availableGenres
      .map((genre, index) => {
        const isActive = index === 0;
        return `
          <button 
            type="button" 
            class="filter-pill ${isActive ? 'active' : ''}" 
            data-genre="${genre}"
            aria-pressed="${isActive ? 'true' : 'false'}"
          >
            ${genre}
          </button>
        `;
      })
      .join('');
  }

  renderMovies(movieList) {
    if (!this.moviesGrid) return;

    this.moviesGrid.innerHTML = '';

    if (movieList.length === 0) {
      const emptyState = createEmptyState(() => {
        this.searchController.clearSearch();
        this.filterController.reset();
      });
      this.moviesGrid.appendChild(emptyState);
      return;
    }

    const fragment = document.createDocumentFragment();
    movieList.forEach(movie => {
      const card = createMovieCard(movie);
      fragment.appendChild(card);
    });

    this.moviesGrid.appendChild(fragment);
  }

  setupGridInteractions() {
    if (!this.moviesGrid) return;

    // Click handler
    this.moviesGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.movie-card');
      if (!card) return;

      const movieId = card.dataset.movieId;
      const movie = this.movies.find(m => m.id === movieId);
      if (movie) {
        this.handleMovieSelection(movie, card);
      }
    });

    // Keyboard navigation: Enter or Space opens modal / mobile page
    this.moviesGrid.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const card = event.target.closest('.movie-card');
        if (!card) return;

        event.preventDefault();
        const movieId = card.dataset.movieId;
        const movie = this.movies.find(m => m.id === movieId);
        if (movie) {
          this.handleMovieSelection(movie, card);
        }
      }
    });
  }

  setupNavLinks() {
    const discoverSection = document.getElementById('discoverSection');

    // Quick links in header & mobile drawer
    document.querySelectorAll('[data-nav-action]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.navAction;

        if (action === 'trending') {
          this.filterController.reset();
          discoverSection?.scrollIntoView({ behavior: 'smooth' });
        } else if (action === 'top-rated') {
          this.filterController.reset();
          if (this.filterController.sortSelect) {
            this.filterController.sortSelect.value = 'rating-desc';
          }
          this.filterController.applyFilterAndSort();
          discoverSection?.scrollIntoView({ behavior: 'smooth' });
        } else if (action === 'genres') {
          discoverSection?.scrollIntoView({ behavior: 'smooth' });
          const firstPill = this.genrePillsContainer?.querySelector('.filter-pill');
          firstPill?.focus();
        } else if (action === 'discover') {
          discoverSection?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
}

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
