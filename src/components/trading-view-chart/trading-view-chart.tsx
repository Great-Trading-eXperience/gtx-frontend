import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const RESOLUTION_MAPPING: { [key: string]: string } = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '1D': '1d',
  '1W': '1w',
  '1M': '1M'
};

let tvScriptLoadingPromise: Promise<void>;

export default function TVChartContainer() {
  const onLoadScriptRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = '/charting_library/charting_library/charting_library.standalone.js';
        script.type = 'text/javascript';
        script.onload = resolve as any;
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current && onLoadScriptRef.current());

    return () => {
      onLoadScriptRef.current = null;
    };
  }, []);

  async function fetchKlines(symbol: string, interval: string, startTime: number, endTime: number): Promise<Bar[]> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`
      );
      const data = await response.json();
      return data.map((d: any) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));
    } catch (error) {
      console.error('Error fetching klines:', error);
      return [];
    }
  }

  function createWidget() {
    if (document.getElementById('tv_chart_container') 
      && 'TradingView' in window) {

      new window.TradingView.widget({
        container: 'tv_chart_container',
        libraryPath: '/charting_library/charting_library/',
        locale: 'en',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['study_templates'],
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user',
        fullscreen: true,
        autosize: true,
        theme: 'Dark',
        symbol: 'BTCUSDT',
        interval: '1D',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        debug: true,
        library_path: '/charting_library/charting_library/',
        loading_screen: { backgroundColor: "#131722" },
        datafeed: {
          onReady: (callback: any) => {
            console.log('Datafeed onReady called');
            callback({
              supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
              supports_marks: false,
              supports_timescale_marks: false,
              supports_time: true,
            });
          },
          searchSymbols: () => {
            console.log('searchSymbols called');
          },
          resolveSymbol: (symbolName: string, onResolve: any, onError: any) => {
            console.log('resolveSymbol called for:', symbolName);
            onResolve({
              name: symbolName,
              full_name: symbolName,
              description: symbolName,
              type: 'crypto',
              session: '24x7',
              timezone: 'Etc/UTC',
              ticker: symbolName,
              minmov: 1,
              pricescale: 100,
              has_intraday: true,
              intraday_multipliers: ['1', '5', '15', '30', '60'],
              supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
              volume_precision: 8,
              data_status: 'streaming',
            });
          },
          getBars: async (symbolInfo: any, resolution: string, periodParams: any, onResult: any, onError: any) => {
            try {
              console.log('getBars called with:', { symbolInfo, resolution, periodParams });
              
              const interval = RESOLUTION_MAPPING[resolution];
              if (!interval) {
                onError('Invalid resolution');
                return;
              }

              const bars = await fetchKlines(
                symbolInfo.name,
                interval,
                periodParams.from * 1000,
                periodParams.to * 1000
              );

              onResult(bars, { noData: bars.length === 0 });
            } catch (error) {
              console.error('Error in getBars:', error);
              onError('Failed to load bars');
            }
          },
          subscribeBars: (symbolInfo: any, resolution: any, onTick: any, listenerGuid: any) => {
            console.log('subscribeBars called with:', { symbolInfo, resolution, listenerGuid });
            // Implement WebSocket connection here if needed
          },
          unsubscribeBars: (listenerGuid: any) => {
            console.log('unsubscribeBars called for:', listenerGuid);
            // Clean up WebSocket connection here if needed
          },
        },
      });
    }
  }

  return (
    <div id="tv_chart_container" className="w-full h-full" />
  );
} 