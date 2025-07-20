import { OrderSideEnum } from '../../../lib/enums/clob.enum';

// Enum for asset type (base/quote)
export enum AssetType {
  BASE = 'base',
  QUOTE = 'quote',
}

// Interface for basic token information
export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

// Interface for market information
export interface Market {
  id: string;
  baseToken: Token;
  quoteToken: Token;
  minOrderSize: bigint;
  tickSize: bigint;
}

// Interface for order
export interface Order {
  id: string;
  side: OrderSideEnum;
  price: bigint;
  size: bigint;
  trader: string;
}

// Type for price levels in an orderbook
export interface PriceLevel {
  price: bigint;
  size: bigint;
}

// Utility type for handling blockchain-related operations
export type HexAddress = `0x${string}`;

export type PoolKey = {
  baseToken: Token;
  quoteToken: Token;
  chainId: number;
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
