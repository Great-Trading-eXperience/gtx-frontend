/**
 * Centralized API endpoints and URLs
 * Replace hardcoded URLs throughout the codebase
 */

export const API_ENDPOINTS = {
  // Analytics API
  ANALYTICS_BASE_URL: 'https://stats.gtxdex.xyz',
  
  // Subgraph URLs
  SUBGRAPH: {
    IDRT: 'https://api.studio.thegraph.com/query/93430/idrt/v0.0.1',
    WETH: 'https://api.studio.thegraph.com/query/93430/weth/v0.0.1',
    PERPETUAL: 'https://gtx-monad-perpetual-indexer.bobbyfiando.com',
  },
  
  // RPC URLs (should be moved to environment variables)
  RPC: {
    ODYSSEY: 'https://odyssey.ithaca.xyz',
    RARI_TESTNET: 'https://testnet.rpc.rarichain.org/http',
    ESPRESSO_TESTNET: 'https://appchain.caff.testnet.espresso.network',
    SEPOLIA_ROLLUP: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
  
  // Explorer URLs
  EXPLORERS: {
    ODYSSEY: 'https://odyssey-explorer.ithaca.xyz',
    RARI_TESTNET: 'https://rari-testnet.hub.caldera.xyz',
    ESPRESSO_TESTNET: 'https://appchaintestnet.hub.caldera.xyz',
  },
  
  // External URLs
  DOCS: 'https://docs.gtxdex.xyz',
  TWITTER: 'https://x.com/gtx_dex',
  
  // Chart library rewrites
  CHART_LIBRARY: 'https://chart.gtxdex.xyz/charting_library',
  CORE_DEVNET: 'https://core-devnet.gtxdex.xyz',
  SIDE_DEVNET: 'https://side-devnet.gtxdex.xyz',
} as const;