// ==========================================================================
// CineScope YouTube Trailer Player Component
// Responsive 16:9 lightbox overlay with keyboard handling and clean teardown
// ==========================================================================

import { toast } from './toast.js';

class TrailerPlayerController {
  constructor() {
    this.overlay = null;
    this.videoContainer = null;
    this.closeBtn = null;
    this.titleEl = null;
    this.isOpen = false;
    this.previouslyFocusedElement = null;

    this.initDOM();
  }

  initDOM() {
    let overlay = document.getElementById('trailerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'trailerOverlay';
      overlay.className = 'trailer-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Movie Trailer Player');
      overlay.setAttribute('aria-hidden', 'true');

      overlay.innerHTML = `
        <div class="trailer-dialog">
          <div class="trailer-header">
            <h3 class="trailer-title" id="trailerTitle">Movie Trailer</h3>
            <button type="button" class="trailer-close-btn" id="trailerCloseBtn" aria-label="Close trailer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="trailer-video-frame" id="trailerVideoFrame">
            <!-- iframe inserted here dynamically -->
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
    }

    this.overlay = overlay;
    this.videoContainer = overlay.querySelector('#trailerVideoFrame');
    this.closeBtn = overlay.querySelector('#trailerCloseBtn');
    this.titleEl = overlay.querySelector('#trailerTitle');

    this.initEventListeners();
  }

  initEventListeners() {
    // Close button
    this.closeBtn?.addEventListener('click', () => this.close());

    // Click outside dialog to close
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC key support & focus trap
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      } else if (e.key === 'Tab') {
        this.handleFocusTrap(e);
      }
    });
  }

  /**
   * Play the movie trailer
   * @param {Object} movie - Movie object
   * @param {HTMLElement} [triggerElement] - Element that triggered the player
   */
  play(movie, triggerElement = null) {
    if (!movie) return;

    if (!movie.trailerKey) {
      toast.show({
        title: 'Trailer not available',
        message: `We couldn't find a YouTube trailer for "${movie.title}".`,
        type: 'info'
      });
      return;
    }

    this.previouslyFocusedElement = triggerElement || document.activeElement;

    // Set title
    if (this.titleEl) {
      this.titleEl.textContent = `${movie.title} — Official Trailer`;
    }

    // Embed YouTube iframe with security and performance best practices
    const iframeUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(movie.trailerKey)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

    this.videoContainer.innerHTML = `
      <iframe
        src="${iframeUrl}"
        title="${movie.title} Trailer"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
      ></iframe>
    `;

    // Show overlay
    this.overlay.classList.add('active');
    this.overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('trailer-open');
    this.isOpen = true;

    // Focus close button for accessibility
    setTimeout(() => {
      this.closeBtn?.focus();
    }, 50);
  }

  close() {
    if (!this.isOpen || !this.overlay) return;

    // Teardown iframe immediately so audio/video playback stops
    if (this.videoContainer) {
      this.videoContainer.innerHTML = '';
    }

    this.overlay.classList.remove('active');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('trailer-open');
    this.isOpen = false;

    // Restore focus
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }
  }

  handleFocusTrap(event) {
    const focusableElements = this.overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

export const trailerPlayer = new TrailerPlayerController();
