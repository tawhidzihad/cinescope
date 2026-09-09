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
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                pathname: '/t/p/**'
            }
        ]
    }
};

export default nextConfig;