// ==========================================================================
// Movie Details Modal Component & Controller
// ==========================================================================

const FALLBACK_POSTER = './assets/images/poster-fallback.svg';

class MovieModalController {
  constructor() {
    this.modalBackdrop = document.getElementById('movieModal');
    this.modalDialog = document.getElementById('modalDialog');
    this.modalHeroImg = document.getElementById('modalHeroImg');
    this.modalPosterImg = document.getElementById('modalPosterImg');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalTagline = document.getElementById('modalTagline');
    this.modalRating = document.getElementById('modalRating');
    this.modalVotes = document.getElementById('modalVotes');
    this.modalYear = document.getElementById('modalYear');
    this.modalDuration = document.getElementById('modalDuration');
    this.modalGenres = document.getElementById('modalGenres');
    this.modalOverview = document.getElementById('modalOverview');
    this.modalDirector = document.getElementById('modalDirector');
    this.modalCast = document.getElementById('modalCast');
    this.closeBtn = document.getElementById('modalCloseBtn');
    this.watchlistBtn = document.getElementById('modalWatchlistBtn');
    this.trailerBtn = document.getElementById('modalTrailerBtn');

    this.isOpen = false;
    this.previouslyFocusedElement = null;
    this.savedWatchlist = new Set(JSON.parse(localStorage.getItem('cinescope_watchlist') || '[]'));
    this.currentMovie = null;

    this.initEventListeners();
  }

  initEventListeners() {
    if (!this.modalBackdrop) return;

    // Close button click
    this.closeBtn?.addEventListener('click', () => this.close());

    // Click outside dialog to close
    this.modalBackdrop.addEventListener('click', (event) => {
      if (event.target === this.modalBackdrop) {
        this.close();
      }
    });

    // Keyboard ESC & focus trap
    window.addEventListener('keydown', (event) => {
      if (!this.isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      } else if (event.key === 'Tab') {
        this.handleFocusTrap(event);
      }
    });

    // Interactive Watchlist Toggle
    this.watchlistBtn?.addEventListener('click', () => {
      if (!this.currentMovie) return;
      this.toggleWatchlist(this.currentMovie.id);
    });

    // Trailer Preview Feedback
    this.trailerBtn?.addEventListener('click', () => {
      if (!this.currentMovie) return;
      alert(`Trailer preview for "${this.currentMovie.title}" is ready! In a full streaming app, this would play the official trailer.`);
    });
  }

  /**
   * Opens the movie modal and populates it with the given movie details.
   * @param {Object} movie - Movie data object.
   * @param {HTMLElement} [triggerElement] - The element that triggered the modal opening.
   */
  open(movie, triggerElement = null) {
    if (!movie || !this.modalBackdrop) return;

    this.currentMovie = movie;
    this.previouslyFocusedElement = triggerElement || document.activeElement;

    // Populate data
    if (this.modalHeroImg) {
      this.modalHeroImg.src = movie.backdrop || movie.poster;
      this.modalHeroImg.alt = `${movie.title} backdrop`;
      this.modalHeroImg.onerror = () => {
        this.modalHeroImg.src = movie.poster || FALLBACK_POSTER;
      };
    }

    if (this.modalPosterImg) {
      this.modalPosterImg.src = movie.poster;
      this.modalPosterImg.alt = `${movie.title} poster`;
      this.modalPosterImg.onerror = () => {
        this.modalPosterImg.src = FALLBACK_POSTER;
      };
    }

    if (this.modalTitle) this.modalTitle.textContent = movie.title;
    if (this.modalTagline) this.modalTagline.textContent = movie.tagline || '';
    if (this.modalRating) this.modalRating.textContent = movie.rating.toFixed(1);
    if (this.modalVotes) this.modalVotes.textContent = `(${movie.votes || 'Top Pick'})`;
    if (this.modalYear) this.modalYear.textContent = movie.year;
    if (this.modalDuration) this.modalDuration.textContent = movie.duration;
    if (this.modalDirector) this.modalDirector.textContent = movie.director;
    if (this.modalCast) this.modalCast.textContent = movie.cast.join(', ');
    if (this.modalOverview) this.modalOverview.textContent = movie.fullOverview || movie.description;

    // Render genre pills
    if (this.modalGenres) {
      this.modalGenres.innerHTML = movie.genres
        .map(genre => `<span class="modal-genre-tag">${genre}</span>`)
        .join('');
    }

    // Update watchlist button state
    this.updateWatchlistButtonState(movie.id);

    // Show modal
    this.modalBackdrop.classList.add('active');
    this.modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    this.isOpen = true;

    // Focus close button
    setTimeout(() => {
      this.closeBtn?.focus();
    }, 50);
  }

  /**
   * Closes the movie modal and restores focus.
   */
  close() {
    if (!this.isOpen || !this.modalBackdrop) return;

    this.modalBackdrop.classList.remove('active');
    this.modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    this.isOpen = false;

    // Restore previous focus for screen readers and keyboard navigation
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }
  }

  /**
   * Traps Tab focus within the active modal.
   * @param {KeyboardEvent} event
   */
  handleFocusTrap(event) {
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = this.modalDialog.querySelectorAll(focusableSelectors);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Toggles movie in local watchlist.
   * @param {string} movieId
   */
  toggleWatchlist(movieId) {
    if (this.savedWatchlist.has(movieId)) {
      this.savedWatchlist.delete(movieId);
    } else {
      this.savedWatchlist.add(movieId);
    }
    localStorage.setItem('cinescope_watchlist', JSON.stringify(Array.from(this.savedWatchlist)));
    this.updateWatchlistButtonState(movieId);
  }

  updateWatchlistButtonState(movieId) {
    if (!this.watchlistBtn) return;
    const isSaved = this.savedWatchlist.has(movieId);
    this.watchlistBtn.innerHTML = isSaved
      ? `
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        Saved in Watchlist
      `
      : `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        Add to Watchlist
      `;
  }
}

export const movieModal = new MovieModalController();
