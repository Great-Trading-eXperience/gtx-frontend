// store/perpetual-market-store.ts
import { create } from 'zustand'

// Define Market interfaces to match what's used in components
export interface Market {
  blockNumber: number;
  id: string;
  longToken: `0x${string}`; // Updated to use the HexAddress pattern
  marketToken: `0x${string}`; // Updated to use the HexAddress pattern
  name: string;
  shortToken: `0x${string}`; // Updated to use the HexAddress pattern
  timestamp: number;
  transactionHash: string;
}

export interface MarketPair {
  id: string;
  symbol: string;
  name: string;
}

export interface PerpetualMarketData {
  price: number | null;
  openInterest: number | null;
  fundingRate: number | null;
  marketsLoaded: boolean;
  pricesLoaded: boolean;
}

interface PerpetualMarketStore {
  // Markets data
  markets: Market[];
  setMarkets: (markets: Market[]) => void;
  
  // Market token mapping (address to market)
  marketTokenMap: Record<string, Market>;
  setMarketTokenMap: (map: Record<string, Market>) => void;
  
  // Available trading pairs
  tradingPairs: MarketPair[];
  setTradingPairs: (pairs: MarketPair[]) => void;
  
  // Selected token address
  selectedTokenId: string | null;
  setSelectedTokenId: (tokenId: string) => void;
  
  // Market data for selected token
  marketData: PerpetualMarketData;
  setMarketData: (data: PerpetualMarketData) => void;
  updateMarketData: (data: Partial<PerpetualMarketData>) => void;
  
  // Default values
  DEFAULT_PAIR: string;
}

export const usePerpetualMarketStore = create<PerpetualMarketStore>((set) => ({
  // Markets data
  markets: [],
  setMarkets: (markets) => set({ markets }),
  
  // Market token mapping
  marketTokenMap: {},
  setMarketTokenMap: (marketTokenMap) => set({ marketTokenMap }),
  
  // Available trading pairs
  tradingPairs: [],
  setTradingPairs: (tradingPairs) => set({ tradingPairs }),
  
  // Selected token address
  selectedTokenId: null,
  setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId }),
  
  // Market data for selected token
  marketData: {
    price: null,
    openInterest: null,
    fundingRate: null,
    marketsLoaded: false,
    pricesLoaded: false
  },
  setMarketData: (data) => set({ marketData: data }),
  updateMarketData: (data) => set((state) => {
    // Create a new object with the merged properties, filtering out undefined values
    const updatedData = Object.entries(data).reduce((acc, [key, value]) => {
      // Only include properties that aren't undefined
      if (value !== undefined) {
        acc[key as keyof PerpetualMarketData] = value as any;
      }
      return acc;
    }, {} as Partial<PerpetualMarketData>);
    
    return { 
      marketData: { ...state.marketData, ...updatedData } 
    };
  }),
  
  // Default values
  DEFAULT_PAIR: 'WETH-USDC'
}))