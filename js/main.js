// ==========================================================================
// CineScope Application Coordinator — Backend API Integration
// ==========================================================================

import { createMovieCard } from './components/movie-card.js';
import { createEmptyState } from './components/empty-state.js';
import { movieModal } from './components/movie-modal.js';
import { PaginationController, getVisiblePageItems } from './components/pagination.js';
import { showLoadingState, hideLoadingState } from './components/loading-state.js';
import { initTheme } from './features/theme.js';
import { SearchController } from './features/search.js';
import { initMobileNav } from './features/mobile-nav.js';

const API_BASE = '/api';
const MOVIES_PER_PAGE = 12;

class App {
  constructor() {
    this.movies = [];
    this.currentPage = 1;
    this.totalPages = 0;
    this.totalItems = 0;
    this.searchQuery = '';
    this.selectedGenre = 'All';
    this.sortBy = 'rating-desc';

    this.moviesGrid = document.getElementById('moviesGrid');
    this.genrePillsContainer = document.getElementById('genrePills');
    this.resultsCountEl = document.getElementById('resultsCount');
    this.paginationNav = document.getElementById('paginationNav');
    this.sortSelect = document.getElementById('sortSelect');

    this.heroSection = document.getElementById('heroSection');
    this.heroBackdropImg = document.getElementById('heroBackdropImg');
    this.heroTitle = document.getElementById('heroTitle');
    this.heroMeta = document.getElementById('heroMeta');
    this.heroDescription = document.getElementById('heroDescription');
    this.heroDetailsBtn = document.getElementById('heroDetailsBtn');
    this.heroExploreBtn = document.getElementById('heroExploreBtn');

    this.carouselIndex = 0;
    this.carouselMovies = [];
    this.carouselTimer = null;

    this.init();
  }

  async init() {
    initTheme();
    initMobileNav();

    this.paginationController = new PaginationController({
      container: this.paginationNav,
      onPageChange: (nextPage) => this.handlePageChange(nextPage)
    });

    this.searchController = new SearchController((query) => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.loadMovies();
    });

    this.setupGridInteractions();
    this.setupNavLinks();
    this.setupSort();
    this.renderGenrePills();

    showLoadingState(this.moviesGrid, { count: 6, label: 'Loading movies' });

    await Promise.all([
      this.loadLatestReleases(),
      this.loadMovies()
    ]);
  }

  async api(path) {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  async loadLatestReleases() {
    try {
      const res = await this.api('/movies/latest-releases');
      this.carouselMovies = res.data;
      this.renderCarousel();
    } catch {
      this.renderHeroFallback();
    }
  }

  renderCarousel() {
    if (!this.carouselMovies.length) {
      this.renderHeroFallback();
      return;
    }

    this.carouselIndex = 0;
    this.showCarouselSlide(0);
    this.startCarouselAutoplay();
    this.renderCarouselDots();
  }

  showCarouselSlide(index) {
    if (index < 0 || index >= this.carouselMovies.length) return;
    this.carouselIndex = index;

    const movie = this.carouselMovies[index];

    if (this.heroBackdropImg) {
      this.heroBackdropImg.src = movie.backdrop || movie.poster || '';
      this.heroBackdropImg.alt = `${movie.title} backdrop`;
    }

    if (this.heroTitle) this.heroTitle.textContent = movie.title;

    if (this.heroMeta) {
      const genresHtml = (movie.genres || []).slice(0, 2)
        .map(g => `<span class="genre-chip">${g}</span>`)
        .join('');

      this.heroMeta.innerHTML = `
        <div class="hero-rating" aria-label="Rating: ${movie.rating} out of 10">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span>${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
        </div>
        <span class="hero-meta-item">${movie.year || ''}</span>
        <span class="hero-meta-item">${movie.duration || ''}</span>
        <div class="hero-genres">${genresHtml}</div>
      `;
    }

    if (this.heroDescription) {
      this.heroDescription.textContent = movie.description || movie.fullOverview || '';
    }

    this.heroDetailsBtn?.removeEventListener('click', this._heroDetailsHandler);
    this._heroDetailsHandler = () => this.handleHeroDetails(movie);
    this.heroDetailsBtn?.addEventListener('click', this._heroDetailsHandler);

    const slideEls = this.heroSection?.querySelectorAll('.hero-slide');
    slideEls?.forEach((s, i) => s.classList.toggle('active', i === index));
  }

  renderHeroFallback() {
    if (this.heroTitle) this.heroTitle.textContent = 'Discover Movies';
    if (this.heroDescription) this.heroDescription.textContent = 'Explore critically acclaimed English-language cinema with high-definition details and ratings.';
    if (this.heroBackdropImg) this.heroBackdropImg.src = './assets/images/poster-fallback.svg';
    if (this.heroMeta) this.heroMeta.innerHTML = '';
  }

  startCarouselAutoplay() {
    this.stopCarouselAutoplay();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || this.carouselMovies.length <= 1) return;

    this.carouselTimer = setInterval(() => {
      const next = (this.carouselIndex + 1) % this.carouselMovies.length;
      this.showCarouselSlide(next);
      this.updateCarouselDots();
    }, 6000);
  }

  stopCarouselAutoplay() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  renderCarouselDots() {
    const existing = this.heroSection?.querySelector('.hero-carousel-dots');
    if (existing) existing.remove();

    if (this.carouselMovies.length <= 1) return;

    const dots = document.createElement('div');
    dots.className = 'hero-carousel-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Carousel slides');

    this.carouselMovies.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.dataset.index = i;
      dot.addEventListener('click', () => {
        this.showCarouselSlide(i);
        this.updateCarouselDots();
        this.startCarouselAutoplay();
      });
      dots.appendChild(dot);
    });

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'hero-carousel-nav hero-carousel-prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    prevBtn.addEventListener('click', () => {
      const prev = (this.carouselIndex - 1 + this.carouselMovies.length) % this.carouselMovies.length;
      this.showCarouselSlide(prev);
      this.updateCarouselDots();
      this.startCarouselAutoplay();
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'hero-carousel-nav hero-carousel-next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    nextBtn.addEventListener('click', () => {
      const next = (this.carouselIndex + 1) % this.carouselMovies.length;
      this.showCarouselSlide(next);
      this.updateCarouselDots();
      this.startCarouselAutoplay();
    });

    this.heroSection?.appendChild(prevBtn);
    this.heroSection?.appendChild(dots);
    this.heroSection?.appendChild(nextBtn);

    this.heroSection?.addEventListener('mouseenter', () => this.stopCarouselAutoplay());
    this.heroSection?.addEventListener('mouseleave', () => this.startCarouselAutoplay());
  }

  updateCarouselDots() {
    const dots = this.heroSection?.querySelectorAll('.carousel-dot');
    dots?.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.carouselIndex);
      dot.setAttribute('aria-selected', i === this.carouselIndex ? 'true' : 'false');
    });
  }

  handleHeroDetails(movie) {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      window.open(`./movie.html?id=${encodeURIComponent(movie._id || movie.tmdbId)}`, '_blank', 'noopener,noreferrer');
    } else {
      movieModal.open(movie, this.heroDetailsBtn);
    }
  }

  async loadMovies() {
    const params = new URLSearchParams({
      page: this.currentPage,
      limit: MOVIES_PER_PAGE,
      sort: this.sortBy
    });

    if (this.searchQuery) params.set('search', this.searchQuery);
    if (this.selectedGenre && this.selectedGenre !== 'All') params.set('genre', this.selectedGenre);

    try {
      const res = await this.api(`/movies?${params.toString()}`);
      this.movies = res.data;
      this.totalItems = res.pagination.totalItems;
      this.totalPages = res.pagination.totalPages;
      this.currentPage = res.pagination.page;

      this.renderMovies(this.movies);
      this.paginationController.render({
        currentPage: this.currentPage,
        totalPages: this.totalPages
      });
      this.updateResultsCount();
    } catch {
      this.renderErrorState();
    }
  }

  renderMovies(movieList) {
    if (!this.moviesGrid) return;
    hideLoadingState(this.moviesGrid);
    this.moviesGrid.innerHTML = '';

    if (!movieList.length) {
      this.renderEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();
    movieList.forEach(movie => {
      const card = createMovieCard(movie);
      fragment.appendChild(card);
    });

    this.moviesGrid.appendChild(fragment);
  }

  renderEmptyState() {
    if (!this.moviesGrid) return;
    hideLoadingState(this.moviesGrid);
    this.moviesGrid.innerHTML = '';
    const emptyState = createEmptyState(() => {
      this.searchController.clearSearch();
      this.selectedGenre = 'All';
      this.sortBy = 'rating-desc';
      if (this.sortSelect) this.sortSelect.value = 'rating-desc';
      this.renderGenrePills();
      this.currentPage = 1;
      this.loadMovies();
    });
    this.moviesGrid.appendChild(emptyState);
  }

  renderErrorState() {
    if (!this.moviesGrid) return;
    hideLoadingState(this.moviesGrid);
    this.moviesGrid.innerHTML = `
      <div class="error-state" role="alert">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 class="empty-title">Unable to Load Movies</h3>
        <p class="empty-description">Something went wrong while fetching movies. Please try again.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  updateResultsCount() {
    if (!this.resultsCountEl) return;
    if (this.totalItems === 0) {
      this.resultsCountEl.innerHTML = `Showing <span class="count-highlight">0</span> of 0 movies`;
    } else {
      const start = (this.currentPage - 1) * MOVIES_PER_PAGE + 1;
      const end = Math.min(this.currentPage * MOVIES_PER_PAGE, this.totalItems);
      this.resultsCountEl.innerHTML = `Showing <span class="count-highlight">${start}–${end}</span> of ${this.totalItems} movies`;
    }
  }

  handlePageChange(nextPage) {
    this.currentPage = nextPage;
    this.loadMovies();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const discoverSection = document.getElementById('discoverSection');
    if (discoverSection) {
      discoverSection.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  renderGenrePills() {
    if (!this.genrePillsContainer) return;
    const genres = ['All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];

    this.genrePillsContainer.innerHTML = genres.map(genre => `
      <button
        type="button"
        class="filter-pill ${genre === this.selectedGenre ? 'active' : ''}"
        data-genre="${genre}"
        aria-pressed="${genre === this.selectedGenre ? 'true' : 'false'}"
      >${genre}</button>
    `).join('');

    this.genrePillsContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      this.selectedGenre = pill.dataset.genre;
      this.currentPage = 1;

      this.genrePillsContainer.querySelectorAll('.filter-pill').forEach(p => {
        const isActive = p.dataset.genre === this.selectedGenre;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      this.loadMovies();
    });
  }

  setupSort() {
    this.sortSelect?.addEventListener('change', () => {
      this.sortBy = this.sortSelect.value;
      this.currentPage = 1;
      this.loadMovies();
    });
  }

  setupGridInteractions() {
    if (!this.moviesGrid) return;

    this.moviesGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.movie-card');
      if (!card) return;
      const movieId = card.dataset.movieId;
      const movie = this.movies.find(m => m._id === movieId || m.id === movieId);
      if (movie) {
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        if (isMobile) {
          window.open(`./movie.html?id=${encodeURIComponent(movie._id || movie.tmdbId)}`, '_blank', 'noopener,noreferrer');
        } else {
          movieModal.open(movie, card);
        }
      }
    });

    this.moviesGrid.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const card = event.target.closest('.movie-card');
        if (!card) return;
        event.preventDefault();
        const movieId = card.dataset.movieId;
        const movie = this.movies.find(m => m._id === movieId || m.id === movieId);
        if (movie) {
          const isMobile = window.matchMedia('(max-width: 767px)').matches;
          if (isMobile) {
            window.open(`./movie.html?id=${encodeURIComponent(movie._id || movie.tmdbId)}`, '_blank', 'noopener,noreferrer');
          } else {
            movieModal.open(movie, card);
          }
        }
      }
    });
  }

  setupNavLinks() {
    const discoverSection = document.getElementById('discoverSection');

    document.querySelectorAll('[data-nav-action]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.navAction;

        if (action === 'top-rated') {
          this.selectedGenre = 'All';
          this.sortBy = 'rating-desc';
          if (this.sortSelect) this.sortSelect.value = 'rating-desc';
          this.renderGenrePills();
          this.currentPage = 1;
          this.loadMovies();
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

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
