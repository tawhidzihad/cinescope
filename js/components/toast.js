// ==========================================================================
// CineScope Toast Notification Component
// Accessible, non-blocking notifications with automatic dismissal
// ==========================================================================

class ToastController {
  constructor() {
    this.container = null;
    this.timeout = null;
    this.ensureContainer();
  }

  ensureContainer() {
    if (this.container && document.body.contains(this.container)) return;

    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Shows a toast message
   * @param {Object} options
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast body text
   * @param {string} [options.type='info'] - 'info' | 'warning' | 'error' | 'success'
   * @param {number} [options.duration=4000] - Duration in ms
   */
  show({ title = 'Notification', message = '', type = 'info', duration = 4000 }) {
    this.ensureContainer();

    // Remove any existing toast
    const existing = this.container.querySelector('.toast');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    let iconSvg = '';
    if (type === 'warning' || type === 'info') {
      iconSvg = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      `;
    } else if (type === 'success') {
      iconSvg = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <h4 class="toast-title">${title}</h4>
        ${message ? `<p class="toast-message">${message}</p>` : ''}
      </div>
      <button type="button" class="toast-close" aria-label="Close notification">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    // Auto dismiss
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  }

  dismiss(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.remove('visible');
    toast.classList.add('dismissing');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }
}

export const toast = new ToastController();
