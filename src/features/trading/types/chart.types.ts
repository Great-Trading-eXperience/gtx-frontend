export type HexAddress = `0x${string}`;

export enum AssetType {
  BASE = 'base',
  QUOTE = 'quote',
}

export enum OrderSideEnum {
    BUY = 0,
    SELL = 1,
}

export enum TimeInForceEnum {
    GTC = 0, // Good Till Cancel
    IOC = 1, // Immediate Or Cancel
    FOK = 2, // Fill Or Kill
}

export enum TimeFrame {
    DAILY = "daily",
    MINUTE = "minute",
    FIVE_MINUTE = "fiveMinute",
    HOURLY = "hourly",
}

export type PoolKey = {
  baseToken: Token;
  quoteToken: Token;
  chainId: number;
};

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

export interface Market {
  id: string;
  baseToken: Token;
  quoteToken: Token;
  minOrderSize: bigint;
  tickSize: bigint;
}

export interface Order {
  id: string;
  side: OrderSideEnum;
  price: bigint;
  size: bigint;
  trader: string;
}

export interface PriceLevel {
  price: bigint;
  size: bigint;
}

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

export interface TimeFrameSelectorProps {
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
};

export type ClobDexComponentProps = {
  address?: HexAddress;
  chainId: number;
  defaultChainId: number;
  selectedPool?: ProcessedPoolItem;
};

export type ChartComponentProps = ClobDexComponentProps & {
  height?: number;
  poolsData?: ProcessedPoolItem[] | undefined;
  poolsLoading?: boolean;
  poolsError?: Error | null;
};
