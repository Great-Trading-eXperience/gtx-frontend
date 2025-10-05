import { useMemo } from 'react';
import { TradingPair } from '../../types/tradingview.types';
import { ProcessedPoolItem } from '../../types/chart.types';

export function useTradingPairs(poolsData: ProcessedPoolItem[] | undefined): TradingPair[] {
  return useMemo(() => {
    if (!poolsData?.length) return [];

    return poolsData.map(pool => ({
      symbol: `${pool.baseSymbol}/${pool.quoteSymbol}`,
      baseAsset: pool.baseSymbol,
      quoteAsset: pool.quoteSymbol,
      displayName: `${pool.baseSymbol}/${pool.quoteSymbol}`,
      poolId: pool.orderBook,
      baseDecimals: pool.baseDecimals || 18,
      quoteDecimals: pool.quoteDecimals || 18,
    }));
  }, [poolsData]);
}
