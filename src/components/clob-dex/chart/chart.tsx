"use client"

import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { dailyCandleStickQuery, fiveMinuteCandleStickQuery, hourCandleStickQuery } from "@/graphql/gtx/gtx.query"
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

  data.forEach(candle => {
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
    volumes.push({
      time: candle.timestamp as Time,
      value: candle.count,
      color: closePrice >= openPrice 
        ? "rgba(38, 166, 154, 0.5)" // green for up candles
        : "rgba(239, 83, 80, 0.5)" // red for down candles
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

function ChartComponent({ height = 380 }: ChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const timeDisplayRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState("")
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)

  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(TimeFrame.HOURLY)

  const { selectedPoolId, quoteDecimals } = useMarketStore()

  const chainId = useChainId()
  const defaultChain = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN)

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

  // Update current price from latest candle
  useEffect(() => {
    if (!data) return;
    
    const items = selectedTimeFrame === TimeFrame.DAILY
      ? data.dailyBucketss?.items
      : selectedTimeFrame === TimeFrame.HOURLY
        ? data.hourBucketss?.items
        : data.fiveMinuteBucketss?.items;
    
    if (items && items.length > 0) {
      // Find the candle with the latest timestamp
      const latestCandle = [...items].sort((a, b) => b.timestamp - a.timestamp)[0];
      setCurrentPrice(formatPrice(latestCandle.close, quoteDecimals));
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

    const isDarkMode = theme === "dark"
    const mainHeight = height

    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
        background: { type: ColorType.Solid, color: isDarkMode ? "#151924" : "#ffffff" },
      },
      grid: {
        vertLines: { color: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
        horzLines: { color: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
      },
      timeScale: {
        borderColor: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDarkMode ? "#758696" : "#9B9B9B",
          width: 1,
          style: 3,
          labelBackgroundColor: isDarkMode ? "#758696" : "#9B9B9B",
        },
        horzLine: {
          color: isDarkMode ? "#758696" : "#9B9B9B",
          width: 1,
          style: 3,
          labelBackgroundColor: isDarkMode ? "#758696" : "#9B9B9B",
        },
      },
      height: mainHeight,
    })

    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
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

      chart.timeScale().fitContent()
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
      const isDarkMode = theme === "dark"
      chartRef.current.applyOptions({
        layout: {
          textColor: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
          background: { type: ColorType.Solid, color: isDarkMode ? "#151924" : "#ffffff" },
        },
        grid: {
          vertLines: { color: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
          horzLines: { color: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
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
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] rounded-b-lg text-gray-900 dark:text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] text-gray-900 dark:text-white flex items-center justify-center">
        Error: {error.toString()}
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full bg-white dark:bg-[#151924] text-gray-900 dark:text-white">
        {/* TimeFrame Selector */}
        <div className="flex items-center justify-end space-x-2 p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
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
        
        <div className="p-2">
          <div ref={chartContainerRef} className="w-full" style={{ height }} />
        </div>
      </div>
      <div
        ref={timeDisplayRef}
        className="text-right text-sm py-1 pr-4 bg-gray-100 dark:bg-[#151924] text-gray-900 dark:text-white rounded-b-lg"
      >
        {currentTime}
      </div>
    </QueryClientProvider>
  )
}

export default ChartComponent