// ==========================================================================
// CineScope Standalone Movie Details Page Controller
// ==========================================================================

import { movies } from './data/movies.js';
import { initTheme } from './features/theme.js';
import { trailerPlayer } from './components/trailer-player.js';

const FALLBACK_POSTER = './assets/images/poster-fallback.svg';

class MoviePageController {
  constructor() {
    this.movies = movies;
    this.currentMovie = null;
    this.savedWatchlist = new Set(JSON.parse(localStorage.getItem('cinescope_watchlist') || '[]'));

    // DOM references
    this.detailContainer = document.getElementById('movieDetailContainer');
    this.notFoundContainer = document.getElementById('notFoundContainer');
    this.pageTitle = document.getElementById('pageTitle');
    this.backdropImg = document.getElementById('detailBackdropImg');
    this.posterImg = document.getElementById('detailPosterImg');
    this.titleEl = document.getElementById('detailTitle');
    this.taglineEl = document.getElementById('detailTagline');
    this.ratingEl = document.getElementById('detailRating');
    this.votesEl = document.getElementById('detailVotes');
    this.yearEl = document.getElementById('detailYear');
    this.durationEl = document.getElementById('detailDuration');
    this.genresContainer = document.getElementById('detailGenres');
    this.overviewEl = document.getElementById('detailOverview');
    this.directorEl = document.getElementById('detailDirector');
    this.castEl = document.getElementById('detailCast');
    this.trailerBtn = document.getElementById('detailTrailerBtn');
    this.watchlistBtn = document.getElementById('detailWatchlistBtn');

    this.init();
  }

  init() {
    // 1. Initialize Theme
    initTheme();

    // 2. Parse Movie ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
      this.showNotFound();
      return;
    }

    // 3. Find Movie by ID
    const movie = this.movies.find(m => m.id.toLowerCase() === movieId.toLowerCase() || String(m.tmdbId) === movieId);

    if (!movie) {
      this.showNotFound();
      return;
    }

    this.currentMovie = movie;
    this.renderMovieDetails(movie);
    this.initEventListeners();
  }

  renderMovieDetails(movie) {
    if (this.detailContainer) this.detailContainer.style.display = 'block';
    if (this.notFoundContainer) this.notFoundContainer.style.display = 'none';

    // Page Title & Meta
    document.title = `${movie.title} (${movie.year}) — CineScope`;
    if (this.pageTitle) this.pageTitle.textContent = `${movie.title} (${movie.year}) — CineScope`;

    // Backdrop Image
    if (this.backdropImg) {
      this.backdropImg.src = movie.backdrop || movie.poster;
      this.backdropImg.alt = `${movie.title} backdrop`;
      this.backdropImg.onerror = () => {
        this.backdropImg.src = movie.poster || FALLBACK_POSTER;
      };
    }

    // Poster Image
    if (this.posterImg) {
      this.posterImg.src = movie.poster;
      this.posterImg.alt = `${movie.title} poster`;
      this.posterImg.onerror = () => {
        this.posterImg.src = FALLBACK_POSTER;
      };
    }

    // Text details
    if (this.titleEl) this.titleEl.textContent = movie.title;
    if (this.taglineEl) {
      if (movie.tagline) {
        this.taglineEl.textContent = movie.tagline;
        this.taglineEl.style.display = 'block';
      } else {
        this.taglineEl.style.display = 'none';
      }
    }

    if (this.ratingEl) this.ratingEl.textContent = movie.rating.toFixed(1);
    if (this.votesEl) this.votesEl.textContent = `(${movie.votes || 'Top Pick'})`;
    if (this.yearEl) this.yearEl.textContent = movie.year;
    if (this.durationEl) this.durationEl.textContent = movie.duration;

    // Genres
    if (this.genresContainer) {
      this.genresContainer.innerHTML = movie.genres
        .map(genre => `<span class="detail-genre-pill">${genre}</span>`)
        .join('');
    }

    // Overview
    if (this.overviewEl) {
      this.overviewEl.textContent = movie.fullOverview || movie.description;
    }

    // Cast & Crew
    if (this.directorEl) this.directorEl.textContent = movie.director;
    if (this.castEl) this.castEl.textContent = movie.cast.join(', ');

    // Watchlist State
    this.updateWatchlistButton();
  }

  showNotFound() {
    if (this.detailContainer) this.detailContainer.style.display = 'none';
    if (this.notFoundContainer) this.notFoundContainer.style.display = 'flex';
    document.title = 'Movie Not Found — CineScope';
  }

  initEventListeners() {
    // Trailer Button
    this.trailerBtn?.addEventListener('click', () => {
      if (!this.currentMovie) return;
      trailerPlayer.play(this.currentMovie, this.trailerBtn);
    });

    // Watchlist Button
    this.watchlistBtn?.addEventListener('click', () => {
      if (!this.currentMovie) return;
      this.toggleWatchlist(this.currentMovie.id);
    });
  }

  toggleWatchlist(movieId) {
    if (this.savedWatchlist.has(movieId)) {
      this.savedWatchlist.delete(movieId);
    } else {
      this.savedWatchlist.add(movieId);
    }
    localStorage.setItem('cinescope_watchlist', JSON.stringify(Array.from(this.savedWatchlist)));
    this.updateWatchlistButton();
  }

  updateWatchlistButton() {
    if (!this.watchlistBtn || !this.currentMovie) return;

    const isSaved = this.savedWatchlist.has(this.currentMovie.id);
    this.watchlistBtn.innerHTML = isSaved
      ? `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        Saved in Watchlist
      `
      : `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        Add to Watchlist
      `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MoviePageController();
});
