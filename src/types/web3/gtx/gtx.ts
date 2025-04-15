// Enum for order side (buy/sell)
export enum Side {
  BUY = 0,
  SELL = 1
}

// Enum for asset type (base/quote)
export enum AssetType {
  BASE = "base",
  QUOTE = "quote",
}

// Interface for basic token information
export interface Token {
  address: string
  symbol: string
  decimals: number
}

// Interface for market information
export interface Market {
  id: string
  baseToken: Token
  quoteToken: Token
  minOrderSize: bigint
  tickSize: bigint
}

// Interface for order
export interface Order {
  id: string
  side: Side
  price: bigint
  size: bigint
  trader: string
}

// Type for price levels in an orderbook
export interface PriceLevel {
  price: bigint
  size: bigint
}

// Utility type for handling blockchain-related operations
export type HexAddress = `0x${string}` 