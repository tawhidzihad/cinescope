// ==========================================================================
// Empty State Component
// ==========================================================================

/**
 * Creates an empty state DOM element when no movies match the query/filter.
 * @param {Function} onReset - Callback invoked when the user clicks the reset action button.
 * @returns {HTMLElement} The empty state container element.
 */
export function createEmptyState(onReset) {
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');

  wrapper.innerHTML = `
    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
    <h3 class="empty-title">No Movies Found</h3>
    <p class="empty-description">We couldn't find any movies matching your current search or genre filter criteria.</p>
    <button type="button" class="btn btn-primary btn-sm reset-filters-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      Reset Filters & Search
    </button>
  `;

  const resetBtn = wrapper.querySelector('.reset-filters-btn');
  if (resetBtn && typeof onReset === 'function') {
    resetBtn.addEventListener('click', onReset);
  }

  return wrapper;
}
