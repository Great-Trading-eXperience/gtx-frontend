/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.fallback = {fs: false, net: false, tls: false};
        return config;
    },
    publicRuntimeConfig: {
        NEXT_PUBLIC_DEFAULT_CHAIN: process.env.NEXT_PUBLIC_DEFAULT_CHAIN,
        NEXT_PUBLIC_CLOB_31338_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_31338_INDEXER_URL,
        NEXT_PUBLIC_CLOB_1020201_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_1020201_INDEXER_URL,
        NEXT_PUBLIC_GTX_ROUTER_31338_ADDRESS: process.env.NEXT_PUBLIC_GTX_ROUTER_31338_ADDRESS,
        NEXT_PUBLIC_GTX_ROUTER_1020201_ADDRESS: process.env.NEXT_PUBLIC_GTX_ROUTER_1020201_ADDRESS,
        NEXT_PUBLIC_BALANCE_MANAGER_31338_ADDRESS: process.env.NEXT_PUBLIC_BALANCE_MANAGER_31338_ADDRESS,
        NEXT_PUBLIC_BALANCE_MANAGER_1020201_ADDRESS: process.env.NEXT_PUBLIC_BALANCE_MANAGER_1020201_ADDRESS,
        NEXT_PUBLIC_POOL_MANAGER_31338_ADDRESS: process.env.NEXT_PUBLIC_POOL_MANAGER_31338_ADDRESS,
        NEXT_PUBLIC_POOL_MANAGER_1020201_ADDRESS: process.env.NEXT_PUBLIC_POOL_MANAGER_1020201_ADDRESS,
    },

    typescript: {
        ignoreBuildErrors: true,
    },

};

module.exports = nextConfig;
