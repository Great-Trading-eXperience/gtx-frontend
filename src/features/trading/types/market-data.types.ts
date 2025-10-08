import { HexAddress, ClobDexComponentProps } from './chart.types';

export type CurrencyType = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type TradeItem = {
  id: string;
  orderId: string;
  poolId: string;
  pool: string;
  price: string;
  quantity: string;
  timestamp: number;
  transactionId: string;
  order: {
    expiry: number;
    filled: string;
    id: string;
    orderId: string;
    poolId: string;
    price: string;
    type: string;
    timestamp: number;
    status: string;
    side: 'Buy' | 'Sell';
    quantity: string;
    user: {
      amount: string;
      currency: CurrencyType;
      lockedAmount: string;
      symbol: string;
      user: HexAddress;
    };
    pool: {
      coin: string;
      id: string;
      lotSize: string;
      maxOrderAmount: string;
      orderBook: string;
      timestamp: number;
      baseCurrency: CurrencyType;
      quoteCurrency: CurrencyType;
    };
  };
};

export interface ProcessedPoolItem {
  id: string;
  orderBook: string;
  timestamp: number;
  coin: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimals: number | undefined;
  quoteDecimals: number | undefined;
}

export interface DepthData {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface MarketDataTabsProps extends ClobDexComponentProps {
  address: HexAddress | undefined;
  chainId: number;
  defaultChainId: number;
  selectedPool?: ProcessedPoolItem;
  poolsLoading: boolean;
  poolsError: Error | null;
  depthData: DepthData | null;
  trades: TradeItem[];
  tradesLoading: boolean;
}

export interface Trade {
  price: number;
  time: string;
  size: bigint;
  side: 'Buy' | 'Sell';
  total?: number;
}

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

export type PoolsResponse = {
  pools: PoolItem[];
};

export type RecentTradesComponentProps = ClobDexComponentProps & {
  poolsData?: PoolsResponse;
  poolsLoading?: boolean;
  poolsError?: Error | null;
  tradesData?: TradeItem[];
  tradesLoading?: boolean;
};
