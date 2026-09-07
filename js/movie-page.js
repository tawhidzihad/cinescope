// ==========================================================================
// CineScope Standalone Movie Details Page Controller — Backend API
// ==========================================================================

import { initTheme } from './features/theme.js';
import { trailerPlayer } from './components/trailer-player.js';

const FALLBACK_POSTER = './assets/images/poster-fallback.svg';
const API_BASE = '/api';

class MoviePageController {
  constructor() {
    this.currentMovie = null;
    this.savedWatchlist = new Set(JSON.parse(localStorage.getItem('cinescope_watchlist') || '[]'));

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

  async init() {
    initTheme();

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
      this.showNotFound();
      return;
    }

    this.showLoading();

    try {
      const res = await fetch(`${API_BASE}/movies/${encodeURIComponent(movieId)}`);
      const data = await res.json();

      if (!res.ok || !data.data) {
        this.showNotFound();
        return;
      }

      this.currentMovie = data.data;
      this.renderMovieDetails(this.currentMovie);
      this.initEventListeners();
    } catch {
      this.showNotFound();
    }
  }

  showLoading() {
    if (this.detailContainer) {
      this.detailContainer.innerHTML = `
        <div class="detail-loading">
          <div class="detail-loading-backdrop skeleton-shimmer"></div>
          <div class="container detail-layout">
            <div class="detail-poster-col">
              <div class="detail-poster-card skeleton-shimmer" style="aspect-ratio: 2/3;"></div>
            </div>
            <div class="detail-info-col">
              <div class="skeleton-line skeleton-line-lg skeleton-shimmer" style="width: 60%; height: 2rem; margin-bottom: 1rem;"></div>
              <div class="skeleton-line skeleton-line-md skeleton-shimmer" style="width: 40%; margin-bottom: 1.5rem;"></div>
              <div class="skeleton-line skeleton-line-sm skeleton-shimmer" style="width: 80%; margin-bottom: 0.5rem;"></div>
              <div class="skeleton-line skeleton-line-sm skeleton-shimmer" style="width: 70%; margin-bottom: 0.5rem;"></div>
              <div class="skeleton-line skeleton-line-sm skeleton-shimmer" style="width: 90%;"></div>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderMovieDetails(movie) {
    if (this.detailContainer) this.detailContainer.style.display = 'block';
    if (this.notFoundContainer) this.notFoundContainer.style.display = 'none';

    document.title = `${movie.title} (${movie.year || ''}) — CineScope`;
    if (this.pageTitle) this.pageTitle.textContent = `${movie.title} (${movie.year || ''}) — CineScope`;

    if (this.backdropImg) {
      this.backdropImg.src = movie.backdrop || movie.poster || FALLBACK_POSTER;
      this.backdropImg.alt = `${movie.title} backdrop`;
      this.backdropImg.onerror = () => { this.backdropImg.src = movie.poster || FALLBACK_POSTER; };
    }

    if (this.posterImg) {
      this.posterImg.src = movie.poster || FALLBACK_POSTER;
      this.posterImg.alt = `${movie.title} poster`;
      this.posterImg.onerror = () => { this.posterImg.src = FALLBACK_POSTER; };
    }

    if (this.titleEl) this.titleEl.textContent = movie.title;
    if (this.taglineEl) {
      if (movie.tagline) {
        this.taglineEl.textContent = movie.tagline;
        this.taglineEl.style.display = 'block';
      } else {
        this.taglineEl.style.display = 'none';
      }
    }

    if (this.ratingEl) this.ratingEl.textContent = movie.rating ? movie.rating.toFixed(1) : 'N/A';
    if (this.votesEl) this.votesEl.textContent = `(${movie.votes || 'Top Pick'})`;
    if (this.yearEl) this.yearEl.textContent = movie.year || 'Unknown';
    if (this.durationEl) this.durationEl.textContent = movie.duration || 'Unknown';

    if (this.genresContainer) {
      this.genresContainer.innerHTML = (movie.genres || [])
        .map(genre => `<span class="detail-genre-pill">${genre}</span>`)
        .join('');
    }

    if (this.overviewEl) {
      this.overviewEl.textContent = movie.fullOverview || movie.description || 'No overview available.';
    }

    if (this.directorEl) this.directorEl.textContent = movie.director || 'Unknown';
    if (this.castEl) this.castEl.textContent = (movie.cast || []).join(', ') || 'Unknown';

    this.updateWatchlistButton();
  }

  showNotFound() {
    if (this.detailContainer) this.detailContainer.style.display = 'none';
    if (this.notFoundContainer) this.notFoundContainer.style.display = 'flex';
    document.title = 'Movie Not Found — CineScope';
  }

  initEventListeners() {
    this.trailerBtn?.addEventListener('click', () => {
      if (!this.currentMovie) return;
      trailerPlayer.play(this.currentMovie, this.trailerBtn);
    });

    this.watchlistBtn?.addEventListener('click', () => {
      if (!this.currentMovie) return;
      this.toggleWatchlist(this.currentMovie._id || this.currentMovie.id);
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
    const movieId = this.currentMovie._id || this.currentMovie.id;
    const isSaved = this.savedWatchlist.has(movieId);
    this.watchlistBtn.innerHTML = isSaved
      ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Saved in Watchlist`
      : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Add to Watchlist`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MoviePageController();
});
