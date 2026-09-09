// ==========================================================================
// Footer — server component (static markup)
// ==========================================================================

import Link from 'next/link';
import { BrandIcon } from './Navbar';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <Link href="/" className="brand" aria-label="CineScope Home">
                            <span className="brand-icon" aria-hidden="true">
                                <BrandIcon size={24} />
                            </span>
                            <span>CINE<span className="brand-highlight">SCOPE</span></span>
                        </Link>
                        <p>An English movie discovery platform — Next.js App Router, SCSS, and an Express +
                            MongoDB backend.</p>
                    </div>

                    <div className="footer-tech-stack">
                        <span className="tech-label">Architecture & Stack</span>
                        <div className="tech-badges">
                            <span className="tech-badge">Next.js App Router</span>
                            <span className="tech-badge">Server Components</span>
                            <span className="tech-badge">SCSS 7-1 Modular</span>
                            <span className="tech-badge">Express + MongoDB</span>
                            <span className="tech-badge">Swiper.js Hero</span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} CineScope. Crafted with senior full-stack excellence.</p>
                    <Link href="#mainContent" className="back-to-top" aria-label="Scroll back to top of page">
                        Back to top
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" aria-hidden="true">
                            <path d="m18 15-6-6-6 6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </footer>
    );
}