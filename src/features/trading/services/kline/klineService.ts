// features/trading/services/kline/KlineService.ts

import { getIndexerUrl } from '@/constants/urls/urls-config';
import { TradingPair } from '../../types/tradingview.types';
import { RESOLUTION_MAPPING } from '../../utils/tradingView/resolutionMapping';
import { normalizeSymbol, convertPrice } from '../../utils/tradingView/priceConversion';

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class KlineService {
  private abortController: AbortController | null = null;
  private chainId: number;

  constructor(chainId: number) {
    this.chainId = chainId;
  }

  async fetchKlines(params: {
    symbol: string;
    resolution: string;
    from: number;
    to: number;
    pairs: TradingPair[];
  }): Promise<Bar[]> {
    this.cancelPending();

    this.abortController = new AbortController();

    try {
      const mappedInterval = RESOLUTION_MAPPING[params.resolution];
      if (!mappedInterval) {
        throw new Error('Unsupported resolution');
      }

      const url =
        `${getIndexerUrl(this.chainId)}/api/kline?` +
        `symbol=${params.symbol}&interval=${mappedInterval}&` +
        `startTime=${params.from}&endTime=${params.to}&limit=5000`;

      const response = await fetch(url, {
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const normalizedSymbol = normalizeSymbol(params.symbol);
      const pair = params.pairs.find(
        p => p.symbol === params.symbol || p.symbol === normalizedSymbol
      );
      const decimals = pair?.quoteDecimals || 18;

      return data.map((d: any) => ({
        time: d[0],
        open: convertPrice(d[1], decimals),
        high: convertPrice(d[2], decimals),
        low: convertPrice(d[3], decimals),
        close: convertPrice(d[4], decimals),
        volume: Number(d[5]),
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      throw err;
    }
  }

  cancelPending() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
