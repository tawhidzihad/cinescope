import { initTheme } from './features/theme.js';
import { toast } from './components/toast.js';

const API_BASE = '/api';

class AdminApp {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalPages = 0;
    this.totalItems = 0;
    this.searchQuery = '';
    this.genreFilter = 'All';
    this.sortBy = 'createdAt-desc';
    this.movies = [];
    this.allGenres = new Set();
    this.editingMovieId = null;
    this.deleteMovieId = null;
    this.bulkData = null;

    this.elements = {
      loginView: document.getElementById('loginView'),
      dashboardView: document.getElementById('dashboardView'),
      loginForm: document.getElementById('loginForm'),
      loginEmail: document.getElementById('loginEmail'),
      loginPassword: document.getElementById('loginPassword'),
      loginError: document.getElementById('loginError'),
      loginBtn: document.getElementById('loginBtn'),
      logoutBtn: document.getElementById('logoutBtn'),
      adminEmail: document.getElementById('adminEmail'),
      adminTable: document.getElementById('adminTable'),
      adminTableBody: document.getElementById('adminTableBody'),
      adminLoading: document.getElementById('adminLoading'),
      adminTableWrapper: document.getElementById('adminTableWrapper'),
      adminPagination: document.getElementById('adminPagination'),
      adminSearchInput: document.getElementById('adminSearchInput'),
      adminGenreFilter: document.getElementById('adminGenreFilter'),
      adminSortSelect: document.getElementById('adminSortSelect'),
      statTotal: document.getElementById('statTotal'),
      statNewReleases: document.getElementById('statNewReleases'),
      statGenres: document.getElementById('statGenres'),
      addMovieBtn: document.getElementById('addMovieBtn'),
      bulkImportBtn: document.getElementById('bulkImportBtn'),
      exportBtn: document.getElementById('exportBtn'),
      movieFormModal: document.getElementById('movieFormModal'),
      formCloseBtn: document.getElementById('formCloseBtn'),
      formCancelBtn: document.getElementById('formCancelBtn'),
      movieForm: document.getElementById('movieForm'),
      formModalTitle: document.getElementById('formModalTitle'),
      formSubmitBtn: document.getElementById('formSubmitBtn'),
      formErrors: document.getElementById('formErrors'),
      bulkImportModal: document.getElementById('bulkImportModal'),
      bulkImportCloseBtn: document.getElementById('bulkImportCloseBtn'),
      bulkImportUpload: document.getElementById('bulkImportUpload'),
      bulkFileInput: document.getElementById('bulkFileInput'),
      bulkImportPreview: document.getElementById('bulkImportPreview'),
      bulkImportFileInfo: document.getElementById('bulkImportFileInfo'),
      bulkImportStats: document.getElementById('bulkImportStats'),
      bulkImportErrors: document.getElementById('bulkImportErrors'),
      bulkImportCancelBtn: document.getElementById('bulkImportCancelBtn'),
      bulkImportSubmitBtn: document.getElementById('bulkImportSubmitBtn'),
      bulkImportResult: document.getElementById('bulkImportResult'),
      deleteConfirmModal: document.getElementById('deleteConfirmModal'),
      deleteMovieTitle: document.getElementById('deleteMovieTitle'),
      deleteCancelBtn: document.getElementById('deleteCancelBtn'),
      deleteConfirmBtn: document.getElementById('deleteConfirmBtn'),
    };

    this.init();
  }

  async init() {
    initTheme();
    this.bindEvents();
    await this.checkAuth();
  }

  bindEvents() {
    this.elements.loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    this.elements.logoutBtn?.addEventListener('click', () => this.handleLogout());

    this.elements.adminSearchInput?.addEventListener('input', this.debounce(() => {
      this.searchQuery = this.elements.adminSearchInput.value.trim();
      this.currentPage = 1;
      this.loadMovies();
    }, 300));

    this.elements.adminGenreFilter?.addEventListener('change', () => {
      this.genreFilter = this.elements.adminGenreFilter.value;
      this.currentPage = 1;
      this.loadMovies();
    });

    this.elements.adminSortSelect?.addEventListener('change', () => {
      this.sortBy = this.elements.adminSortSelect.value;
      this.currentPage = 1;
      this.loadMovies();
    });

    this.elements.addMovieBtn?.addEventListener('click', () => this.openAddForm());
    this.elements.formCloseBtn?.addEventListener('click', () => this.closeFormModal());
    this.elements.formCancelBtn?.addEventListener('click', () => this.closeFormModal());
    this.elements.movieForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    this.elements.bulkImportBtn?.addEventListener('click', () => this.openBulkImport());
    this.elements.bulkImportCloseBtn?.addEventListener('click', () => this.closeBulkImport());
    this.elements.bulkImportCancelBtn?.addEventListener('click', () => this.closeBulkImport());
    this.elements.bulkFileInput?.addEventListener('change', (e) => this.handleBulkFile(e));
    this.elements.bulkImportSubmitBtn?.addEventListener('click', () => this.handleBulkImport());

    this.elements.exportBtn?.addEventListener('click', () => this.handleExport());

    this.elements.deleteCancelBtn?.addEventListener('click', () => this.closeDeleteConfirm());
    this.elements.deleteConfirmBtn?.addEventListener('click', () => this.handleDeleteConfirm());

    document.querySelectorAll('.admin-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.admin-modal.active').forEach(modal => {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
        });
      }
    });

    this.elements.adminPagination?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
      const page = parseInt(btn.dataset.page, 10);
      if (Number.isFinite(page) && page !== this.currentPage) {
        this.currentPage = page;
        this.loadMovies(true);
      }
    });

    this.elements.adminTableBody?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.admin-edit-btn');
      const deleteBtn = e.target.closest('.admin-delete-btn');
      if (editBtn) {
        this.openEditForm(editBtn.dataset.id);
      } else if (deleteBtn) {
        this.openDeleteConfirm(deleteBtn.dataset.id, deleteBtn.dataset.title);
      }
    });
  }

  debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  async api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async checkAuth() {
    try {
      const res = await this.api('/auth/me');
      this.showDashboard(res.data.email);
    } catch {
      this.showLogin();
    }
  }

  showLogin() {
    this.elements.loginView.style.display = 'block';
    this.elements.dashboardView.style.display = 'none';
  }

  showDashboard(email) {
    this.elements.loginView.style.display = 'none';
    this.elements.dashboardView.style.display = 'block';
    this.elements.adminEmail.textContent = email;
    this.loadAllGenres();
    this.loadMovies();
  }

  async loadAllGenres() {
    try {
      const res = await this.api('/movies?limit=50');
      res.data.forEach(m => m.genres?.forEach(g => this.allGenres.add(g)));
      this.updateGenreFilter();
    } catch { /* will populate from pages */ }
  }

  async handleLogin() {
    const email = this.elements.loginEmail.value.trim();
    const password = this.elements.loginPassword.value;

    if (!email || !password) {
      this.elements.loginError.textContent = 'Please enter email and password';
      this.elements.loginError.style.display = 'block';
      return;
    }

    this.setButtonLoading(this.elements.loginBtn, true);
    this.elements.loginError.style.display = 'none';

    try {
      const res = await this.api('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      this.showDashboard(res.data.email);
    } catch (err) {
      this.elements.loginError.textContent = err.message || 'Login failed';
      this.elements.loginError.style.display = 'block';
    } finally {
      this.setButtonLoading(this.elements.loginBtn, false);
    }
  }

  async handleLogout() {
    try {
      await this.api('/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    this.showLogin();
  }

  async loadMovies(scrollToTop = false) {
    this.showLoading(true);

    const params = new URLSearchParams({
      page: this.currentPage,
      limit: this.pageSize,
      sort: this.sortBy
    });

    if (this.searchQuery) params.set('search', this.searchQuery);
    if (this.genreFilter && this.genreFilter !== 'All') params.set('genre', this.genreFilter);

    try {
      const res = await this.api(`/movies?${params.toString()}`);
      this.movies = res.data;
      this.totalItems = res.pagination.totalItems;
      this.totalPages = res.pagination.totalPages;
      this.currentPage = res.pagination.page;

      this.updateStats();
      this.updateGenreFilter();
      this.renderTable();
      this.renderPagination();
      this.showLoading(false);
    } catch (err) {
      this.showLoading(false);
      toast.show({ title: 'Error', message: err.message || 'Failed to load movies', type: 'error' });
    }
  }

  showLoading(show) {
    this.elements.adminLoading.style.display = show ? 'block' : 'none';
    this.elements.adminTable.style.display = show ? 'none' : 'table';
  }

  async updateStats() {
    try {
      const total = this.totalItems;

      let newReleaseCount = 0;
      try {
        const nrRes = await this.api('/movies?limit=50&isNewRelease=true');
        newReleaseCount = nrRes.pagination.totalItems;
      } catch { /* fallback */ }

      this.movies.forEach(m => m.genres?.forEach(g => this.allGenres.add(g)));

      this.elements.statTotal.textContent = total;
      this.elements.statNewReleases.textContent = newReleaseCount;
      this.elements.statGenres.textContent = this.allGenres.size;
    } catch { /* use current data */ }
  }

  updateGenreFilter() {
    const current = this.elements.adminGenreFilter.value;
    this.movies.forEach(m => m.genres?.forEach(g => this.allGenres.add(g)));

    const options = ['<option value="All">All Genres</option>'];
    [...this.allGenres].sort().forEach(g => {
      options.push(`<option value="${g}" ${g === current ? 'selected' : ''}>${g}</option>`);
    });
    this.elements.adminGenreFilter.innerHTML = options.join('');
  }

  renderTable() {
    const tbody = this.elements.adminTableBody;
    if (!this.movies.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="admin-empty-state">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <h3 class="empty-title">No Movies Found</h3>
          <p class="empty-description">No movies match your current search or filter.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = this.movies.map(movie => `
      <tr class="admin-table-row">
        <td class="td-poster">
          <img src="${movie.poster || './assets/images/poster-fallback.svg'}" alt="" class="admin-poster-thumb" loading="lazy"
            onerror="this.onerror=null; this.src='./assets/images/poster-fallback.svg';" />
        </td>
        <td class="td-title">
          <span class="admin-movie-title">${this.escapeHtml(movie.title)}</span>
          <span class="admin-movie-slug">${this.escapeHtml(movie.slug || '')}</span>
        </td>
        <td class="td-year">${movie.year || '—'}</td>
        <td class="td-rating">
          <span class="admin-rating-badge">${movie.rating?.toFixed(1) || '—'}</span>
        </td>
        <td class="td-genres">
          ${(movie.genres || []).slice(0, 2).map(g => `<span class="admin-genre-tag">${this.escapeHtml(g)}</span>`).join('')}
          ${(movie.genres || []).length > 2 ? `<span class="admin-genre-more">+${movie.genres.length - 2}</span>` : ''}
        </td>
        <td class="td-release">${movie.releaseDate || '—'}</td>
        <td class="td-new">${movie.isNewRelease ? '<span class="admin-new-badge">New</span>' : '—'}</td>
        <td class="td-actions">
          <button type="button" class="btn btn-sm btn-secondary admin-edit-btn" data-id="${movie._id}" aria-label="Edit ${this.escapeHtml(movie.title)}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button type="button" class="btn btn-sm btn-danger admin-delete-btn" data-id="${movie._id}" data-title="${this.escapeHtml(movie.title)}" aria-label="Delete ${this.escapeHtml(movie.title)}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const nav = this.elements.adminPagination;
    if (this.totalPages <= 1) {
      nav.innerHTML = '';
      nav.hidden = true;
      return;
    }
    nav.hidden = false;

    const items = this.getVisiblePages(this.currentPage, this.totalPages);
    const prevDisabled = this.currentPage <= 1;
    const nextDisabled = this.currentPage >= this.totalPages;

    let html = `
      <button type="button" class="pagination-nav" data-page="${this.currentPage - 1}" ${prevDisabled ? 'disabled' : ''} aria-label="Previous page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        <span class="pagination-nav-label">Previous</span>
      </button>
      <div class="pagination-pages" role="list">
    `;

    items.forEach(item => {
      if (item.type === 'ellipsis') {
        html += `<span class="pagination-ellipsis" aria-hidden="true">...</span>`;
      } else {
        const isCurrent = item.page === this.currentPage;
        html += `<button type="button" class="pagination-page${isCurrent ? ' is-current' : ''}" data-page="${item.page}" aria-label="Go to page ${item.page}" ${isCurrent ? 'aria-current="page"' : ''}>${item.page}</button>`;
      }
    });

    html += `</div>
      <button type="button" class="pagination-nav" data-page="${this.currentPage + 1}" ${nextDisabled ? 'disabled' : ''} aria-label="Next page">
        <span class="pagination-nav-label">Next</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    `;

    nav.innerHTML = html;
  }

  getVisiblePages(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => ({ type: 'page', page: i + 1 }));
    }
    const pages = new Set([1, total, current]);
    for (let o = 1; o <= 2; o++) {
      if (current - o >= 1) pages.add(current - o);
      if (current + o <= total) pages.add(current + o);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const items = [];
    let prev = 0;
    sorted.forEach(p => {
      if (prev && p - prev > 1) items.push({ type: 'ellipsis' });
      items.push({ type: 'page', page: p });
      prev = p;
    });
    return items;
  }

  openAddForm() {
    this.editingMovieId = null;
    this.elements.formModalTitle.textContent = 'Add Movie';
    this.elements.formSubmitBtn.querySelector('.btn-text').textContent = 'Save Movie';
    this.elements.movieForm.reset();
    document.getElementById('formMovieId').value = '';
    this.elements.formErrors.style.display = 'none';
    this.openModal(this.elements.movieFormModal);
  }

  async openEditForm(movieId) {
    this.editingMovieId = movieId;
    this.elements.formModalTitle.textContent = 'Edit Movie';
    this.elements.formSubmitBtn.querySelector('.btn-text').textContent = 'Update Movie';
    this.elements.formErrors.style.display = 'none';

    try {
      const res = await this.api(`/movies/${movieId}`);
      const m = res.data;

      document.getElementById('formMovieId').value = m._id;
      document.getElementById('formTitle').value = m.title || '';
      document.getElementById('formSlug').value = m.slug || '';
      document.getElementById('formTmdbId').value = m.tmdbId || '';
      document.getElementById('formYear').value = m.year || '';
      document.getElementById('formRating').value = m.rating || '';
      document.getElementById('formVotes').value = m.votes || '';
      document.getElementById('formDuration').value = m.duration || '';
      document.getElementById('formRuntime').value = m.runtime || '';
      document.getElementById('formTagline').value = m.tagline || '';
      document.getElementById('formGenres').value = (m.genres || []).join(', ');
      document.getElementById('formDirector').value = m.director || '';
      document.getElementById('formCast').value = (m.cast || []).join(', ');
      document.getElementById('formDescription').value = m.description || '';
      document.getElementById('formFullOverview').value = m.fullOverview || '';
      document.getElementById('formPoster').value = m.poster || '';
      document.getElementById('formBackdrop').value = m.backdrop || '';
      document.getElementById('formTrailerKey').value = m.trailerKey || '';
      document.getElementById('formTrailerUrl').value = m.trailerUrl || '';
      document.getElementById('formIsNewRelease').checked = m.isNewRelease || false;
      document.getElementById('formFeatured').checked = m.featured || false;
      document.getElementById('formReleaseDate').value = m.releaseDate || '';

      this.openModal(this.elements.movieFormModal);
    } catch (err) {
      toast.show({ title: 'Error', message: err.message, type: 'error' });
    }
  }

  closeFormModal() {
    this.closeModal(this.elements.movieFormModal);
    this.editingMovieId = null;
  }

  async handleFormSubmit() {
    const title = document.getElementById('formTitle').value.trim();
    if (!title) {
      this.showFormErrors({ title: 'Title is required' });
      return;
    }

    const movieData = {
      title,
      slug: document.getElementById('formSlug').value.trim() || undefined,
      tmdbId: document.getElementById('formTmdbId').value ? Number(document.getElementById('formTmdbId').value) : undefined,
      year: document.getElementById('formYear').value ? Number(document.getElementById('formYear').value) : undefined,
      rating: document.getElementById('formRating').value ? Number(document.getElementById('formRating').value) : 0,
      votes: document.getElementById('formVotes').value.trim(),
      duration: document.getElementById('formDuration').value.trim(),
      runtime: document.getElementById('formRuntime').value ? Number(document.getElementById('formRuntime').value) : 0,
      tagline: document.getElementById('formTagline').value.trim(),
      genres: document.getElementById('formGenres').value.split(',').map(g => g.trim()).filter(Boolean),
      director: document.getElementById('formDirector').value.trim(),
      cast: document.getElementById('formCast').value.split(',').map(c => c.trim()).filter(Boolean),
      description: document.getElementById('formDescription').value.trim(),
      fullOverview: document.getElementById('formFullOverview').value.trim(),
      poster: document.getElementById('formPoster').value.trim(),
      backdrop: document.getElementById('formBackdrop').value.trim(),
      trailerKey: document.getElementById('formTrailerKey').value.trim(),
      trailerUrl: document.getElementById('formTrailerUrl').value.trim(),
      isNewRelease: document.getElementById('formIsNewRelease').checked,
      featured: document.getElementById('formFeatured').checked,
      releaseDate: document.getElementById('formReleaseDate').value.trim()
    };

    this.setButtonLoading(this.elements.formSubmitBtn, true);
    this.elements.formErrors.style.display = 'none';

    try {
      if (this.editingMovieId) {
        await this.api(`/movies/${this.editingMovieId}`, { method: 'PUT', body: movieData });
        toast.show({ title: 'Success', message: 'Movie updated successfully', type: 'success' });
      } else {
        await this.api('/movies', { method: 'POST', body: movieData });
        toast.show({ title: 'Success', message: 'Movie added successfully', type: 'success' });
      }
      this.closeFormModal();
      this.loadMovies();
    } catch (err) {
      if (err.message.includes('Validation failed')) {
        this.showFormErrors({ general: err.message });
      } else {
        toast.show({ title: 'Error', message: err.message, type: 'error' });
      }
    } finally {
      this.setButtonLoading(this.elements.formSubmitBtn, false);
    }
  }

  showFormErrors(errors) {
    const container = this.elements.formErrors;
    if (!container) return;
    container.innerHTML = Object.entries(errors)
      .map(([field, msg]) => `<p class="form-error-item"><strong>${field}:</strong> ${msg}</p>`)
      .join('');
    container.style.display = 'block';
  }

  openDeleteConfirm(movieId, title) {
    this.deleteMovieId = movieId;
    this.elements.deleteMovieTitle.textContent = title;
    this.openModal(this.elements.deleteConfirmModal);
  }

  closeDeleteConfirm() {
    this.closeModal(this.elements.deleteConfirmModal);
    this.deleteMovieId = null;
  }

  async handleDeleteConfirm() {
    if (!this.deleteMovieId) return;

    this.setButtonLoading(this.elements.deleteConfirmBtn, true);

    try {
      await this.api(`/movies/${this.deleteMovieId}`, { method: 'DELETE' });
      toast.show({ title: 'Success', message: 'Movie deleted successfully', type: 'success' });
      this.closeDeleteConfirm();
      if (this.movies.length === 1 && this.currentPage > 1) {
        this.currentPage--;
      }
      this.loadMovies();
    } catch (err) {
      toast.show({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      this.setButtonLoading(this.elements.deleteConfirmBtn, false);
    }
  }

  openBulkImport() {
    this.bulkData = null;
    this.elements.bulkImportUpload.style.display = 'flex';
    this.elements.bulkImportPreview.style.display = 'none';
    this.elements.bulkImportResult.style.display = 'none';
    this.elements.bulkFileInput.value = '';
    this.elements.bulkImportSubmitBtn.disabled = true;
    this.openModal(this.elements.bulkImportModal);
  }

  closeBulkImport() {
    this.closeModal(this.elements.bulkImportModal);
    this.bulkData = null;
  }

  handleBulkFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.show({ title: 'Error', message: 'File size must be under 5MB', type: 'error' });
      return;
    }

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      toast.show({ title: 'Error', message: 'Please select a JSON file', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          toast.show({ title: 'Error', message: 'JSON file must contain an array of movies', type: 'error' });
          return;
        }

        this.bulkData = data;
        let valid = 0;
        let invalid = 0;
        const errors = [];

        data.forEach((movie, i) => {
          if (!movie.title || typeof movie.title !== 'string') {
            invalid++;
            errors.push(`Row ${i + 1}: Missing or invalid title`);
          } else {
            valid++;
          }
        });

        this.elements.bulkImportUpload.style.display = 'none';
        this.elements.bulkImportPreview.style.display = 'block';
        this.elements.bulkImportFileInfo.textContent = `File: ${file.name}`;
        this.elements.bulkImportStats.textContent = `${data.length} movies detected — ${valid} valid, ${invalid} invalid`;

        if (errors.length > 0) {
          this.elements.bulkImportErrors.style.display = 'block';
          this.elements.bulkImportErrors.innerHTML = errors.slice(0, 10).map(e => `<p class="bulk-error-item">${e}</p>`).join('');
        } else {
          this.elements.bulkImportErrors.style.display = 'none';
        }

        this.elements.bulkImportSubmitBtn.disabled = invalid > 0;
      } catch {
        toast.show({ title: 'Error', message: 'Invalid JSON file', type: 'error' });
      }
    };
    reader.readAsText(file);
  }

  async handleBulkImport() {
    if (!this.bulkData) return;

    this.setButtonLoading(this.elements.bulkImportSubmitBtn, true);

    try {
      const res = await this.api('/movies/bulk', {
        method: 'POST',
        body: { movies: this.bulkData }
      });

      this.elements.bulkImportPreview.style.display = 'none';
      this.elements.bulkImportResult.style.display = 'block';
      this.elements.bulkImportResult.innerHTML = `
        <div class="bulk-result-success">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3>Import Complete</h3>
          <p><strong>${res.data.inserted}</strong> movies imported</p>
          <p><strong>${res.data.skipped}</strong> duplicates skipped</p>
          <p><strong>${res.data.invalid}</strong> invalid records</p>
          <button type="button" class="btn btn-primary" id="bulkImportDoneBtn">Done</button>
        </div>
      `;

      document.getElementById('bulkImportDoneBtn')?.addEventListener('click', () => {
        this.closeBulkImport();
        this.loadMovies();
      });

      toast.show({ title: 'Success', message: `${res.data.inserted} movies imported successfully`, type: 'success' });
    } catch (err) {
      toast.show({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      this.setButtonLoading(this.elements.bulkImportSubmitBtn, false);
    }
  }

  async handleExport() {
    try {
      const res = await fetch(`${API_BASE}/movies/export/json`, { credentials: 'include' });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cinescope-movies.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.show({ title: 'Success', message: 'Movies exported successfully', type: 'success' });
    } catch (err) {
      toast.show({ title: 'Error', message: 'Failed to export movies', type: 'error' });
    }
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  setButtonLoading(btn, loading) {
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    if (loading) {
      btn.disabled = true;
      if (text) text.style.display = 'none';
      if (spinner) spinner.style.display = 'inline-block';
    } else {
      btn.disabled = false;
      if (text) text.style.display = '';
      if (spinner) spinner.style.display = 'none';
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminApp();
});
