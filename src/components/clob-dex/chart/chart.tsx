"use client"

import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { DailyCandleStickPonderResponse, dailyCandleStickQuery, DailyCandleStickResponse, FiveMinuteCandleStickPonderResponse, fiveMinuteCandleStickQuery, FiveMinuteCandleStickResponse, HourCandleStickPonderResponse, hourCandleStickQuery, HourCandleStickResponse, MinuteCandleStickPonderResponse, MinuteCandleStickResponse } from "@/graphql/gtx/clob"
import { useMarketStore } from "@/store/market-store"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { type CandlestickData, ColorType, createChart, type IChartApi, type Time } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { formatUnits } from "viem"
import { TimeFrame } from "../../../../lib/enums/clob.enum"
import { ClobDexComponentProps } from "../clob-dex"

interface CandleStickItem {
  open: number;
  close: number;
  low: number;
  high: number;
  average: number;
  count: number;
  timestamp: number;
}

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
}

interface CandleStickResponse {
  dailyBucketss?: CandleStickItem[],
  fiveMinuteBucketss?: CandleStickItem[],
  hourBucketss?: CandleStickItem[],
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
    const openPrice = Number(formatUnits(BigInt(candle.open), quoteDecimals));
    const closePrice = Number(formatUnits(BigInt(candle.close), quoteDecimals));
    const lowPrice = Number(formatUnits(BigInt(candle.low), quoteDecimals));
    const highPrice = Number(formatUnits(BigInt(candle.high), quoteDecimals));

    candlesticks.push({
      time: candle.timestamp as Time,
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
    });

    volumes.push({
      time: candle.timestamp as Time,
      value: candle.count,
      color: closePrice >= openPrice
        ? "rgba(38, 166, 154, 0.5)"
        : "rgba(239, 83, 80, 0.5)"
    });
  });

  return { candlesticks, volumes };
}

export type ChartComponentProps = ClobDexComponentProps & {
  height?: number
}

function ChartComponent({ chainId, defaultChainId, poolsData, height = 380 }: ChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const timeDisplayRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState("")
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(TimeFrame.HOURLY)

  const { selectedPool, quoteDecimals } = useMarketStore()

  const { data, isLoading, error } = useQuery<DailyCandleStickResponse | HourCandleStickResponse | FiveMinuteCandleStickResponse | MinuteCandleStickResponse>({
    queryKey: ['candlesticks', selectedTimeFrame, selectedPool?.orderBook],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')

      const query = selectedTimeFrame === TimeFrame.DAILY
        ? dailyCandleStickQuery
        : selectedTimeFrame === TimeFrame.HOURLY
          ? hourCandleStickQuery
          : fiveMinuteCandleStickQuery

      return await request(url, query, { poolId: selectedPool?.orderBook })
    },
    enabled: !!selectedPool,
    refetchInterval: 60000,
    staleTime: 60000
  })

  const processCandleStickData = (data: DailyCandleStickResponse | HourCandleStickResponse | FiveMinuteCandleStickResponse | MinuteCandleStickResponse | undefined) => {
    if (!data) return { candlesticks: [], volumes: [] }

    let items;
    if (selectedTimeFrame === TimeFrame.DAILY) {
      if ('dailyBucketss' in data) {
        items = (data as DailyCandleStickPonderResponse)?.dailyBucketss?.items;
      } else {
        items = (data as DailyCandleStickResponse).dailyBuckets;
      }
    } else if (selectedTimeFrame === TimeFrame.HOURLY) {
      if ('hourBucketss' in data) {
        items = (data as HourCandleStickPonderResponse)?.hourBucketss?.items;
      } else {
        items = (data as HourCandleStickResponse).hourBuckets;
      }
    } else if (selectedTimeFrame === TimeFrame.FIVE_MINUTE) {
      if ('fiveMinuteBucketss' in data) {
        items = (data as FiveMinuteCandleStickPonderResponse)?.fiveMinuteBucketss?.items;
      } else {
        items = (data as FiveMinuteCandleStickResponse).fiveMinuteBuckets;
      }
    } else if (selectedTimeFrame === TimeFrame.MINUTE) {
      if ('minuteBucketss' in data) {
        items = (data as MinuteCandleStickPonderResponse)?.minuteBucketss?.items;
      } else {
        items = (data as MinuteCandleStickResponse).minuteBuckets;
      }
    }

    if (!items || items.length === 0) return { candlesticks: [], volumes: [] }

    const candlesticks: CandlestickData<Time>[] = []
    const volumes: VolumeData[] = []

    // Sort data by timestamp to ensure chronological order
    const sortedData = [...items].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

    sortedData.forEach(candle => {
      const openPrice = Number(formatUnits(BigInt(candle.open), quoteDecimals))
      const closePrice = Number(formatUnits(BigInt(candle.close), quoteDecimals))
      const lowPrice = Number(formatUnits(BigInt(candle.low), quoteDecimals))
      const highPrice = Number(formatUnits(BigInt(candle.high), quoteDecimals))

      candlesticks.push({
        time: Number(candle.timestamp) as Time,
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
      })

      volumes.push({
        time: Number(candle.timestamp) as Time,
        value: Number(candle.count),
        color: closePrice >= openPrice
          ? "rgba(38, 166, 154, 0.5)"
          : "rgba(239, 83, 80, 0.5)"
      })
    })

    return { candlesticks, volumes }
  }

  const [processedData, setProcessedData] = useState<{ candlesticks: CandlestickData<Time>[], volumes: VolumeData[] }>({ candlesticks: [], volumes: [] })

  useEffect(() => {
    const processed = processCandleStickData(data)
    setProcessedData(processed)
  }, [data, quoteDecimals])

  useEffect(() => {
    if (!processedData.candlesticks.length) return

    const latestCandle = [...processedData.candlesticks].sort((a, b) => Number(b.time) - Number(a.time))[0]
    if (latestCandle) {
      setCurrentPrice(formatPrice(latestCandle.close, quoteDecimals))
    }
  }, [processedData])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
        background: { type: ColorType.Solid, color: theme === "dark" ? "#151924" : "#ffffff" },
      },
      grid: {
        vertLines: { color: theme === "dark" ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
        horzLines: { color: theme === "dark" ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
      },
      timeScale: {
        borderColor: theme === "dark" ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: theme === "dark" ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: theme === "dark" ? "#758696" : "#9B9B9B",
          width: 1,
          style: 3,
          labelBackgroundColor: theme === "dark" ? "#758696" : "#9B9B9B",
        },
        horzLine: {
          color: theme === "dark" ? "#758696" : "#9B9B9B",
          width: 1,
          style: 3,
          labelBackgroundColor: theme === "dark" ? "#758696" : "#9B9B9B",
        },
      },
      height: height || chartContainerRef.current?.clientHeight || 380,
    })

    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350"
    })

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Set to empty string to create new scale
    })

    candlestickSeries.setData(processedData.candlesticks)
    volumeSeries.setData(processedData.volumes)

    // Set up volume scale
    const volumePriceScale = chart.priceScale("")
    volumePriceScale.applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      borderVisible: false,
    })

    // Fit content after data is loaded
    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height || chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.removeSeries(candlestickSeries)
      chart.removeSeries(volumeSeries)
    }
  }, [processedData, theme, height])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toUTCString())
    }

    const timer = setInterval(updateTime, 1000)
    updateTime()

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!chartRef.current) return

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
  }, [theme])

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
        <div className="flex items-center justify-end space-x-2 p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => handleTimeFrameChange(TimeFrame.FIVE_MINUTE)}
              className={`px-3 py-1 text-xs ${selectedTimeFrame === TimeFrame.FIVE_MINUTE
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
            >
              5M
            </button>
            <button
              onClick={() => handleTimeFrameChange(TimeFrame.HOURLY)}
              className={`px-3 py-1 text-xs ${selectedTimeFrame === TimeFrame.HOURLY
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
            >
              1H
            </button>
            <button
              onClick={() => handleTimeFrameChange(TimeFrame.DAILY)}
              className={`px-3 py-1 text-xs ${selectedTimeFrame === TimeFrame.DAILY
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