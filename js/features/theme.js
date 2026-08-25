// ==========================================================================
// Theme Management Feature
// ==========================================================================

const THEME_STORAGE_KEY = 'cinescope_theme_preference';

class ThemeManager {
  constructor() {
    this.themeToggles = document.querySelectorAll('.theme-toggle');
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    this.applyTheme(initialTheme);
    this.initEventListeners();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    this.themeToggles.forEach(btn => {
      btn.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
      btn.setAttribute('title', `Switch to ${nextTheme} mode`);
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    this.applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }

  initEventListeners() {
    this.themeToggles.forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });

    // Listen to system preference changes if user hasn't explicitly set one
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

export function initTheme() {
  return new ThemeManager();
}
