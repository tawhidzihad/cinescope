// ==========================================================================
// Search Controller Feature
// ==========================================================================

export class SearchController {
  /**
   * @param {Function} onSearchChange - Callback called with the updated search query string.
   */
  constructor(onSearchChange) {
    this.onSearchChange = onSearchChange;
    this.searchInputs = document.querySelectorAll('.search-input');
    this.clearButtons = document.querySelectorAll('.search-clear-btn');
    this.debounceTimer = null;
    this.currentQuery = '';

    this.initEventListeners();
  }

  initEventListeners() {
    this.searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const query = e.target.value;
        this.syncInputs(query);
        this.updateClearButtons(query);

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.currentQuery = query.trim().toLowerCase();
          this.onSearchChange(this.currentQuery);
        }, 200);
      });

      // Handle Enter key for immediate search
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(this.debounceTimer);
          this.currentQuery = e.target.value.trim().toLowerCase();
          this.onSearchChange(this.currentQuery);
        }
      });
    });

    this.clearButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.clearSearch();
      });
    });
  }

  syncInputs(value) {
    this.searchInputs.forEach(input => {
      if (input.value !== value) {
        input.value = value;
      }
    });
  }

  updateClearButtons(query) {
    this.clearButtons.forEach(btn => {
      if (query.trim().length > 0) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
  }

  clearSearch() {
    this.syncInputs('');
    this.updateClearButtons('');
    this.currentQuery = '';
    this.onSearchChange('');
    
    // Focus first available input
    if (this.searchInputs.length > 0) {
      this.searchInputs[0].focus();
    }
  }

  getQuery() {
    return this.currentQuery;
  }
}
