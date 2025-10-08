import { getIndexerUrl } from '@/constants/urls/urls-config';
import { pairsCache } from './pairsCache';
import { TradingPair } from '../../types/tradingview.types';

export class PairsService {
  private chainId: number;

  constructor(chainId: number) {
    this.chainId = chainId;
  }

  async getPairs(): Promise<TradingPair[]> {
    const cached = pairsCache.get(this.chainId);
    if (cached) return cached;

    try {
      const url = `${getIndexerUrl(this.chainId)}/api/pairs`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch pairs');
      }

      const data = await response.json();
      const formatted = this.formatPairs(data);

      pairsCache.set(this.chainId, formatted);

      return formatted;
    } catch (error) {
      console.error('Error fetching pairs:', error);
      return cached || [];
    }
  }

  private formatPairs(data: any[]): TradingPair[] {
    if (!Array.isArray(data)) return [];

    return data.map(pair => ({
      symbol: pair.symbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
      displayName: `${pair.baseAsset}/${pair.quoteAsset}`,
      poolId: pair.poolId,
      baseDecimals: pair.baseDecimals || 18,
      quoteDecimals: pair.quoteDecimals || 18,
    }));
  }
}
