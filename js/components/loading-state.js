// ==========================================================================
// Loading State Component
// ==========================================================================

/**
 * Renders movie-card skeleton placeholders.
 * @param {number} [count=6]
 * @returns {DocumentFragment}
 */
export function createMovieSkeletons(count = 6) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const skeleton = document.createElement('article');
    skeleton.className = 'movie-skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.innerHTML = `
      <div class="skeleton-poster skeleton-shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-line-sm skeleton-shimmer"></div>
        <div class="skeleton-line skeleton-line-lg skeleton-shimmer"></div>
        <div class="skeleton-line skeleton-line-md skeleton-shimmer"></div>
      </div>
    `;
    fragment.appendChild(skeleton);
  }

  return fragment;
}

/**
 * Shows an accessible loading status in a grid container.
 * @param {HTMLElement} container
 * @param {Object} [options]
 * @param {number} [options.count=6]
 * @param {string} [options.label='Loading movies']
 */
export function showLoadingState(container, { count = 6, label = 'Loading movies' } = {}) {
  if (!container) return;

  container.innerHTML = '';
  container.classList.add('is-loading');

  const status = document.createElement('div');
  status.className = 'loading-state';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-label', label);

  const srText = document.createElement('span');
  srText.className = 'visually-hidden';
  srText.textContent = label;
  status.appendChild(srText);

  container.appendChild(status);
  container.appendChild(createMovieSkeletons(count));
}

export function hideLoadingState(container) {
  if (!container) return;
  container.classList.remove('is-loading');
}
