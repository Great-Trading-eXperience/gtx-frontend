export interface ProcessedPool {
  id: string;
  baseToken: string;
  quoteToken: string;
  orderBook: string;
  timestamp: number;
  maxOrderAmount: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimals: number | undefined;
  quoteDecimals: number | undefined;
}

export interface ProcessedTrade {
  poolId: string;
  pool: string;
  price: string;
  quantity: string;
  timestamp: number;
}

export interface PoolMetrics {
  latestPrice: number;
  volume: bigint;
}

export interface MarketData {
  id: string;
  name: string;
  pair: string;
  starred: boolean;
  iconInfo: {
    hasImage: boolean;
    imagePath: string | null;
    bg: string;
  };
  age: string;
  timestamp: number;
  price: string;
  volume: string;
  liquidity: string;
} 