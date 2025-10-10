import { useEffect, useRef, useState } from 'react';
import { useTradingViewScript } from './useTradingViewScript';

interface UseTradingViewWidgetParams {
  containerId: string;
  symbol: string;
  interval: string;
  datafeed: any;
  theme?: 'Dark' | 'Light';
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function useTradingViewWidget(params: UseTradingViewWidgetParams) {
  const { containerId, symbol, interval, datafeed, theme = 'Dark' } = params;

  const widgetRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { isLoaded, loadError } = useTradingViewScript();

  useEffect(() => {
    if (!isLoaded || loadError) {
      setError(loadError);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container || !window.TradingView) {
      setError(new Error('Container or TradingView library not available'));
      return;
    }

    try {
      const widget = new window.TradingView.widget({
        container: containerId,
        library_path: '/charting_library/',
        locale: 'en',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['symbol_search'],
        symbol,
        interval,
        timezone: 'Asia/Jakarta',
        theme,
        autosize: true,
        datafeed,
        debug: false,
      });

      widget.onChartReady(() => {
        setIsReady(true);
      });

      widgetRef.current = widget;
    } catch (err) {
      setError(err as Error);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing widget:', e);
        }
        widgetRef.current = null;
      }
      setIsReady(false);
    };
  }, [isLoaded, loadError, containerId, symbol, interval, datafeed, theme]);

  return {
    widget: widgetRef.current,
    isReady,
    error: error || loadError,
  };
}
