// ==========================================================================
// Root Layout — global metadata, fonts, theme bootstrap
// ==========================================================================

import '@/styles/main.scss';

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cinescope-movie-details.vercel.app'),
    title: {
        default: 'CineScope — Modern English Movie Discovery',
        template: '%s | CineScope'
    },
    description:
        'CineScope — Discover top English movies, ratings, genres, and cinematic stories with our modern and responsive movie discovery platform.',
    icons: {
        icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }]
    }
};

export const viewport = {
    themeColor: '#0b0f17',
    width: 'device-width',
    initialScale: 1
};

// Applied before paint so the persisted theme never flashes and React
// hydrates against the same data-theme attribute (no hydration warning).
const themeBootstrap = `(function(){try{var t=localStorage.getItem('cinescope_theme_preference');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
            </head>
            <body>{children}</body>
        </html>
    );
}