// Analytics API service
const ANALYTICS_API_BASE = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:42090';

export interface AnalyticsAPIResponse<T = any> {
  data?: T;
  error?: string;
  loading: boolean;
}

class AnalyticsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = ANALYTICS_API_BASE) {
    this.baseUrl = baseUrl;
  }

  async get<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 seconds
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics API Error:', error);
      throw error;
    }
  }

  // Specific API methods for each metric
  async getTradingVolume(timeframe: string = '30d') {
    return this.get(`/api/market/volume?timeframe=${timeframe}`);
  }

  async getTradesCount(period: string = '30d') {
    return this.get(`/api/analytics/trades-count?period=${period}`);
  }

  async getLiquidity(timeframe: string = '24h') {
    return this.get(`/api/market/liquidity?timeframe=${timeframe}`);
  }

  async getSlippage(timeframe: string = '24h') {
    return this.get(`/api/analytics/slippage?timeframe=${timeframe}`);
  }

  async getInflows(timeframe: string = '30d') {
    return this.get(`/api/analytics/inflows?timeframe=${timeframe}`);
  }

  async getOutflows(timeframe: string = '30d') {
    return this.get(`/api/analytics/outflows?timeframe=${timeframe}`);
  }

  async getUniqueTraders(period: string = '30d') {
    return this.get(`/api/analytics/unique-traders?period=${period}`);
  }

  async getPnL(timeframe: string = '24h') {
    return this.get(`/api/analytics/pnl?timeframe=${timeframe}`);
  }

  async getSystemHealth() {
    return this.get('/health/detailed');
  }

  // Leaderboard API methods - using RESTful pattern
  async getPNLLeaderboard(period: '24h' | '7d' | '30d' = '24h', limit: number = 100) {
    const response = await this.get(`/api/leaderboard/pnl/${period}?limit=${limit}`);
    return response.data || response; // Handle both formats
  }

  async getVolumeLeaderboard(period: '24h' | '7d' | '30d' = '24h', limit: number = 100) {
    const response = await this.get(`/api/leaderboard/volume/${period}?limit=${limit}`);
    return response.data || response; // Handle both formats
  }

  async getTradesLeaderboard(period: '24h' | '7d' | '30d' = '24h', limit: number = 100) {
    const response = await this.get(`/api/leaderboard/volume/${period}?limit=${limit}`);
    // Transform volume data to focus on trades count
    if (Array.isArray(response.data || response)) {
      const data = response.data || response;
      return data.map((entry: any) => ({
        ...entry,
        value: entry.metadata?.trades || entry.value,
        type: 'trades'
      })).sort((a: any, b: any) => (b.metadata?.trades || 0) - (a.metadata?.trades || 0));
    }
    return response.data || response;
  }
}

// Export singleton instance
export const analyticsAPI = new AnalyticsAPI();

// Export hook for React components
export { default as useAnalyticsData } from '../hooks/use-analytics-data';