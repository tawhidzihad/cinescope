'use client';

// ==========================================================================
// Hero Carousel — Swiper.js (client component, isolated interactivity)
// ==========================================================================
// Data is fetched server-side in app/page.jsx and passed in as props.
// Supports autoplay, nav controls, pagination, keyboard, touch, reduced
// motion, and accessible labels (spec §27).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const FALLBACK_BACKDROP = '/images/poster-fallback.svg';

export default function HeroCarousel({ movies, isFallback = false }) {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(media.matches);
        const onChange = (event) => setReducedMotion(event.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    if (!movies || movies.length === 0) {
        return (
            <section className="hero-section" aria-label="Featured Movie Spotlight">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-spotlight-badge">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Featured Spotlight
                        </div>
                        <h1 className="hero-title">Discover exceptional cinema</h1>
                        <p className="hero-description">
                            Browse the full CineScope catalog for ratings, genres, and cinematic stories.
                        </p>
                        <div className="hero-actions">
                            <Link href="/movies" className="btn btn-primary">Explore Catalog</Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="hero-section" aria-label="Featured Movie Spotlight">
            <Swiper
                modules={[Autoplay, Navigation, Pagination, Keyboard, A11y]}
                slidesPerView={1}
                loop={movies.length > 1}
                autoplay={reducedMotion ? false : { delay: 6500, disableOnInteraction: false }}
                speed={reducedMotion ? 0 : 700}
                navigation={{
                    nextEl: '.hero-swiper-next',
                    prevEl: '.hero-swiper-prev'
                }}
                pagination={{ el: '.hero-swiper-pagination', clickable: true }}
                keyboard={{ enabled: true }}
                a11y={{
                    prevSlideMessage: 'Previous featured movie',
                    nextSlideMessage: 'Next featured movie'
                }}
                className="hero-swiper"
            >
                {movies.map((movie) => (
                    <SwiperSlide key={movie._id}>
                        <div className="hero-backdrop">
                            <Image
                                src={movie.backdrop || movie.poster || FALLBACK_BACKDROP}
                                alt=""
                                fill
                                priority
                                sizes="100vw"
                                className="hero-backdrop-img"
                            />
                            <div className="hero-overlay" />
                        </div>

                        <div className="container">
                            <div className="hero-content">
                                <div className="hero-spotlight-badge">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"
                                        aria-hidden="true">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    {isFallback ? 'Featured From the Catalog' : 'New Release'}
                                </div>

                                <h2 className="hero-title">{movie.title}</h2>

                                <div className="hero-meta">
                                    {movie.rating > 0 && (
                                        <span className="hero-meta-item hero-rating">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"
                                                aria-hidden="true">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                            {movie.rating.toFixed(1)}
                                        </span>
                                    )}
                                    {movie.year && <span className="hero-meta-item">{movie.year}</span>}
                                    {movie.duration && <span className="hero-meta-item">{movie.duration}</span>}
                                    {(movie.genres || []).slice(0, 3).map((genre) => (
                                        <span key={genre} className="hero-meta-item hero-genre">{genre}</span>
                                    ))}
                                </div>

                                <p className="hero-description">{movie.description}</p>

                                <div className="hero-actions">
                                    <Link href={`/movie/${movie.slug}`} className="btn btn-primary">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="16" x2="12" y2="12" />
                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        View Movie Details
                                    </Link>
                                    <Link href="/movies" className="btn btn-glass">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                        Explore Catalog
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <div className="hero-swiper-controls container" aria-hidden="false">
                <button type="button" className="hero-swiper-prev hero-nav-btn" aria-label="Previous featured movie">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className="hero-swiper-pagination" />
                <button type="button" className="hero-swiper-next hero-nav-btn" aria-label="Next featured movie">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </section>
    );
}