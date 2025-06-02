import { apiGet } from '@/lib/api-client';

export interface OrderData {
  id: string;
  symbol: string;
  orderId: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  type: string;
  side: string;
  time: number;
  updateTime: number;
}

export interface AccountData {
  balances: {
    asset: string;
    free: string;
    locked: string;
  }[];
  permissions: string[];
}

/**
 * Fetch all orders for a given address
 */
export const fetchAllOrders = async (address: string): Promise<OrderData[]> => {
  if (!address) {
    return [];
  }
  
  try {
    const data = await apiGet<OrderData[]>(`/api/allOrders?address=${encodeURIComponent(address)}`);
    return data || [];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
};

/**
 * Fetch open orders for a given address
 */
export const fetchOpenOrders = async (address: string): Promise<OrderData[]> => {
  if (!address) {
    return [];
  }
  
  try {
    const data = await apiGet<OrderData[]>(`/api/openOrders?address=${encodeURIComponent(address)}`);
    return data || [];
  } catch (error) {
    console.error('Error fetching open orders:', error);
    return [];
  }
};

/**
 * Fetch account data for a given address
 */
export const fetchAccountData = async (address: string): Promise<AccountData | null> => {
  if (!address) {
    return null;
  }
  
  try {
    const data = await apiGet<AccountData>(`/api/account?address=${encodeURIComponent(address)}`);
    return data;
  } catch (error) {
    console.error('Error fetching account data:', error);
    return null;
  }
};

/**
 * Interface for ticker price data
 */
export interface TickerPriceData {
  symbol: string;
  price: string;
}

/**
 * Fetch the latest price for a symbol
 */
export const fetchTickerPrice = async (symbol: string): Promise<TickerPriceData | null> => {
  if (!symbol) {
    return null;
  }
  
  try {
    const data = await apiGet<TickerPriceData>(`/api/ticker/price?symbol=${encodeURIComponent(symbol)}`);
    return data;
  } catch (error) {
    console.error(`Error fetching ticker price for ${symbol}:`, error);
    return null;
  }
};

/**
 * Interface for 24hr ticker data
 */
export interface Ticker24hrData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

/**
 * Fetch 24hr ticker data for a symbol
 */
export const fetchTicker24hr = async (symbol: string): Promise<Ticker24hrData | null> => {
  if (!symbol) {
    return null;
  }
  
  try {
    const data = await apiGet<Ticker24hrData>(`/api/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
    return data;
  } catch (error) {
    console.error(`Error fetching 24hr ticker for ${symbol}:`, error);
    return null;
  }
};

/**
 * Interface for order book depth data
 */
export interface DepthData {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Fetch order book depth data for a symbol
 * @param symbol The trading pair symbol
 * @param limit Optional limit for number of bids/asks to return (default: 100)
 */
export const fetchDepth = async (symbol: string, limit: number = 100): Promise<DepthData | null> => {
  if (!symbol) {
    return null;
  }
  
  try {
    const data = await apiGet<DepthData>(`/api/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    return data;
  } catch (error) {
    console.error(`Error fetching depth data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Interface for trade data from the API
 */
export interface TradeData {
  id: string;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

/**
 * Fetch recent trades for a symbol
 * @param symbol The trading pair symbol
 * @param limit Optional limit for number of trades to return (default: 500)
 */
export const fetchTrades = async (symbol: string, limit: number = 500, userAddress?: string): Promise<TradeData[] | null> => {
  if (!symbol) {
    return null;
  }
  
  try {
    const data = await apiGet<TradeData[]>(userAddress ? `/api/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}&user=${userAddress}` : `/api/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    return data || [];
  } catch (error) {
    console.error(`Error fetching trades for ${symbol}:`, error);
    return null;
  }
};
