// ==========================================================================
// Mobile Navigation Feature
// ==========================================================================

export class MobileNavManager {
  constructor() {
    this.toggleBtn = document.getElementById('mobileMenuToggle');
    this.drawer = document.getElementById('mobileDrawer');
    this.navLinks = this.drawer?.querySelectorAll('.mobile-nav-link');
    this.isOpen = false;

    this.initEventListeners();
  }

  initEventListeners() {
    if (!this.toggleBtn || !this.drawer) return;

    this.toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    // Close mobile menu when any nav link is clicked
    this.navLinks?.forEach(link => {
      link.addEventListener('click', () => {
        this.close();
      });
    });

    // Close on window resize if expanded above mobile breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.toggleBtn.classList.add('active');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this.drawer.classList.add('open');
    this.drawer.setAttribute('aria-hidden', 'false');
  }

  close() {
    this.isOpen = false;
    this.toggleBtn.classList.remove('active');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
  }
}

export function initMobileNav() {
  return new MobileNavManager();
}
