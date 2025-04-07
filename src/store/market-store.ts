// store/market-store.ts
import { create } from 'zustand'

// Define Pool interface to match what's used in components
export interface Pool {
  baseCurrency: string
  coin: string
  id: string
  lotSize: string
  maxOrderAmount: string
  orderBook: string
  quoteCurrency: string
  timestamp: number
}

export interface MarketData {
  price: number | null
  priceChange24h: number | null
  priceChangePercent24h: number | null
  volume: bigint | null
  pair: string | null
}

interface MarketStore {
  // Selected pool data
  selectedPoolId: string | null
  setSelectedPoolId: (poolId: string) => void
  
  // Selected pool object (full data)
  selectedPool: Pool | null
  setSelectedPool: (pool: Pool) => void
  
  // Market data
  marketData: MarketData
  setMarketData: (data: MarketData) => void
  
  // Default values
  DEFAULT_PAIR: string
}

export const useMarketStore = create<MarketStore>((set) => ({
  // Selected pool
  selectedPoolId: null,
  setSelectedPoolId: (poolId) => set({ selectedPoolId: poolId }),
  
  // Selected pool object
  selectedPool: null,
  setSelectedPool: (pool) => set({ selectedPool: pool }),
  
  // Market data
  marketData: {
    price: null,
    priceChange24h: null,
    priceChangePercent24h: null,
    volume: null,
    pair: null
  },
  setMarketData: (data) => set({ marketData: data }),
  
  // Default values
  DEFAULT_PAIR: 'WETH/USDC'
}))