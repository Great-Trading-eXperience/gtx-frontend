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
  interval?: string;          // TradingView resolution ('1', '5', '1D', …)
  /** Epoch ms. If omitted, defaults to now − 7 days */
  startTime?: number;
  /** Epoch ms. If omitted, defaults to now */
  endTime?: number;
  onChangeInterval?: (interval: string) => void;
}

export default function TradingViewChartContainer({
  chainId,
  symbol,
  interval = '1',
  startTime,
  endTime,
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

  /* Clean-up polling timer on unmount */
  useEffect(() => {
    return () => {
      if (dataUpdateIntervalRef.current) clearInterval(dataUpdateIntervalRef.current);
    };
  }, []);

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

  /* REST fetch helper */
  async function fetchKlines(
    symbol: string,
    mappedInterval: string,
    fromMs: number,
    toMs: number,
  ): Promise<Bar[]> {
    try {
      const url =
        `${getKlineUrl(chainId)}?symbol=${symbol}` +
        `&interval=${mappedInterval}&startTime=${fromMs}&endTime=${toMs}&limit=1000`;

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

    const bars = await fetchKlines(symbol, mappedInterval, fiveMinutesAgo, now);
    if (!bars.length) return;

    const newestBar = bars[bars.length - 1];
    setLastBar(newestBar);

    const w = chartWidgetRef.current;
    const df = w?.options?.datafeed;
    if (df?.updateBar) df.updateBar(newestBar);
  }

  /* ---- main widget creator ---- */
  function createWidget() {
    if (!document.getElementById('tv_chart_container') || !('TradingView' in window)) return;

    /* --- TradingView Data-Feed object --- */
    const datafeed = {
      onReady: (cb: any) =>
        cb({
          supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
          supports_marks: true,
          supports_timescale_marks: true,
          supports_time: true,
        }),

      searchSymbols: () => {},

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
        onError: any,
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
      enabled_features: ['study_templates'],
      symbol,
      interval,
      timezone: 'Asia/Jakarta',
      theme: 'Dark',
      autosize: true,
      datafeed,
      debug: true,
    });

    /* scroll/zoom viewport once chart is painted */
    // widget.onChartReady(() => {
    //   widget
    //     .activeChart()
    //     .timeScale()
    //     .setVisibleRange({
    //       from: Math.floor(defaultStartMs / 1000),
    //       to: Math.floor(defaultEndMs / 1000),
    //     });
    // });

    chartWidgetRef.current = widget;
    fetchLatestData(); // first poll immediately
  }

  return (
    <div
      id="tv_chart_container"
      className="w-full"
      style={{ height: '50vh' }}
    />
  );
}