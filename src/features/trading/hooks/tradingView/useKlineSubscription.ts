import { useEffect } from 'react';
import { useMarketWebSocket } from '@/hooks/use-market-websocket';
import { convertPrice, normalizeSymbol } from '../../utils/tradingView/priceConversion';

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function useKlineSubscription(
  chainId: number,
  symbol: string,
  interval: string,
  quoteDecimals: number,
  enabled: boolean,
  onTick: (bar: Bar) => void
) {
  const normalizedSymbol = normalizeSymbol(symbol);

  const { lastMessage, isConnected, connect, disconnect } = useMarketWebSocket(
    chainId,
    `kline_${interval}`,
    normalizedSymbol
  );

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  useEffect(() => {
    if (!lastMessage || lastMessage.e !== 'kline') return;

    try {
      const k = lastMessage.k;

      if (k.s === normalizedSymbol) {
        const bar = {
          time: k.t,
          open: convertPrice(k.o, quoteDecimals),
          high: convertPrice(k.h, quoteDecimals),
          low: convertPrice(k.l, quoteDecimals),
          close: convertPrice(k.c, quoteDecimals),
          volume: parseFloat(k.v),
        };

        onTick(bar);
      }
    } catch (error) {
      console.error('Error processing kline:', error);
    }
  }, [lastMessage, normalizedSymbol, quoteDecimals, onTick]);

  return { isConnected };
}
