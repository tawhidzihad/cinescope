'use client';

// ==========================================================================
// Mobile Menu — hamburger drawer for small screens
// ==========================================================================
// Migrated from js/features/mobile-nav.js.

import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
    const [open, setOpen] = useState(false);

    const close = () => {
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                className={`mobile-menu-toggle${open ? ' is-active' : ''}`}
                aria-label="Toggle navigation menu"
                aria-expanded={open}
                aria-controls="mobileDrawer"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span />
                <span />
                <span />
            </button>

            <div className={`mobile-drawer${open ? ' is-open' : ''}`} id="mobileDrawer" aria-hidden={!open}>
                <nav className="mobile-nav-links" aria-label="Mobile Navigation">
                    <Link href="/movies" className="mobile-nav-link" onClick={close}>Discover Movies</Link>
                    <Link href="/movies?sort=rating-desc" className="mobile-nav-link" onClick={close}>Top Rated</Link>
                    <Link href="/movies?sort=year-desc" className="mobile-nav-link" onClick={close}>New Releases</Link>
                </nav>
            </div>
        </>
    );
}