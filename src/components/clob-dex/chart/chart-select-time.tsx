"use client"

import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address"
import { dailyCandleStickQuery, fiveMinuteCandleStickQuery, hourCandleStickQuery } from "@/graphql/gtx/clob"
import { useMarketStore } from "@/store/market-store"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { type CandlestickData, ColorType, createChart, type IChartApi, type Time } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { formatUnits } from "viem"
import { useChainId } from 'wagmi'

// Define interfaces for the candlestick data response
interface CandleStickItem {
  open: number;
  close: number;
  low: number;
  high: number;
  average: number;
  count: number;
  timestamp: number;
}

interface CandleStickResponse {
  dailyBucketss?: {
    items: CandleStickItem[];
  };
  fiveMinuteBucketss?: {
    items: CandleStickItem[];
  };
  hourBucketss?: {
    items: CandleStickItem[];
  };
}

interface VolumeData {
  time: Time
  value: number
  color: string
}

const formatPrice = (price: number, decimals: number): string => {
  return Number(formatUnits(BigInt(price), decimals)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function processCandleStickData(data: CandleStickItem[], quoteDecimals: number): {
  candlesticks: CandlestickData<Time>[]
  volumes: VolumeData[]
} {
  const candlesticks: CandlestickData<Time>[] = [];
  const volumes: VolumeData[] = [];

  // Sort data by timestamp to ensure chronological order
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  sortedData.forEach(candle => {
    // Convert pricing data from raw to formatted values with proper decimal places
    const openPrice = Number(formatUnits(BigInt(candle.open), quoteDecimals));
    const closePrice = Number(formatUnits(BigInt(candle.close), quoteDecimals));
    const lowPrice = Number(formatUnits(BigInt(candle.low), quoteDecimals));
    const highPrice = Number(formatUnits(BigInt(candle.high), quoteDecimals));

    // Create candlestick data point
    candlesticks.push({
      time: candle.timestamp as Time,
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
    });

    // Volume can be represented by the count
    // Use more transparent colors for better visual appearance
    volumes.push({
      time: candle.timestamp as Time,
      value: candle.count,
      color: closePrice >= openPrice 
        ? "rgba(38, 166, 154, 0.3)" // green for up candles
        : "rgba(239, 83, 80, 0.3)" // red for down candles
    });
  });

  return { candlesticks, volumes };
}

enum TimeFrame {
  DAILY = "daily",
  FIVE_MINUTE = "fiveMinute",
  HOURLY = "hourly",
}

interface ChartComponentProps {
  height?: number
}
function ChartComponent({ height = 430 }: ChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const timeDisplayRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState("")
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)
  const [priceChange, setPriceChange] = useState<{ value: string; percentage: string; isPositive: boolean } | null>(null)

  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(TimeFrame.HOURLY)

  const { selectedPoolId, quoteDecimals } = useMarketStore()

  const chainId = useChainId()
  const defaultChain = Number(DEFAULT_CHAIN)

  const { data, isLoading, error } = useQuery<CandleStickResponse>({
    queryKey: [selectedTimeFrame, String(chainId ?? defaultChain)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')

      switch (selectedTimeFrame) {
        case TimeFrame.DAILY:
          return await request(url, dailyCandleStickQuery, { poolId: selectedPoolId })
        case TimeFrame.FIVE_MINUTE:
          return await request(url, fiveMinuteCandleStickQuery, { poolId: selectedPoolId })
        case TimeFrame.HOURLY:
          return await request(url, hourCandleStickQuery, { poolId: selectedPoolId })
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    onSuccess: () => {
      console.log('[RPC-DEBUG] 📊 chart-select-time.tsx - Chart data refetch completed');
    },
    onError: (error) => {
      console.error('[RPC-DEBUG] 📊 chart-select-time.tsx - Chart data refetch error:', error);
    },
  })

  // Update UTC time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toUTCString())
    }

    const timer = setInterval(updateTime, 1000)
    updateTime()

    return () => clearInterval(timer)
  }, [])

  // Update current price from latest candle and calculate price change
  useEffect(() => {
    if (!data) return;
    
    const items = selectedTimeFrame === TimeFrame.DAILY
      ? data.dailyBucketss?.items
      : selectedTimeFrame === TimeFrame.HOURLY
        ? data.hourBucketss?.items
        : data.fiveMinuteBucketss?.items;
    
    if (items && items.length > 0) {
      // Sort items by timestamp to get latest and find a comparison point
      const sortedItems = [...items].sort((a, b) => b.timestamp - a.timestamp);
      const latestCandle = sortedItems[0];
      
      // Get the close price 24h ago or the earliest available if not enough data
      let comparisonCandle = sortedItems[sortedItems.length - 1];
      
      // Find a candle closest to 24h ago for comparison (if data spans enough time)
      const twentyFourHoursAgo = latestCandle.timestamp - (24 * 60 * 60);
      const comparisonCandleIndex = sortedItems.findIndex(candle => candle.timestamp <= twentyFourHoursAgo);
      if (comparisonCandleIndex !== -1) {
        comparisonCandle = sortedItems[comparisonCandleIndex];
      }
      
      const latestPrice = Number(formatUnits(BigInt(latestCandle.close), quoteDecimals));
      const previousPrice = Number(formatUnits(BigInt(comparisonCandle.close), quoteDecimals));
      
      // Calculate the absolute and percentage change
      const change = latestPrice - previousPrice;
      const percentChange = (change / previousPrice) * 100;
      const isPositive = change >= 0;
      
      setCurrentPrice(formatPrice(latestCandle.close, quoteDecimals));
      setPriceChange({
        value: change.toFixed(2),
        percentage: percentChange.toFixed(2),
        isPositive
      });
    }
  }, [data]);

  useEffect(() => {
    if (!chartContainerRef.current || isLoading || !data) return

    // Clean up any existing chart - but safely
    try {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    } catch (e) {
      console.error("Error removing chart:", e);
      // Chart was already disposed, just null the reference
      chartRef.current = null;
    }

    const mainHeight = height

    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: "rgba(255, 255, 255, 0.7)",
        background: { type: ColorType.Solid, color: "#131722" },
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 10, // Smaller font size
      },
      timeScale: {
        borderColor: "rgba(42, 46, 57, 0.3)",
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        },
        fixLeftEdge: true,
        fixRightEdge: true,
        barSpacing: 1, // Key setting to make candlesticks smaller and more compact
        minBarSpacing: 1, // Minimum space between bars
      },
      grid: {
        vertLines: { 
          color: "rgba(42, 46, 57, 0.2)",
          style: 1, // Solid
        },
        horzLines: { 
          color: "rgba(42, 46, 57, 0.2)",
          style: 1, // Solid
        },
      },

      rightPriceScale: {
        borderColor: "rgba(42, 46, 57, 0.3)",
        scaleMargins: {
          top: 0.01,
          bottom: 0.01,
        },
        borderVisible: true,
        autoScale: false,
        visible: true,
        entireTextOnly: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(117, 134, 150, 0.6)",
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: "#2B2B43",
        },
        horzLine: {
          color: "rgba(117, 134, 150, 0.6)",
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: "#2B2B43",
        },
      },
      handleScroll: {
        vertTouchDrag: true,
        horzTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.001,
      },
    })

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    })

    const volumePriceScale = chart.priceScale("volume")
    if (volumePriceScale) {
      volumePriceScale.applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        autoScale: false,
        borderVisible: false,
        visible: true,
      })
    }

    // Get the daily data items
    const items = selectedTimeFrame === TimeFrame.DAILY
      ? data.dailyBucketss?.items
      : selectedTimeFrame === TimeFrame.HOURLY
        ? data.hourBucketss?.items
        : data.fiveMinuteBucketss?.items;

          if (items) {
      const { candlesticks, volumes } = processCandleStickData(items, quoteDecimals)

      candlestickSeries.setData(candlesticks)
      volumeSeries.setData(volumes)

      // Add a price line for the current price
      if (candlesticks.length > 0) {
        const lastCandle = candlesticks[candlesticks.length - 1];
        candlestickSeries.createPriceLine({
          price: lastCandle.close,
          color: '#2962FF',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Current',
        });
      }

      // Create a more balanced view by setting visible range to show more candles
      const visibleLogicalRange = {
        from: Math.max(0, candlesticks.length - 120), // Show many more candles for a denser view
        to: candlesticks.length + 2,
      };
      chart.timeScale().setVisibleLogicalRange(visibleLogicalRange);
    }

    const handleResize = () => {
      chart.applyOptions({
        height: mainHeight,
        width: chartContainerRef.current?.clientWidth || 800,
      })
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      try {
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
        }
      } catch (e) {
        console.error("Error cleaning up chart:", e)
        chartRef.current = null
      }
    }
  }, [data, isLoading, theme, height])

  // Apply theme changes to existing chart
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          textColor: "rgba(255, 255, 255, 0.7)",
          background: { type: ColorType.Solid, color: "#131722" },
          fontSize: 10, // Smaller font size
        },
        grid: {
          vertLines: { color: "rgba(42, 46, 57, 0.2)" },
          horzLines: { color: "rgba(42, 46, 57, 0.2)" },
        },
      })
    }
  }, [theme])

  // Handle timeframe selection
  const handleTimeFrameChange = (timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-[#131722] rounded-md border border-gray-800 text-gray-300 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs font-medium">Loading chart data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[300px] bg-[#131722] rounded-md border border-gray-800 text-gray-300 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="h-6 w-6 text-red-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <span className="text-xs font-medium">Error loading chart data</span>
          <span className="text-xs text-gray-400 mt-1">{error?.message || String(error) || 'Unknown error'}</span>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full bg-white dark:bg-[#131722] text-gray-900 dark:text-white text-xs">
        {/* Chart Header with Price Information and TimeFrame Selector */}
        <div className="flex flex-wrap items-center justify-between p-1 border-b border-gray-800">
          {/* Left side - Price information */}
          <div className="flex items-baseline space-x-2">
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-xs font-medium text-gray-200">Price</span>
              </div>
              <span className="text-xs font-medium">${currentPrice || "0.00"}</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-xs font-medium text-gray-200">24h</span>
              </div>
              {priceChange && (
                <span className={`text-xs font-medium ${priceChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange.isPositive ? '+' : ''}{priceChange.value}
                </span>
              )}
              {!priceChange && (
                <span className="text-xs font-medium">-</span>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-xs font-medium text-gray-200">Vol</span>
              </div>
              <span className="text-xs font-medium">${currentPrice ? '6.77B' : '0'}</span>
            </div>
          </div>
          
          {/* Right side - Current price and time selector */}
          <div className="flex items-center">            
            <div className="flex rounded-md overflow-hidden">
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.FIVE_MINUTE)}
                className={`px-2 py-0.5 text-xs ${
                  selectedTimeFrame === TimeFrame.FIVE_MINUTE
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                5M
              </button>
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.HOURLY)}
                className={`px-2 py-0.5 text-xs ${
                  selectedTimeFrame === TimeFrame.HOURLY
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                1H
              </button>
              <button
                onClick={() => handleTimeFrameChange(TimeFrame.DAILY)}
                className={`px-2 py-0.5 text-xs ${
                  selectedTimeFrame === TimeFrame.DAILY
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                1D
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-1">
          <div ref={chartContainerRef} className="w-full" style={{ height }} />
        </div>
      </div>
      <div
        ref={timeDisplayRef}
        className="text-right text-xs py-1 pr-2 bg-[#131722] text-gray-400 border-t border-gray-800 rounded-b-lg"
      >
        {currentTime}
      </div>
    </QueryClientProvider>
  )
}

export default ChartComponent