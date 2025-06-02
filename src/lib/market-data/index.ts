export * from './types';
export * from './process-pools';
export * from './process-trades';
export * from './calculate-metrics';
export * from './get-icon-info';
export * from './api-service';

import { formatNumber } from '@/lib/utils';
import { calculateAge } from '@/lib/utils';
import { formatUnits } from 'viem';
import { calculatePoolMetrics } from './calculate-metrics';
import { getIconInfo } from './get-icon-info';
import { ProcessedPool, ProcessedTrade, MarketData } from './types';

/**
 * Convert processed pools and trades into market data for display
 */
export function createMarketData(
  processedPools: ProcessedPool[],
  processedTrades: ProcessedTrade[]
): MarketData[] {
  return processedPools.map(pool => {
    const metrics = calculatePoolMetrics(pool, processedTrades);
    const iconInfo = getIconInfo(pool.baseSymbol);
    console.log('pool', pool.baseSymbol, pool);
    return {
      id: pool.id,
      name: pool.baseSymbol,
      pair: pool.quoteSymbol,
      starred: false,
      iconInfo,
      age: calculateAge(pool.timestamp),
      timestamp: pool.timestamp,
      price: metrics.latestPrice.toFixed(2),
      volume: formatNumber(
        Number(formatUnits(BigInt(pool.volume), pool.quoteDecimals || 18)),
        { decimals: 0 }
      ),
      liquidity: formatNumber(pool.maxOrderAmount),
    };
  });
}
