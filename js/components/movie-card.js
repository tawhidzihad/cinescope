// ==========================================================================
// Movie Card Component
// ==========================================================================

const FALLBACK_POSTER = './assets/images/poster-fallback.svg';

/**
 * Creates a movie card DOM element with accessible markup and interaction attributes.
 * @param {Object} movie - The movie data object.
 * @returns {HTMLElement} The movie card article element.
 */
export function createMovieCard(movie) {
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-haspopup', 'dialog');
  card.setAttribute('aria-label', `View details for ${movie.title} (${movie.year}), rated ${movie.rating} out of 10`);
  card.dataset.movieId = movie.id;

  const genresMarkup = movie.genres
    .slice(0, 2)
    .map(genre => `<span class="genre-pill">${genre}</span>`)
    .join('');

  card.innerHTML = `
    <div class="card-poster">
      <img 
        src="${movie.poster}" 
        alt="Poster for ${movie.title}" 
        loading="lazy"
        onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';"
      />
      <div class="poster-overlay"></div>
      <div class="card-badge-rating" aria-label="Rating: ${movie.rating}">
        <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
        <span>${movie.rating.toFixed(1)}</span>
      </div>
      <div class="card-badge-year">${movie.year}</div>
    </div>
    <div class="card-body">
      <div class="card-genres">${genresMarkup}</div>
      <h3 class="card-title" title="${movie.title}">${movie.title}</h3>
      <p class="card-description">${movie.description}</p>
      <div class="card-footer">
        <span class="card-runtime">${movie.duration}</span>
        <span class="card-action-link" aria-hidden="true">
          Details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </div>
  `;

  return card;
}
