// store/market-store.ts
import { create } from 'zustand';

// Define Pool interface to match what's used in components
export interface Pool {
  id: string;
  coin: string;
  orderBook: string;
  timestamp: number;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimals: number | undefined;
  quoteDecimals: number | undefined;
}

export interface MarketData {
  price: number | null;
  priceChange24h: number | null;
  priceChangePercent24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume: bigint | null;
  pair: string | null;
}

interface MarketStore {
  // Selected pool data
  selectedPoolId: string | null;
  setSelectedPoolId: (poolId: string) => void;

  // Selected pool object (full data)
  selectedPool: Pool | null;
  setSelectedPool: (pool: Pool) => void;

  // Market data
  marketData: MarketData;
  setMarketData: (data: MarketData) => void;

  // URL-related utilities
  syncWithUrl: (pathname: string | null, pools: Pool[]) => string | null;
  findDefaultPool: (pools: Pool[]) => Pool | null;
  getUrlFromPool: (poolId: string) => string;

  // Default values
  DEFAULT_PAIR: string;

  // Decimals
  baseDecimals: number;
  quoteDecimals: number;
  setBaseDecimals: (decimals: number) => void;
  setQuoteDecimals: (decimals: number) => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  // Selected pool
  selectedPoolId: null,
  setSelectedPoolId: poolId => set({ selectedPoolId: poolId }),

  // Selected pool object
  selectedPool: null,
  setSelectedPool: (pool: Pool) => set({ selectedPool: pool }),

  // Market data
  marketData: {
    price: null,
    priceChange24h: null,
    priceChangePercent24h: null,
    high24h: null,
    low24h: null,
    volume: null,
    pair: null,
  },
  setMarketData: (data: MarketData) => set({ marketData: data }),

  // URL-related utilities
  syncWithUrl: (pathname, pools) => {
    if (!pathname || !pools || pools.length === 0) return null;

    // Extract the pool ID from the URL if it exists
    const urlParts = pathname.split('/');
    if (urlParts.length >= 3) {
      const poolIdFromUrl = urlParts[2];

      // Check if this pool ID exists in our data
      const poolExists = pools.some(pool => pool.id === poolIdFromUrl);

      if (poolExists) {
        // Set the pool ID and pool object
        set({
          selectedPoolId: poolIdFromUrl,
          selectedPool: pools.find(pool => pool.id === poolIdFromUrl) || null,
        });
        return poolIdFromUrl;
      }
    }

    // If we couldn't set from URL, use default logic
    const defaultPool = get().findDefaultPool(pools);
    if (defaultPool) {
      set({
        selectedPoolId: defaultPool.id,
        selectedPool: defaultPool,
      });
      return defaultPool.id;
    }

    return null;
  },

  // Helper to find the default pool based on preferences
  findDefaultPool: pools => {
    if (!pools || pools.length === 0) return null;

    const DEFAULT_PAIR = get().DEFAULT_PAIR;

    // Find WETH/USDC pair based on DEFAULT_PAIR
    const defaultPool = pools.find(
      pool =>
        pool.coin?.toLowerCase() === DEFAULT_PAIR.toLowerCase() ||
        (pool.baseTokenAddress?.toLowerCase() === 'weth' &&
          pool.quoteTokenAddress?.toLowerCase() === 'usdc')
    );

    // As a backup, look for anything with WETH in it
    const wethFallbackPool = !defaultPool
      ? pools.find(pool => pool.coin?.toLowerCase().includes('weth'))
      : null;

    // Set default if found, then try fallback, otherwise use first pool
    if (defaultPool) return defaultPool;
    if (wethFallbackPool) return wethFallbackPool;
    return pools[0];
  },

  // Generate a URL for a given pool ID
  getUrlFromPool: poolId => {
    return `/spot/${poolId}`;
  },

  // Default values
  DEFAULT_PAIR: 'WETH/USDC',

  // Decimals
  baseDecimals: 18,
  quoteDecimals: 6,
  setBaseDecimals: (decimals: number) => set({ baseDecimals: decimals }),
  setQuoteDecimals: (decimals: number) => set({ quoteDecimals: decimals }),
}));
