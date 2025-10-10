export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
  poolId: string;
  baseDecimals?: number;
  quoteDecimals?: number;
}