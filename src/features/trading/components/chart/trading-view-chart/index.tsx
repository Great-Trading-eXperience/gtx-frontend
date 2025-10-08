import { useState, useRef, useCallback, useMemo } from 'react';
import { useTradingViewWidget } from '../../../hooks/tradingView/useTradingViewWidget';
import { useTradingViewDatafeed } from '../../../hooks/tradingView/useTradingViewDatafeed';
import { useKlineSubscription } from '../../../hooks/tradingView/useKlineSubscription';
import { useTradingViewSync } from '../../../hooks/tradingView/useTradingViewSync';
import { TradingPair } from '../../../types/tradingview.types';
import TradingViewContainer from './trading-view-container';

export interface TradingViewChartProps {
  chainId: number;
  symbol: string;
  interval?: string;
  availablePairs?: TradingPair[];
  height?: number | string;
  theme?: 'Dark' | 'Light';
  onSymbolChange?: (symbol: string) => void;
}

export default function TradingViewChart({
  chainId,
  symbol,
  interval = '1h',
  availablePairs = [],
  height = '100%',
  theme = 'Dark',
  onSymbolChange,
}: TradingViewChartProps) {
  const [klineInterval, setKlineInterval] = useState('1d');
  const onTickRef = useRef<((bar: any) => void) | null>(null);

  // Find current pair for decimal precision
  const currentPair = useMemo(() => {
    const normalized = symbol.replace('/', '');
    return availablePairs.find(p => p.symbol === symbol || p.symbol === normalized);
  }, [symbol, availablePairs]);

  const quoteDecimals = currentPair?.quoteDecimals || 18;

  // Create datafeed
  const datafeed = useTradingViewDatafeed(
    chainId,
    availablePairs,
    useCallback((interval: string) => {
      setKlineInterval(interval);
    }, [])
  );

  // Create widget
  const { widget, isReady, error } = useTradingViewWidget({
    containerId: 'tv_chart_container',
    symbol,
    interval,
    datafeed,
    theme,
  });

  // Handle symbol changes from widget
  const handleWidgetSymbolChange = useCallback(
    (newSymbol: string) => {
      const pair = availablePairs.find(p => p.symbol === newSymbol);
      if (pair?.poolId && onSymbolChange) {
        onSymbolChange(newSymbol);
      }
    },
    [availablePairs, onSymbolChange]
  );

  // Subscribe to real-time updates
  const { isConnected } = useKlineSubscription(
    chainId,
    symbol,
    klineInterval,
    quoteDecimals,
    isReady,
    bar => {
      if (onTickRef.current) {
        onTickRef.current(bar);
      }
    }
  );

  // Sync symbol/interval changes
  useTradingViewSync(widget, symbol, interval, isReady);

  return (
    <TradingViewContainer
      height={height}
      isReady={isReady}
      isConnected={isConnected}
      error={error}
    />
  );
}
