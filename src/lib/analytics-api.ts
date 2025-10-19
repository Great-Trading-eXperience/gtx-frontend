// Analytics API configuration and helper functions
export const ANALYTICS_API_BASE_URL = 'http://localhost:42090';

// API endpoints from ETL_ARCHITECTURE.md
export const ANALYTICS_ENDPOINTS = {
  MARKET_VOLUME: '/api/market/volume',
  TRADES_COUNT: '/api/analytics/trades-count',
  CUMULATIVE_USERS: '/api/analytics/cumulative-users',
  PNL: '/api/analytics/pnl',
  VOLUME_LEADERBOARD: '/api/leaderboard/volume',
  PNL_LEADERBOARD: '/api/leaderboard/pnl',
  UNIQUE_TRADERS: '/api/analytics/unique-traders',
  SLIPPAGE: '/api/analytics/slippage',
  INFLOWS: '/api/analytics/inflows',
  OUTFLOWS: '/api/analytics/outflows',
  LIQUIDITY: '/api/market/liquidity'
} as const;

// Helper function to build full API URL
export function buildAnalyticsApiUrl(endpoint: string): string {
  return `${ANALYTICS_API_BASE_URL}${endpoint}`;
}

// Generic API fetch function with error handling
export async function fetchAnalyticsData<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(buildAnalyticsApiUrl(endpoint));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analytics API error (${response.status}): ${errorText || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if the response contains an error field
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error(`API returned error: ${data.error}`);
    }
    
    return data as T;
  } catch (error) {
    console.error(`Failed to fetch analytics data from ${endpoint}:`, error);
    throw error;
  }
}

// Helper function to build URL with query parameters
function buildUrlWithParams(endpoint: string, params: Record<string, string | number>): string {
  const url = new URL(buildAnalyticsApiUrl(endpoint));
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  return url.toString();
}

// Specific API functions for each endpoint with timeframe and interval support
export const analyticsApi = {
  getMarketVolume: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.MARKET_VOLUME, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getTradesCount: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.TRADES_COUNT, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getCumulativeUsers: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.CUMULATIVE_USERS, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getPnL: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.PNL, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getVolumeLeaderboard: (timeframe = '30d', limit = 10) => 
    fetch(buildUrlWithParams(`${ANALYTICS_ENDPOINTS.VOLUME_LEADERBOARD}/${timeframe}`, { limit: limit }))
      .then(res => res.json()),
  
  getPnLLeaderboard: (timeframe = '30d', limit = 10) => 
    fetch(buildUrlWithParams(`${ANALYTICS_ENDPOINTS.PNL_LEADERBOARD}/${timeframe}`, { limit: limit }))
      .then(res => res.json()),
  
  getUniqueTraders: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.UNIQUE_TRADERS, { timeframe }))
      .then(res => res.json()),
  
  getSlippage: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.SLIPPAGE, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getInflows: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.INFLOWS, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getOutflows: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.OUTFLOWS, { timeframe, interval: 'hourly' }))
      .then(res => res.json()),
  
  getLiquidity: (timeframe = '30d') => 
    fetch(buildUrlWithParams(ANALYTICS_ENDPOINTS.LIQUIDITY, { timeframe, interval: 'hourly' }))
      .then(res => res.json())
};