import { getKlineUrl } from '@/utils/env';
import { useEffect, useRef, useState } from 'react';

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

export interface TradingViewChartContainerProps {
  chainId: number;
  symbol: string;
  interval?: string;
  startTime?: number;
  endTime?: number;
  onChangeInterval?: (interval: string) => void;
}

export default function TradingViewChartContainer({ 
  chainId, 
  symbol, 
  interval = '1',
  startTime, 
  endTime,
  onChangeInterval 
}: TradingViewChartContainerProps) {
  const onLoadScriptRef = useRef<(() => void) | null>(null);
  const chartWidgetRef = useRef<any>(null);
  const dataUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastBar, setLastBar] = useState<Bar | null>(null);

  useEffect(() => {
    return () => {
      if (dataUpdateIntervalRef.current) {
        clearInterval(dataUpdateIntervalRef.current);
      }
    };
  }, []);

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
        `${getKlineUrl(chainId)}?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`
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

  // Function to fetch the latest data
  async function fetchLatestData() {
    try {
      // Calculate time range for the last few minutes
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      const mappedInterval = RESOLUTION_MAPPING[interval || '1'];
      const bars = await fetchKlines(symbol, mappedInterval, fiveMinutesAgo, now);
      
      if (bars.length > 0) {
        const newestBar = bars[bars.length - 1];
        setLastBar(newestBar);
        
        // Update the chart if widget exists
        if (chartWidgetRef.current && newestBar) {
          // Get the current datafeed
          const datafeed = chartWidgetRef.current.options.datafeed;
          if (datafeed && datafeed.updateBar) {
            datafeed.updateBar(newestBar);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
    }
  }

  function createWidget() {
    if (document.getElementById('tv_chart_container') 
      && 'TradingView' in window) {

      const datafeed = {
        onReady: (callback: any) => {
          console.log('Datafeed onReady called');
          callback({
            supported_resolutions: ['1', '5', '30', '60', '1D'],
            supports_marks: true,
            supports_timescale_marks: true,
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
            onError('Failed to load bars', error);
          }
        },
        subscribeBars: (symbolInfo: any, resolution: any, onTick: any, listenerGuid: any) => {
          console.log('subscribeBars called with:', { symbolInfo, resolution, listenerGuid });
          
          // Set up interval to update data every 10 seconds
          if (dataUpdateIntervalRef.current) {
            clearInterval(dataUpdateIntervalRef.current);
          }
          
          dataUpdateIntervalRef.current = setInterval(() => {
            fetchLatestData().then(() => {
              if (lastBar) {
                onTick(lastBar);
              }
            });
          }, 10000); // 10 seconds
        },
        unsubscribeBars: (listenerGuid: any) => {
          console.log('unsubscribeBars called for:', listenerGuid);
          if (dataUpdateIntervalRef.current) {
            clearInterval(dataUpdateIntervalRef.current);
            dataUpdateIntervalRef.current = null;
          }
        },
        updateBar: (bar: Bar) => {
          // This method will be called from the fetchLatestData function
          console.log('Manually updating bar:', bar);
        }
      };

      // Create the widget
      chartWidgetRef.current = new window.TradingView.widget({
        container: 'tv_chart_container',
        libraryPath: '/charting_library/charting_library/',
        locale: 'en',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['study_templates'],
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user',
        fullscreen: false,
        autosize: true,
        theme: 'Dark',
        symbol: symbol,
        interval: interval, 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        debug: true,
        library_path: '/charting_library/charting_library/',
        loading_screen: { backgroundColor: "#131722" },
        datafeed: datafeed,
      });

      // Start fetching data immediately
      fetchLatestData();
    }
  }

  return (
    <div id="tv_chart_container" className="w-full" style={{ height: '50vh' }} /> // Set height to 50% of viewport height
  );
}