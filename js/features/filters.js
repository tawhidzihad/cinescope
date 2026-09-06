// ==========================================================================
// Filtering & Sorting Feature
// ==========================================================================

export class FilterController {
  /**
   * @param {Object} options
   * @param {Array} options.allMovies - The complete catalog of movies.
   * @param {Function} options.onFilterChange - Callback called with the filtered & sorted movie list.
   */
  constructor({ allMovies, onFilterChange }) {
    this.allMovies = allMovies;
    this.onFilterChange = onFilterChange;
    this.activeGenre = 'All';
    this.activeSort = 'rating-desc';
    this.currentQuery = '';

    this.pillsContainer = document.getElementById('genrePills');
    this.sortSelect = document.getElementById('sortSelect');
    this.resultsCountEl = document.getElementById('resultsCount');

    this.initEventListeners();
  }

  initEventListeners() {
    // Genre pills event delegation
    this.pillsContainer?.addEventListener('click', (event) => {
      const pill = event.target.closest('.filter-pill');
      if (!pill) return;

      const genre = pill.dataset.genre || 'All';
      this.setActiveGenre(genre);
    });

    // Sort select change
    this.sortSelect?.addEventListener('change', (event) => {
      this.activeSort = event.target.value;
      this.applyFilterAndSort();
    });
  }

  setActiveGenre(genre) {
    this.activeGenre = genre;

    // Update pill classes
    const pills = this.pillsContainer?.querySelectorAll('.filter-pill');
    pills?.forEach(pill => {
      if (pill.dataset.genre === genre) {
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
      } else {
        pill.classList.remove('active');
        pill.setAttribute('aria-pressed', 'false');
      }
    });

    this.applyFilterAndSort();
  }

  setSearchQuery(query) {
    this.currentQuery = (query || '').trim().toLowerCase();
    this.applyFilterAndSort();
  }

  applyFilterAndSort() {
    let filtered = [...this.allMovies];

    // 1. Search Query Filter
    if (this.currentQuery) {
      filtered = filtered.filter(movie => {
        const titleMatch = movie.title.toLowerCase().includes(this.currentQuery);
        const genreMatch = movie.genres.some(g => g.toLowerCase().includes(this.currentQuery));
        const directorMatch = movie.director.toLowerCase().includes(this.currentQuery);
        const castMatch = movie.cast.some(actor => actor.toLowerCase().includes(this.currentQuery));
        return titleMatch || genreMatch || directorMatch || castMatch;
      });
    }

    // 2. Genre Filter
    if (this.activeGenre && this.activeGenre !== 'All') {
      filtered = filtered.filter(movie => movie.genres.includes(this.activeGenre));
    }

    // 3. Sorting
    filtered.sort((a, b) => {
      switch (this.activeSort) {
        case 'rating-desc':
          return b.rating - a.rating;
        case 'year-desc':
          return b.year - a.year;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return b.rating - a.rating;
      }
    });

    // Trigger update (App handles pagination & result counting)
    this.onFilterChange(filtered);
  }

  updateResultsCount(filteredCount, totalCount) {
    if (!this.resultsCountEl) return;
    this.resultsCountEl.innerHTML = `Showing <span class="count-highlight">${filteredCount}</span> of ${totalCount} movies`;
  }

  reset() {
    this.activeGenre = 'All';
    this.activeSort = 'rating-desc';
    this.currentQuery = '';

    if (this.sortSelect) {
      this.sortSelect.value = 'rating-desc';
    }

    this.setActiveGenre('All');
  }
}
