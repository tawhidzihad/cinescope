// ==========================================================================
// Navbar — server component shell with small client islands
// ==========================================================================

import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchBox from '@/components/ui/SearchBox';
import MobileMenu from '@/components/ui/MobileMenu';

function BrandIcon({ size = 28 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
    );
}

export { BrandIcon };

export default function Navbar() {
    return (
        <header className="header">
            <div className="container navbar">
                <Link href="/" className="brand" aria-label="CineScope Home">
                    <span className="brand-icon" aria-hidden="true">
                        <BrandIcon />
                    </span>
                    <span>CINE<span className="brand-highlight">SCOPE</span></span>
                </Link>

                <nav className="nav-links" aria-label="Primary Navigation">
                    <Link href="/movies" className="nav-link">Discover</Link>
                    <Link href="/movies?sort=rating-desc" className="nav-link">Top Rated</Link>
                    <Link href="/movies?sort=year-desc" className="nav-link">New Releases</Link>
                </nav>

                <div className="nav-controls">
                    <div className="nav-search" role="search">
                        <SearchBox />
                    </div>

                    <ThemeToggle />

                    <MobileMenu />
                </div>
            </div>
        </header>
    );
}