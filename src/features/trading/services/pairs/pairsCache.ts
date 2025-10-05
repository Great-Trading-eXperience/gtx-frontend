import { TradingPair } from '../../types/tradingview.types';

interface CachedData {
  data: TradingPair[];
  timestamp: number;
}

class PairsCacheManager {
  private cache = new Map<number, CachedData>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(chainId: number): TradingPair[] | null {
    const cached = this.cache.get(chainId);

    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(chainId);
      return null;
    }

    return cached.data;
  }

  set(chainId: number, data: TradingPair[]): void {
    this.cache.set(chainId, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(chainId: number): void {
    this.cache.delete(chainId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([chainId, data]) => ({
        chainId,
        count: data.data.length,
        age: Date.now() - data.timestamp,
      })),
    };
  }
}

export const pairsCache = new PairsCacheManager();
