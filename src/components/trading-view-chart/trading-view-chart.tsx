import { getIndexerUrl } from '@/constants/urls/urls-config';
import { useMarketWebSocket } from '@/hooks/use-market-websocket';
import { KlineEvent } from '@/services/market-websocket';
import { useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';

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
  poolId: string;
  baseDecimals?: number;
  quoteDecimals?: number;
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
  startTime?: number;
  endTime?: number;
  onChangeInterval?: (interval: string) => void;
  availablePairs?: TradingPair[];
}

export default function TradingViewChartContainer({
  chainId,
  symbol,
  interval = '1',
  startTime,
  endTime,
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
  const onTickRef = useRef<((bar: Bar) => void) | null>(null);
  const [lastBar, setLastBar] = useState<Bar | null>(null);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbol);
  const [klineInterval, setKlineInterval] = useState<string>('1m');

  const {
    lastMessage: klineMessage,
    isConnected: isKlineConnected,
    connect: connectKlineWebSocket,
    disconnect: disconnectKlineWebSocket
  } = useMarketWebSocket(chainId, 'kline_' + klineInterval, selectedSymbol.replace('/', ''));

  console.log('default symbol', symbol);

  useEffect(() => {
    console.log('📨 WebSocket message received:', klineMessage);
    if (klineMessage && klineMessage.e === 'kline') {
      console.log('✅ Valid kline event received');
      const klineEvent = klineMessage as KlineEvent;
      const k = klineEvent.k;

      if (k.s === selectedSymbol.replace('/','')) {
        console.log('🎯 Symbol matches, updating chart data:', k.s);
        const symbolWithoutSlash = selectedSymbol.replace('/', '');
        const pair = pairs.find(p => p.symbol === selectedSymbol || p.symbol === symbolWithoutSlash);
        const quoteDecimals = pair?.quoteDecimals || 18;

        console.log('🔍 Debug websocket bar:', {
          selectedSymbol,
          pair,
          quoteDecimals,
          rawClose: k.c,
          convertedClose: Number(formatUnits(BigInt(Math.floor(Number(k.c))), quoteDecimals))
        });

        const bar: Bar = {
          time: k.t,
          open: Number(formatUnits(BigInt(Math.floor(Number(k.o))), quoteDecimals)),
          high: Number(formatUnits(BigInt(Math.floor(Number(k.h))), quoteDecimals)),
          low: Number(formatUnits(BigInt(Math.floor(Number(k.l))), quoteDecimals)),
          close: Number(formatUnits(BigInt(Math.floor(Number(k.c))), quoteDecimals)),
          volume: parseFloat(k.v)
        };

        console.log('📊 New bar data:', bar);
        setLastBar(bar);
        
        if (onTickRef.current) {
          console.log('🔄 Sending data to TradingView via onTick');
          onTickRef.current(bar);
        } else {
          console.log('⚠️ onTick callback not available');
        }
      } else {
        console.log('❌ Symbol mismatch - expected:', selectedSymbol.replace('/',''), 'got:', k.s);
      }
    } else {
      console.log('❌ Invalid or missing kline event:', klineMessage);
    }
  }, [klineMessage, selectedSymbol]);

  useEffect(() => {
    if (availablePairs && availablePairs.length > 0) {
      setPairs(availablePairs);
      return;
    }

    async function fetchPairs() {
      try {
        const pairsUrl = `${getIndexerUrl(chainId)}/api/pairs`;
        const response = await fetch(pairsUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch pairs');
        }

        const data = await response.json();

        const formattedPairs = Array.isArray(data)
          ? data.map((pair: any) => ({
            symbol: pair.symbol,
            baseAsset: pair.baseAsset,
            quoteAsset: pair.quoteAsset,
            displayName: `${pair.baseAsset}/${pair.quoteAsset}`,
            poolId: pair.poolId,
            baseDecimals: pair.baseDecimals || 18,
            quoteDecimals: pair.quoteDecimals || 18,
          }))
          : [];

        console.log('📊 Loaded pairs:', formattedPairs);
        console.log('🔍 Debug pairs decimals:', formattedPairs.map(p => ({ symbol: p.symbol, baseDecimals: p.baseDecimals, quoteDecimals: p.quoteDecimals })));
        setPairs(formattedPairs);
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
        setPairs([
          {
            symbol: selectedSymbol,
            baseAsset: selectedSymbol.split('/')[0] || '',
            quoteAsset: selectedSymbol.split('/')[1] || '',
            displayName: selectedSymbol,
            poolId: '',
          },
        ]);
      }
    }

    fetchPairs();
  }, [chainId, availablePairs, selectedSymbol]);

  useEffect(() => {
    if (pairs.length > 0) {
      const symbolWithoutSlash = selectedSymbol.replace('/', '');
      const foundPair = pairs.find(p => p.symbol === selectedSymbol || p.symbol === symbolWithoutSlash);
      
      if (!foundPair) {
        console.log('Symbol not found in pairs, selecting first available:', pairs[0].symbol);
        setSelectedSymbol(pairs[0].symbol);
      } else if (foundPair.symbol !== selectedSymbol) {
        // If we found the pair but the format is different, update to use the format with slash for display
        const displaySymbol = foundPair.displayName || `${foundPair.baseAsset}/${foundPair.quoteAsset}`;
        console.log('Updating symbol format from', selectedSymbol, 'to', displaySymbol);
        setSelectedSymbol(displaySymbol);
      }
    }
  }, [pairs, selectedSymbol]);

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

    // Only create widget when pairs are loaded
    if (pairs.length > 0) {
      tvScriptLoadingPromise.then(() => onLoadScriptRef.current?.());
    }

    return () => {
      onLoadScriptRef.current = null;
    };
  }, [pairs]); 
  
  useEffect(() => {
    if (!chartWidgetRef.current) {
      return;
    }

    // chartWidgetRef.current?.setSymbol(selectedSymbol, () => { });

    console.log('🔄 Symbol/interval changed:', { selectedSymbol, klineInterval });
    console.log('📤 Disconnecting websocket...');
    disconnectKlineWebSocket();
    console.log('📥 Connecting websocket...');
    connectKlineWebSocket();
  }, [selectedSymbol, klineInterval]);

  async function fetchKlines(
    symbolName: string,
    mappedInterval: string,
    fromMs: number,
    toMs: number
  ): Promise<Bar[]> {
    try {
      const url =
        `${getIndexerUrl(chainId)}/api/kline?symbol=${symbolName}` +
        `&interval=${mappedInterval}&startTime=${fromMs}&endTime=${toMs}&limit=100000`;

      const res = await fetch(url);
      const data = await res.json();

      const symbolWithoutSlash = symbolName.replace('/', '');
      const pair = pairs.find(p => p.symbol === symbolName || p.symbol === symbolWithoutSlash);
      const quoteDecimals = pair?.quoteDecimals || 18;

      console.log('🔍 Debug fetchKlines:', {
        symbolName,
        symbolWithoutSlash,
        pair,
        quoteDecimals,
        sampleData: data[0],
        rawPrice: data[0]?.[4],
        convertedPrice: data[0] ? Number(formatUnits(BigInt(Math.floor(Number(data[0][4]))), quoteDecimals)) : 'no data',
        allPairsSymbols: pairs.map(p => p.symbol)
      });

      return data.map((d: any) => ({
        time: d[0],
        open: Number(formatUnits(BigInt(Math.floor(Number(d[1]))), quoteDecimals)),
        high: Number(formatUnits(BigInt(Math.floor(Number(d[2]))), quoteDecimals)),
        low: Number(formatUnits(BigInt(Math.floor(Number(d[3]))), quoteDecimals)),
        close: Number(formatUnits(BigInt(Math.floor(Number(d[4]))), quoteDecimals)),
        volume: Number(d[5]),
      }));
    } catch (err) {
      console.error('fetchKlines error', err);
      return [];
    }
  }

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

  function createWidget() {
    if (!document.getElementById('tv_chart_container') || !('TradingView' in window))
      return;

    const datafeed = {
      onReady: (cb: any) =>
        cb({
          supported_resolutions: ['1', '5', '30', '60', '1D'],
          supports_marks: true,
          supports_timescale_marks: true,
          supports_time: true,
        }),

      searchSymbols: async (
        userInput: string,
        exchange: string,
        symbolType: string,
        onResult: any
      ) => {
        let availablePairs = pairs;
        if (availablePairs.length === 0) {
          try {
            const pairsUrl = `${getIndexerUrl(chainId)}/api/pairs`;
            const response = await fetch(pairsUrl);
            if (response.ok) {
              const data = await response.json();
              availablePairs = Array.isArray(data)
                ? data.map((pair: any) => ({
                    symbol: pair.symbol,
                    baseAsset: pair.baseAsset,
                    quoteAsset: pair.quoteAsset,
                    displayName: `${pair.baseAsset}/${pair.quoteAsset}`,
                    poolId: pair.poolId,
                    baseDecimals: pair.baseDecimals || 18,
                    quoteDecimals: pair.quoteDecimals || 18,
                  }))
                : [];
            }
          } catch (error) {
            console.error('Error fetching pairs in searchSymbols:', error);
          }
        }

        const filteredPairs = availablePairs.filter(pair =>
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

      resolveSymbol: (symbolName: string, onResolve: any) => {
        const symbolWithoutSlash = symbolName.replace('/', '');
        const pair = pairs.find(p => p.symbol === symbolName || p.symbol === symbolWithoutSlash);
        const quoteDecimals = pair?.quoteDecimals || 18;
        const pricescale = Math.pow(10, Math.min(quoteDecimals, 8));
        
        console.log('🔍 Debug resolveSymbol:', {
          symbolName,
          pair,
          quoteDecimals,
          pricescale
        });
        
        onResolve({
          name: symbolName,
          ticker: symbolName,
          full_name: symbolName,
          description: symbolName,
          type: 'crypto',
          session: '24x7',
          timezone: 'Etc/UTC',
          minmov: 1,
          pricescale: pricescale,
          has_intraday: true,
          intraday_multipliers: ['1', '5', '15', '30', '60'],
          supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
          volume_precision: 8,
          data_status: 'streaming',
        });
      },

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

          console.log('symbolInfo', symbolInfo.name)

          const bars = await fetchKlines(symbolInfo.name, mappedInterval, fromMs, toMs);
          onResult(bars, { noData: !bars.length });
        } catch (e) {
          onError('getBars failed', e);
        }
      },

      subscribeBars: (symbolInfo: any, resolution: any, onTick: any) => {
        console.log('📡 TradingView subscribeBars called:', { symbolInfo: symbolInfo.name, resolution });
        if (dataUpdateIntervalRef.current) {
          clearInterval(dataUpdateIntervalRef.current);
          dataUpdateIntervalRef.current = null;
        }

        const mappedInterval = RESOLUTION_MAPPING[resolution];
        if (!mappedInterval) return;

        console.log('⏱️ Setting kline interval:', mappedInterval);
        setKlineInterval(mappedInterval);

        console.log('🔗 Setting onTick callback for TradingView');
        onTickRef.current = onTick;

        console.log('🔌 Connecting websocket for real-time data');
        connectKlineWebSocket();

        fetchLatestData();
      },

      unsubscribeBars: () => {
        // Disconnect from WebSocket
        // disconnectKlineWebSocket();

        // Clean up any existing interval as a fallback
        // if (dataUpdateIntervalRef.current) {
        //   clearInterval(dataUpdateIntervalRef.current);
        //   dataUpdateIntervalRef.current = null;
        // }
      },

      updateBar: (_bar: Bar) => {
        console.log('_bar', _bar)
       }, 
    };

    const widget = new window.TradingView.widget({
      container: 'tv_chart_container',
      library_path: '/charting_library/',
      locale: 'en',
      disabled_features: ['use_localstorage_for_settings'],
      enabled_features: ['symbol_search'],
      symbol: selectedSymbol,
      interval,
      timezone: 'Asia/Jakarta',
      theme: 'Dark',
      autosize: true,
      datafeed,
      debug: true,
    });

    widget.onChartReady(() => {
      widget.chart().onSymbolChanged().subscribe(null, async (symbolInfo: any) => {
        const newSymbol = symbolInfo.name;
        
        // Get pairs - either from state or fetch fresh
        let availablePairs = pairs;
        if (availablePairs.length === 0) {
          try {
            const pairsUrl = `${getIndexerUrl(chainId)}/api/pairs`;
            const response = await fetch(pairsUrl);
            if (response.ok) {
              const data = await response.json();
              availablePairs = Array.isArray(data)
                ? data.map((pair: any) => ({
                    symbol: pair.symbol,
                    baseAsset: pair.baseAsset,
                    quoteAsset: pair.quoteAsset,
                    displayName: `${pair.baseAsset}/${pair.quoteAsset}`,
                    poolId: pair.poolId,
                    baseDecimals: pair.baseDecimals || 18,
                    quoteDecimals: pair.quoteDecimals || 18,
                  }))
                : [];
            }
          } catch (error) {
            console.error('Error fetching pairs in onSymbolChanged:', error);
          }
        }
        
        const selectedPair = availablePairs.find(pair => pair.symbol === newSymbol);
        
        if (selectedPair && selectedPair.poolId) {
          window.location.href = `/spot/${selectedPair.poolId}`;
        }
      });
    });

    chartWidgetRef.current = widget;
    fetchLatestData();
  }

  return (
    <div className="w-full">
      <div id="tv_chart_container" className="w-full" style={{ height: '50vh' }} />
    </div>
  );
}
