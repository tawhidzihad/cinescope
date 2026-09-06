// ==========================================================================
// Pagination Component
// ==========================================================================

export const MOVIES_PER_PAGE = 8;

/**
 * @param {number} totalItems
 * @param {number} [perPage]
 * @returns {number}
 */
export function getTotalPages(totalItems, perPage = MOVIES_PER_PAGE) {
  if (!totalItems || totalItems < 1) return 0;
  return Math.ceil(totalItems / perPage);
}

/**
 * @param {number} page
 * @param {number} totalPages
 * @returns {number}
 */
export function clampPage(page, totalPages) {
  if (totalPages < 1) return 1;
  const numeric = Number.parseInt(page, 10);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(1, numeric), totalPages);
}

/**
 * Slice a filtered/sorted list to the current page.
 * Pagination is the last selection step before render.
 * @param {Array} items
 * @param {number} page
 * @param {number} [perPage]
 */
export function paginate(items, page, perPage = MOVIES_PER_PAGE) {
  const totalItems = items.length;
  const totalPages = getTotalPages(totalItems, perPage);
  const currentPage = clampPage(page, totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  return {
    pageItems,
    currentPage,
    totalPages,
    totalItems,
    startIndex: totalItems === 0 ? 0 : start + 1,
    endIndex: Math.min(start + perPage, totalItems)
  };
}

/**
 * Ellipsis page-range model.
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {number} [siblingCount]
 * @returns {Array<{ type: 'page'|'ellipsis', page?: number }>}
 */
export function getVisiblePageItems(currentPage, totalPages, siblingCount = 2) {
  if (totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: 'page',
      page: index + 1
    }));
  }

  const pages = new Set([1, totalPages, currentPage]);

  for (let offset = 1; offset <= siblingCount; offset += 1) {
    if (currentPage - offset >= 1) pages.add(currentPage - offset);
    if (currentPage + offset <= totalPages) pages.add(currentPage + offset);
  }

  if (currentPage <= siblingCount + 2) {
    for (let page = 1; page <= Math.min(5, totalPages); page += 1) {
      pages.add(page);
    }
  }

  if (currentPage >= totalPages - siblingCount - 1) {
    for (let page = Math.max(1, totalPages - 4); page <= totalPages; page += 1) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items = [];
  let previous = 0;

  for (const page of sorted) {
    if (previous && page - previous > 1) {
      items.push({ type: 'ellipsis' });
    }
    items.push({ type: 'page', page });
    previous = page;
  }

  return items;
}

export class PaginationController {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container
   * @param {Function} options.onPageChange
   */
  constructor({ container, onPageChange }) {
    this.container = container;
    this.onPageChange = onPageChange;
    this.currentPage = 1;
    this.totalPages = 0;

    this.container?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const nextPage = Number.parseInt(button.dataset.page, 10);
      if (!Number.isFinite(nextPage) || nextPage === this.currentPage) return;
      this.onPageChange(nextPage);
    });
  }

  /**
   * @param {{ currentPage: number, totalPages: number }} state
   */
  render({ currentPage, totalPages }) {
    if (!this.container) return;

    this.currentPage = currentPage;
    this.totalPages = totalPages;

    if (totalPages <= 1) {
      this.container.innerHTML = '';
      this.container.hidden = true;
      this.container.setAttribute('aria-hidden', 'true');
      return;
    }

    this.container.hidden = false;
    this.container.removeAttribute('aria-hidden');

    const compact = window.matchMedia('(max-width: 575.98px)').matches;
    const siblingCount = compact ? 1 : 2;
    const items = getVisiblePageItems(currentPage, totalPages, siblingCount);
    const prevDisabled = currentPage <= 1;
    const nextDisabled = currentPage >= totalPages;

    const pageButtons = items
      .map((item) => {
        if (item.type === 'ellipsis') {
          return `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
        }

        const isCurrent = item.page === currentPage;
        return `
          <button
            type="button"
            class="pagination-page${isCurrent ? ' is-current' : ''}"
            data-page="${item.page}"
            aria-label="Go to page ${item.page}"
            ${isCurrent ? 'aria-current="page"' : ''}
          >${item.page}</button>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <button
        type="button"
        class="pagination-nav"
        data-page="${currentPage - 1}"
        aria-label="Previous page"
        ${prevDisabled ? 'disabled' : ''}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span class="pagination-nav-label">Previous</span>
      </button>
      <div class="pagination-pages" role="list">${pageButtons}</div>
      <button
        type="button"
        class="pagination-nav"
        data-page="${currentPage + 1}"
        aria-label="Next page"
        ${nextDisabled ? 'disabled' : ''}
      >
        <span class="pagination-nav-label">Next</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    `;
  }
}
