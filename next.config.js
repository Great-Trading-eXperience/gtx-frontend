const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Temporarily disabled for WebSocket testing
    // Force dynamic rendering to avoid Privy SSG issues
    experimental: {
        outputFileTracingIncludes: {
            '/_not-found': ['./src/**/*'],
        },
    },
    webpack: (config, { isServer }) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };

        // Mark farcaster SDK as external for server-side rendering
        if (isServer) {
            config.externals = config.externals || [];
            if (Array.isArray(config.externals)) {
                config.externals.push('@farcaster/miniapp-sdk');
            }
        }

        return config;
    },
    publicRuntimeConfig: {
        NEXT_PUBLIC_DEFAULT_CHAIN: process.env.NEXT_PUBLIC_DEFAULT_CHAIN,
        NEXT_PUBLIC_USE_SUBGRAPH: process.env.NEXT_PUBLIC_USE_SUBGRAPH,
        NEXT_PUBLIC_CLOB_31337_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_31337_INDEXER_URL,
        NEXT_PUBLIC_CLOB_31338_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_31338_INDEXER_URL,
        NEXT_PUBLIC_CLOB_1020201_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_1020201_INDEXER_URL,
        NEXT_PUBLIC_CLOB_50002_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_50002_INDEXER_URL,
        NEXT_PUBLIC_CLOB_11155931_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_11155931_INDEXER_URL,
        NEXT_PUBLIC_CLOB_31337_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_31337_KLINE_URL,
        NEXT_PUBLIC_CLOB_31338_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_31338_KLINE_URL,
        NEXT_PUBLIC_CLOB_1020201_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_1020201_KLINE_URL,
        NEXT_PUBLIC_CLOB_50002_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_50002_KLINE_URL,
        NEXT_PUBLIC_CLOB_11155931_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_11155931_KLINE_URL,
        NEXT_PUBLIC_CLOB_1918988905_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_1918988905_INDEXER_URL,
        NEXT_PUBLIC_CLOB_4661_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_4661_INDEXER_URL,
        NEXT_PUBLIC_CLOB_1918988905_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_1918988905_KLINE_URL,
        NEXT_PUBLIC_CLOB_4661_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_4661_KLINE_URL,
        NEXT_PUBLIC_GTX_ROUTER_31338_ADDRESS: process.env.NEXT_PUBLIC_GTX_ROUTER_31338_ADDRESS,
        NEXT_PUBLIC_GTX_ROUTER_1020201_ADDRESS: process.env.NEXT_PUBLIC_GTX_ROUTER_1020201_ADDRESS,
        NEXT_PUBLIC_BALANCE_MANAGER_31338_ADDRESS: process.env.NEXT_PUBLIC_BALANCE_MANAGER_31338_ADDRESS,
        NEXT_PUBLIC_BALANCE_MANAGER_1020201_ADDRESS: process.env.NEXT_PUBLIC_BALANCE_MANAGER_1020201_ADDRESS,
        NEXT_PUBLIC_POOL_MANAGER_31338_ADDRESS: process.env.NEXT_PUBLIC_POOL_MANAGER_31338_ADDRESS,
        NEXT_PUBLIC_POOL_MANAGER_1020201_ADDRESS: process.env.NEXT_PUBLIC_POOL_MANAGER_1020201_ADDRESS,
        NEXT_PUBLIC_EXPLORER_31338_URL: process.env.NEXT_PUBLIC_EXPLORER_31338_URL,
        NEXT_PUBLIC_EXPLORER_1020201_URL: process.env.NEXT_PUBLIC_EXPLORER_1020201_URL,
        NEXT_PUBLIC_EXPLORER_50002_URL: process.env.NEXT_PUBLIC_EXPLORER_50002_URL,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    async rewrites() {
        return [
            {
                source: '/charting_library/:path*',
                destination: 'https://chart.gtxdex.xyz/charting_library/:path*',
            },
            {
                source: '/core-anvil-api/:path*',
                destination: 'https://anvil.gtxdex.xyz/:path*',
            },
            {
                source: '/side-anvil-api/:path*',
                destination: 'https://side-anvil.gtxdex.xyz/:path*',
            },
        ];
    },

    async headers() {
        return [
            // Cache static assets (images, icons, logos)
            {
                source: '/logo/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year
                    },
                ],
            },
            {
                source: '/tokens/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year
                    },
                ],
            },
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year
                    },
                ],
            },
            {
                source: '/icon/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year
                    },
                ],
            },
            {
                source: '/network/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year
                    },
                ],
            },// Cache specific common static files
            {
                source: '/(favicon.ico|robots.txt|sitemap.xml)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400', // 1 day
                    },
                ],
            },
            // Cache built JS and CSS files
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year
                    },
                ],
            },
            // API routes - short cache with revalidation
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=60, stale-while-revalidate=300', // 1 min cache, revalidate in 5 min
                    },
                ],
            },
        ];
    },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: "4509846877306880",
  project: "4509847025221632",
}, {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});