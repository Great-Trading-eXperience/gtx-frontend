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
  volume: string;
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

export type CurrencyType = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type PoolItem = {
  coin: string;
  id: string;
  orderBook: string;
  timestamp: number;
  baseCurrency: CurrencyType;
  quoteCurrency: CurrencyType;
  volume: string;
  lotSize: string;
  maxOrderAmount: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  baseDecimals?: number;
  quoteDecimals?: number;
};

export type PoolsPonderResponse = {
  poolss: {
    items: PoolItem[];
    totalCount: number;
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
  };
};

export type PoolsResponse = {
  pools: PoolItem[];
};