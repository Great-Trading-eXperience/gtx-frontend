'use client';

import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  dailyCandleStickPonderQuery,
  DailyCandleStickPonderResponse,
  dailyCandleStickQuery,
  DailyCandleStickResponse,
  FiveMinuteCandleStickPonderResponse,
  fiveMinuteCandleStickQuery,
  FiveMinuteCandleStickResponse,
  hourCandleStickPonderQuery,
  HourCandleStickPonderResponse,
  hourCandleStickQuery,
  HourCandleStickResponse,
  MinuteCandleStickPonderResponse,
  MinuteCandleStickResponse,
  PoolItem,
} from '@/graphql/gtx/clob';
import { useMarketStore } from '@/store/market-store';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import {
  type CandlestickData,
  ColorType,
  createChart,
  type IChartApi,
  type Time,
} from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { TimeFrame } from '../../../../lib/enums/clob.enum';
import { ClobDexComponentProps } from '../clob-dex';
import TradingViewChartContainer, {
  TradingPair,
} from '@/components/trading-view-chart/trading-view-chart';
import { getUseSubgraph } from '@/utils/env';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import GTXLoadingAnimation from './gtx-loading-animation';

// Updated interface to match the new Binance-compatible bucket format
interface BucketData {
  id: string;
  openTime: number; // Renamed from timestamp
  closeTime: number; // New field
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // New field
  quoteVolume: number; // New field
  average: number;
  count: number;
  takerBuyBaseVolume: number; // New field
  takerBuyQuoteVolume: number; // New field
  poolId: string;
}

// Binance kline format (as an array)
type BinanceKlineData = [
  number, // Open time
  string, // Open price
  string, // High price
  string, // Low price
  string, // Close price
  string, // Volume (base asset)
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string // Unused field (ignored)
];

interface CandleStickItem extends BucketData {}

interface CandleStickPonderResponse {
  dailyBucketss?: {
    items: CandleStickItem[];
  };
  fiveMinuteBucketss?: {
    items: CandleStickItem[];
  };
  hourBucketss?: {
    items: CandleStickItem[];
  };
  minuteBucketss?: {
    items: CandleStickItem[];
  };
}

interface CandleStickResponse {
  dailyBuckets?: CandleStickItem[];
  fiveMinuteBuckets?: CandleStickItem[];
  hourBuckets?: CandleStickItem[];
  minuteBuckets?: CandleStickItem[];
}

interface VolumeData {
  time: Time;
  value: number;
  color: string;
}

const formatPrice = (price: number, decimals: number): string => {
  return Number(formatUnits(BigInt(price), decimals)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function processCandleStickData(
  data: CandleStickItem[],
  quoteDecimals: number
): {
  candlesticks: CandlestickData<Time>[];
  volumes: VolumeData[];
} {
  const candlesticks: CandlestickData<Time>[] = [];
  const volumes: VolumeData[] = [];

  data.forEach(candle => {
    const openPrice = Number(formatUnits(BigInt(candle.open), quoteDecimals));
    const closePrice = Number(formatUnits(BigInt(candle.close), quoteDecimals));
    const lowPrice = Number(formatUnits(BigInt(candle.low), quoteDecimals));
    const highPrice = Number(formatUnits(BigInt(candle.high), quoteDecimals));

    candlesticks.push({
      time: candle.openTime as Time, // Updated from timestamp to openTime
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
    });

    // Use the volume field if available, otherwise fallback to count for backward compatibility
    const volumeValue = candle.volume !== undefined ? candle.volume : candle.count;

    volumes.push({
      time: candle.openTime as Time, // Updated from timestamp to openTime
      value: volumeValue,
      color:
        closePrice >= openPrice ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    });
  });

  return { candlesticks, volumes };
}

export type ChartComponentProps = ClobDexComponentProps & {
  height?: number;
  poolsData?: ProcessedPoolItem[] | null;
  poolsLoading?: boolean;
  poolsError?: Error | null;
};

function ChartComponent({
  chainId,
  defaultChainId,
  selectedPool,
  poolsData,
  poolsLoading,
  poolsError,
  height = 380,
}: ChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient());
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const timeDisplayRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState('');
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(TimeFrame.HOURLY);
  const [availablePairs, setAvailablePairs] = useState<TradingPair[]>();

  const { quoteDecimals } = useMarketStore();

  const { data, isLoading, error } = useQuery<CandleStickItem[]>({
    queryKey: [
      'candlesticks',
      selectedTimeFrame,
      selectedPool?.orderBook,
      selectedPool?.coin,
    ],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');

      const query =
        selectedTimeFrame === TimeFrame.DAILY
          ? getUseSubgraph()
            ? dailyCandleStickQuery
            : dailyCandleStickPonderQuery
          : selectedTimeFrame === TimeFrame.HOURLY
          ? getUseSubgraph()
            ? hourCandleStickQuery
            : hourCandleStickPonderQuery
          : selectedTimeFrame === TimeFrame.FIVE_MINUTE
          ? fiveMinuteCandleStickQuery
          : selectedTimeFrame === TimeFrame.MINUTE
          ? fiveMinuteCandleStickQuery
          : fiveMinuteCandleStickQuery;

      const result = await request(url, query, { poolId: selectedPool?.orderBook });

      // Process the GraphQL response
      let items;
      if (selectedTimeFrame === TimeFrame.DAILY) {
        if (getUseSubgraph()) {
          items = (result as DailyCandleStickPonderResponse)?.dailyBucketss?.items;
        } else {
          items = (result as DailyCandleStickResponse).dailyBuckets;
        }
      } else if (selectedTimeFrame === TimeFrame.HOURLY) {
        if (getUseSubgraph()) {
          items = (result as HourCandleStickPonderResponse)?.hourBucketss?.items;
        } else {
          items = (result as HourCandleStickResponse).hourBuckets;
        }
      } else if (selectedTimeFrame === TimeFrame.FIVE_MINUTE) {
        if (getUseSubgraph()) {
          items = (result as FiveMinuteCandleStickPonderResponse)?.fiveMinuteBucketss
            ?.items;
        } else {
          items = (result as FiveMinuteCandleStickResponse).fiveMinuteBuckets;
        }
      } else if (selectedTimeFrame === TimeFrame.MINUTE) {
        if (getUseSubgraph()) {
          items = (result as MinuteCandleStickPonderResponse)?.minuteBucketss?.items;
        } else {
          items = (result as MinuteCandleStickResponse).minuteBuckets;
        }
      }

      return (
        items?.map((item: any) => ({
          ...item,
          openTime: item.openTime || item.timestamp,
          timestamp: item.timestamp || item.openTime,
        })) || []
      );
    },
    enabled: !!selectedPool,
    refetchInterval: 60000,
    staleTime: 60000,
  });

  const [processedData, setProcessedData] = useState<{
    candlesticks: CandlestickData<Time>[];
    volumes: VolumeData[];
  }>({ candlesticks: [], volumes: [] });

  useEffect(() => {
    if (!poolsData || poolsData.length === 0) return;
    const pairs = poolsData.map(pool => ({
      symbol: `${pool.baseSymbol}/${pool.quoteSymbol}`,
      baseAsset: pool.baseSymbol,
      quoteAsset: pool.quoteSymbol,
      displayName: `${pool.baseSymbol}/${pool.quoteSymbol}`,
    }));
    setAvailablePairs(pairs);
  }, [poolsData]);

  useEffect(() => {
    if (!data) return;

    const sortedData = [...data].sort((a, b) => {
      const aTime = a.openTime || a.timestamp;
      const bTime = b.openTime || b.timestamp;
      return Number(aTime) - Number(bTime);
    });

    const processed = processCandleStickData(sortedData, quoteDecimals);
    setProcessedData(processed);
  }, [data, quoteDecimals]);

  useEffect(() => {
    if (!processedData.candlesticks.length) return;

    const latestCandle = [...processedData.candlesticks].sort(
      (a, b) => Number(b.time) - Number(a.time)
    )[0];
    if (latestCandle) {
      setCurrentPrice(latestCandle.close.toFixed(quoteDecimals > 8 ? 8 : quoteDecimals));
    }
  }, [processedData, quoteDecimals]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
        background: {
          type: ColorType.Solid,
          color: theme === 'dark' ? '#151924' : '#ffffff',
        },
      },
      grid: {
        vertLines: {
          color: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
        },
        horzLines: {
          color: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
        },
      },
      timeScale: {
        borderColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: theme === 'dark' ? '#758696' : '#9B9B9B',
          width: 1,
          style: 3,
          labelBackgroundColor: theme === 'dark' ? '#758696' : '#9B9B9B',
        },
        horzLine: {
          color: theme === 'dark' ? '#758696' : '#9B9B9B',
          width: 1,
          style: 3,
          labelBackgroundColor: theme === 'dark' ? '#758696' : '#9B9B9B',
        },
      },
      height: height || chartContainerRef.current?.clientHeight || 380,
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    candlestickSeries.setData(processedData.candlesticks);
    volumeSeries.setData(processedData.volumes);

    // Set up volume scale
    const volumePriceScale = chart.priceScale('');
    volumePriceScale.applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      borderVisible: false,
    });

    // Fit content after data is loaded
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height || chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.removeSeries(candlestickSeries);
      chart.removeSeries(volumeSeries);
      chart.remove();
    };
  }, [processedData, theme, height]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString());
    };

    const timer = setInterval(updateTime, 1000);
    updateTime();

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const isDarkMode = theme === 'dark';
    chartRef.current.applyOptions({
      layout: {
        textColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
        background: { type: ColorType.Solid, color: isDarkMode ? '#151924' : '#ffffff' },
      },
      grid: {
        vertLines: {
          color: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
        },
        horzLines: {
          color: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
        },
      },
    });
  }, [theme]);

  const handleTimeFrameChange = (timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] rounded-b-lg text-gray-900 dark:text-white flex items-center justify-center">
        <GTXLoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] text-gray-900 dark:text-white flex items-center justify-center">
        Error: {error.toString()}
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full bg-white dark:bg-[#151924] text-gray-900 dark:text-white">
        {!selectedPool?.coin && (
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-lg font-semibold">
              {currentPrice && <span>{currentPrice}</span>}
            </div>
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.MINUTE)}
                className={`px-3 py-1 text-xs ${
                  selectedTimeFrame === TimeFrame.MINUTE
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                1M
              </button>
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.FIVE_MINUTE)}
                className={`px-3 py-1 text-xs ${
                  selectedTimeFrame === TimeFrame.FIVE_MINUTE
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                5M
              </button>
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.HOURLY)}
                className={`px-3 py-1 text-xs ${
                  selectedTimeFrame === TimeFrame.HOURLY
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                1H
              </button>
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.DAILY)}
                className={`px-3 py-1 text-xs ${
                  selectedTimeFrame === TimeFrame.DAILY
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                1D
              </button>
            </div>
          </div>
        )}

        <div className="p-2">
          {selectedPool?.coin ? (
            <TradingViewChartContainer
              chainId={chainId}
              symbol={selectedPool?.coin}
              availablePairs={availablePairs}
            />
          ) : (
            <div ref={chartContainerRef} className="w-full" style={{ height }} />
          )}
        </div>
      </div>
      {/* <div
        ref={timeDisplayRef}
        className="text-right text-sm py-1 pr-4 bg-gray-100 dark:bg-[#151924] text-gray-900 dark:text-white rounded-b-lg"
      >
        {currentTime}
      </div> */}
    </QueryClientProvider>
  );
}

export default ChartComponent;
