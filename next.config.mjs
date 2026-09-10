/** @type {import('next').NextConfig} */
const nextConfig = {
    // Keep native/server-only packages external to the bundler so they run
    // correctly inside Node serverless functions.
    serverExternalPackages: [
        'mongodb',
        'express',
        'express-session',
        'connect-mongo',
        'serverless-http',
        'bcryptjs',
        'helmet',
        'cors'
    ],
    images: {
        // Vercel's services-mode deployments do not provide the /_next/image
        // optimizer function yet, so render remote images unoptimized (TMDB
        // already serves correctly sized variants). remotePatterns are kept
        // so the config is ready if optimization is enabled later.
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                pathname: '/t/p/**'
            },
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
                pathname: '/vi/**'
            },
            {
                protocol: 'https',
                hostname: 'i.ytimg.com',
                pathname: '/vi/**'
            }
        ]
    }
};

export default nextConfig;