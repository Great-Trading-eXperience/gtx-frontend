import { useMemo } from 'react';
import { KlineService } from '../../services/kline/klineService';
import { PairsService } from '../../services/pairs/pairsService';
import { TradingPair } from '../../types/tradingview.types';
import { normalizeSymbol } from '../../utils/tradingView/priceConversion';
import { RESOLUTION_MAPPING } from '../../utils/tradingView/resolutionMapping';

export function useTradingViewDatafeed(
  chainId: number,
  pairs: TradingPair[],
  onIntervalChange: (interval: string) => void
) {
  const klineService = useMemo(() => new KlineService(chainId), [chainId]);
  const pairsService = useMemo(() => new PairsService(chainId), [chainId]);

  const datafeed = useMemo(
    () => ({
      onReady: (cb: any) => {
        cb({
          supported_resolutions: ['1', '5', '30', '60', '1D'],
          supports_marks: true,
          supports_timescale_marks: true,
          supports_time: true,
        });
      },

      searchSymbols: async (
        userInput: string,
        exchange: string,
        symbolType: string,
        onResult: any
      ) => {
        try {
          const availablePairs = await pairsService.getPairs();
          const filtered = availablePairs.filter(p =>
            p.displayName.toLowerCase().includes(userInput.toLowerCase())
          );

          onResult(
            filtered.map(pair => ({
              symbol: pair.symbol,
              full_name: pair.displayName,
              description: pair.displayName,
              exchange: 'GTX',
              ticker: pair.symbol,
              type: 'crypto',
            }))
          );
        } catch (error) {
          console.error('Search error:', error);
          onResult([]);
        }
      },

      resolveSymbol: (symbolName: string, onResolve: any, onError: any) => {
        try {
          const pair = pairs.find(
            p => p.symbol === symbolName || p.symbol === normalizeSymbol(symbolName)
          );
          const decimals = pair?.quoteDecimals || 6;

          onResolve({
            name: symbolName,
            ticker: symbolName,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            supported_resolutions: ['1', '5', '30', '60', '1D'],
            data_status: 'streaming',
          });
        } catch (error) {
          onError('Failed to resolve symbol');
        }
      },

      getBars: async (
        symbolInfo: any,
        resolution: string,
        periodParams: any,
        onResult: any,
        onError: any
      ) => {
        try {
          const bars = await klineService.fetchKlines({
            symbol: symbolInfo.name,
            resolution,
            from: periodParams.from * 1000,
            to: periodParams.to * 1000,
            pairs,
          });

          onResult(bars, { noData: !bars.length });
        } catch (e) {
          onError('Failed to fetch bars');
        }
      },

      subscribeBars: (symbolInfo: any, resolution: any, onTick: any) => {
        onIntervalChange(RESOLUTION_MAPPING[resolution] || '1d');
        // Actual subscription handled by useKlineSubscription
      },

      unsubscribeBars: () => {
        // Cleanup handled by useKlineSubscription
      },
    }),
    [chainId, pairs, klineService, pairsService, onIntervalChange]
  );

  return datafeed;
}
