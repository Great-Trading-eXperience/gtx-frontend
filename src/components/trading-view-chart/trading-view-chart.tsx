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

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
}

const RESOLUTION_MAPPING: Record<string, string> = {
  '1': '1m',
  '5': '5m',
  '30': '30m',
  '60': '1h',
  '1D': '1d',
};

let tvScriptLoadingPromise: Promise<void>;

export interface TradingViewChartContainerProps {
  chainId: number;
  symbol: string;
  interval?: string;
  /** Epoch ms. If omitted, defaults to now − 7 days */
  startTime?: number;
  /** Epoch ms. If omitted, defaults to now */
  endTime?: number;
  onChangeInterval?: (interval: string) => void;
  // Optional prop to provide trading pairs externally
  availablePairs?: TradingPair[];
}

export default function TradingViewChartContainer({
  chainId,
  symbol,
  interval = '1',
  startTime,
  endTime,
  onChangeInterval,
  availablePairs,
}: TradingViewChartContainerProps) {
  /* --- default window: last seven days --- */
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const HALF_DAY = 12 * 60 * 60 * 1000;
  const defaultStartMs = startTime ?? Date.now() - ONE_DAY;
  const defaultEndMs = endTime ?? Date.now();

  const onLoadScriptRef = useRef<(() => void) | null>(null);
  const chartWidgetRef = useRef<any>(null);
  const dataUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastBar, setLastBar] = useState<Bar | null>(null);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbol);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* Clean-up polling timer on unmount */
  useEffect(() => {
    return () => {
      if (dataUpdateIntervalRef.current) clearInterval(dataUpdateIntervalRef.current);
    };
  }, []);

  /* Fetch available pairs if not provided as props */
  useEffect(() => {
    if (availablePairs && availablePairs.length > 0) {
      setPairs(availablePairs);
      return;
    }

    async function fetchPairs() {
      try {
        setIsLoading(true);
        // Adjust this URL to match your backend endpoint for getting available pairs
        const pairsUrl = `${getKlineUrl(chainId).replace('/klines', '/pairs')}`;
        const response = await fetch(pairsUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch pairs');
        }

        const data = await response.json();
        // Transform the data as needed based on your API response format
        const formattedPairs = Array.isArray(data)
          ? data.map((pair: any) => ({
              symbol: pair.symbol,
              baseAsset: pair.baseAsset,
              quoteAsset: pair.quoteAsset,
              displayName: `${pair.baseAsset}/${pair.quoteAsset}`,
            }))
          : [];

        setPairs(formattedPairs);
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
        // Set a default pair if fetch fails
        setPairs([
          {
            symbol: selectedSymbol,
            baseAsset: selectedSymbol.split('/')[0] || '',
            quoteAsset: selectedSymbol.split('/')[1] || '',
            displayName: selectedSymbol,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPairs();
  }, [chainId, availablePairs, selectedSymbol]);

  /* Inject TradingView script once */
  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise<void>(resolve => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = '/charting_library/charting_library.standalone.js';
        script.type = 'text/javascript';
        script.onload = resolve as any;
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current?.());

    return () => {
      onLoadScriptRef.current = null;
    };
  }, []);

  /* Update chart when symbol changes */
  useEffect(() => {
    if (chartWidgetRef.current && selectedSymbol !== symbol) {
      // Clean up existing subscriptions
      if (dataUpdateIntervalRef.current) {
        clearInterval(dataUpdateIntervalRef.current);
        dataUpdateIntervalRef.current = null;
      }

      // Change the symbol on the chart
      chartWidgetRef.current.setSymbol(selectedSymbol, interval, () => {
        fetchLatestData();
      });
    }
  }, [selectedSymbol, interval, symbol]);

  /* Handle symbol change */
  const handleSymbolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSymbol = event.target.value;
    setSelectedSymbol(newSymbol);
  };

  /* REST fetch helper */
  async function fetchKlines(
    symbolName: string,
    mappedInterval: string,
    fromMs: number,
    toMs: number
  ): Promise<Bar[]> {
    try {
      const url =
        `${getKlineUrl(chainId)}?symbol=${symbolName}` +
        `&interval=${mappedInterval}&startTime=${fromMs}&endTime=${toMs}&limit=100000`;

      const res = await fetch(url);
      const data = await res.json();

      return data.map((d: any) => ({
        time: d[0],
        open: Number(d[1]),
        high: Number(d[2]),
        low: Number(d[3]),
        close: Number(d[4]),
        volume: Number(d[5]),
      }));
    } catch (err) {
      console.error('fetchKlines error', err);
      return [];
    }
  }

  /* Poll the latest bar every 10 s */
  async function fetchLatestData() {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const mappedInterval = RESOLUTION_MAPPING[interval];

    const bars = await fetchKlines(selectedSymbol, mappedInterval, fiveMinutesAgo, now);
    if (!bars.length) return;

    const newestBar = bars[bars.length - 1];
    setLastBar(newestBar);

    const w = chartWidgetRef.current;
    const df = w?.options?.datafeed;
    if (df?.updateBar) df.updateBar(newestBar);
  }

  /* ---- main widget creator ---- */
  function createWidget() {
    if (!document.getElementById('tv_chart_container') || !('TradingView' in window))
      return;

    /* --- TradingView Data-Feed object --- */
    const datafeed = {
      onReady: (cb: any) =>
        cb({
          supported_resolutions: ['1', '5', '30', '60', '1D'],
          supports_marks: true,
          supports_timescale_marks: true,
          supports_time: true,
        }),

      searchSymbols: (
        userInput: string,
        exchange: string,
        symbolType: string,
        onResult: any
      ) => {
        const filteredPairs = pairs.filter(pair =>
          pair.displayName.toLowerCase().includes(userInput.toLowerCase())
        );
        onResult(
          filteredPairs.map(pair => ({
            symbol: pair.symbol,
            full_name: pair.displayName,
            description: pair.displayName,
            exchange: 'GTX',
            ticker: pair.symbol,
            type: 'crypto',
          }))
        );
      },

      resolveSymbol: (symbolName: string, onResolve: any) =>
        onResolve({
          name: symbolName,
          ticker: symbolName,
          full_name: symbolName,
          description: symbolName,
          type: 'crypto',
          session: '24x7',
          timezone: 'Etc/UTC',
          minmov: 1,
          pricescale: 100,
          has_intraday: true,
          intraday_multipliers: ['1', '5', '15', '30', '60'],
          supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
          volume_precision: 8,
          data_status: 'streaming',
        }),

      /* key bit → override firstDataRequest window */
      getBars: async (
        symbolInfo: any,
        resolution: string,
        periodParams: any,
        onResult: any,
        onError: any
      ) => {
        try {
          const mappedInterval = RESOLUTION_MAPPING[resolution];
          if (!mappedInterval) return onError('Unsupported resolution');

          const fromMs = periodParams.firstDataRequest
            ? defaultStartMs
            : periodParams.from * 1000;
          const toMs = periodParams.firstDataRequest
            ? defaultEndMs
            : periodParams.to * 1000;

          const bars = await fetchKlines(symbolInfo.name, mappedInterval, fromMs, toMs);
          onResult(bars, { noData: !bars.length });
        } catch (e) {
          onError('getBars failed', e);
        }
      },

      subscribeBars: (_sym: any, _res: any, onTick: any) => {
        if (dataUpdateIntervalRef.current) clearInterval(dataUpdateIntervalRef.current);
        dataUpdateIntervalRef.current = setInterval(() => {
          fetchLatestData().then(() => lastBar && onTick(lastBar));
        }, 10_000);
      },

      unsubscribeBars: () => {
        if (dataUpdateIntervalRef.current) {
          clearInterval(dataUpdateIntervalRef.current);
          dataUpdateIntervalRef.current = null;
        }
      },

      updateBar: (_bar: Bar) => {}, // filled by fetchLatestData
    };

    /* --- instantiate widget --- */
    const widget = new window.TradingView.widget({
      container: 'tv_chart_container',
      library_path: '/charting_library/',
      locale: 'en',
      disabled_features: ['use_localstorage_for_settings'],
      enabled_features: ['study_templates', 'symbol_search'],
      symbol: selectedSymbol,
      interval,
      timezone: 'Asia/Jakarta',
      theme: 'Dark',
      autosize: true,
      datafeed,
      debug: true,
    });

    chartWidgetRef.current = widget;
    fetchLatestData(); // first poll immediately
  }

  return (
    <div className="w-full">
      {/* Pairs selector dropdown */}
      <div className="flex items-center mb-4 bg-gray-800 p-2 rounded">
        <label htmlFor="pair-selector" className="mr-2 text-gray-300">
          Trading Pair:
        </label>
        <select
          id="pair-selector"
          value={selectedSymbol}
          onChange={handleSymbolChange}
          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <option>Loading pairs...</option>
          ) : pairs.length === 0 ? (
            <option>No pairs available</option>
          ) : (
            pairs.map(pair => (
              <option key={pair.symbol} value={pair.symbol}>
                {pair.displayName}
              </option>
            ))
          )}
        </select>
      </div>

      {/* TradingView chart container */}
      <div id="tv_chart_container" className="w-full" style={{ height: '50vh' }} />
    </div>
  );
}
