'use client';

// ==========================================================================
// Hero Carousel — Swiper.js (client component, isolated interactivity)
// ==========================================================================
// Data is fetched server-side in app/page.jsx and passed in as props.
// Features: auto-rotating new-release slides with a fade crossfade,
// clickable prev/next arrows, clickable pagination bullets, an autoplay
// progress bar, keyboard/touch support, reduced-motion awareness, and
// accessible labels (spec §27).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const FALLBACK_IMAGE = '/images/poster-fallback.svg';
const AUTOPLAY_DELAY = 5500;

export default function HeroCarousel({ movies, isFallback = false }) {
    const [reducedMotion, setReducedMotion] = useState(false);
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const paginationRef = useRef(null);
    const progressRef = useRef(null);

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
            <div className="hero-swiper-wrapper">
                <Swiper
                    modules={[Autoplay, EffectFade, Navigation, Pagination, Keyboard, A11y]}
                    slidesPerView={1}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    loop={movies.length > 1}
                    speed={reducedMotion ? 0 : 900}
                    autoplay={reducedMotion ? false : {
                        delay: AUTOPLAY_DELAY,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true
                    }}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current
                    }}
                    pagination={{ el: paginationRef.current, clickable: true }}
                    keyboard={{ enabled: true, onlyInViewport: true }}
                    a11y={{
                        prevSlideMessage: 'Previous featured movie',
                        nextSlideMessage: 'Next featured movie'
                    }}
                    onBeforeInit={(swiper) => {
                        // Bind the custom sibling controls before Swiper initializes.
                        if (swiper.params.navigation) {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                        }
                        if (swiper.params.pagination) {
                            swiper.params.pagination.el = paginationRef.current;
                        }
                    }}
                    onAutoplayTimeLeft={(_swiper, _timeLeft, progress) => {
                        // progress is the remaining fraction (1 -> 0); fill the bar as it elapses.
                        if (progressRef.current) {
                            progressRef.current.style.transform = `scaleX(${1 - progress})`;
                        }
                    }}
                    className="hero-swiper"
                >
                    {movies.map((movie) => (
                        <SwiperSlide key={movie._id} className="hero-slide">
                            <div className="hero-backdrop">
                                <Image
                                    src={movie.backdrop || movie.poster || FALLBACK_IMAGE}
                                    alt=""
                                    fill
                                    priority
                                    sizes="100vw"
                                    className="hero-backdrop-img"
                                />
                                <div className="hero-overlay" />
                            </div>

                            <div className="container">
                                <div className="hero-slide-inner">
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

                                    <div className="hero-poster-card" aria-hidden="true">
                                        <Image
                                            src={movie.poster || movie.backdrop || FALLBACK_IMAGE}
                                            alt=""
                                            fill
                                            sizes="280px"
                                            className="hero-poster-img"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button
                    ref={prevRef}
                    type="button"
                    className="hero-carousel-nav hero-carousel-prev"
                    aria-label="Previous featured movie"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button
                    ref={nextRef}
                    type="button"
                    className="hero-carousel-nav hero-carousel-next"
                    aria-label="Next featured movie"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>

                <div ref={paginationRef} className="hero-swiper-pagination" />

                {!reducedMotion && (
                    <div className="hero-progress" aria-hidden="true">
                        <span ref={progressRef} className="hero-progress-bar" />
                    </div>
                )}
            </div>
        </section>
    );
}