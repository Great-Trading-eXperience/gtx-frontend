export interface PoolsPonderResponse {
  poolss: {
    items: Pool[];
  };
}

export interface TradesPonderResponse {
  tradess: {
    items: Trade[];
  };
}

export interface PoolsResponse {
  pools: Pool[];
}

export interface TradesResponse {
  trades: Trade[];
}

export interface Pool {
  id: string;
  coin: string;
  timestamp: number;
  maxOrderAmount: string;
}

export interface Trade {
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
}

export interface MarketData {
  id: string;
  name: string;
  pair: string;
  starred: boolean;
  iconInfo: {
    icon: string;
    bgColor: string;
  };
  age: string;
  timestamp: number;
  price: string;
  volume: string;
  liquidity: string;
} 