"use client"

import { LIQUIDBOOK_GRAPHQL_URL } from "@/constants/subgraph-url"
import { matchOrderEvents } from "@/graphql/liquidbook/liquidbook.query"
import type { MatchOrderEvent, MatchOrderEventResponse } from "@/types/web3/liquidbook/matchOrderEvents"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { type CandlestickData, ColorType, createChart, type IChartApi, ISeriesApi, type Time } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { calculatePrice } from "../../../../helper"
import { formatUnits } from "viem"

const formatVolume = (value: bigint, decimals = 6) => {
  const formatted = formatUnits(value, decimals)
  const num = Number.parseFloat(formatted)

  const config = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  if (num >= 1e9) {
    return (num / 1e9).toLocaleString("en-US", config) + "B"
  } else if (num >= 1e6) {
    return (num / 1e6).toLocaleString("en-US", config) + "M"
  } else if (num >= 1e3) {
    return (num / 1e3).toLocaleString("en-US", config) + "K"
  } else {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })
  }
}

interface VolumeData {
  time: Time
  value: number
  color: string
}

function processTickData(data: MatchOrderEvent[]): {
  candlesticks: CandlestickData<Time>[]
  volumes: VolumeData[]
} {
  const candlesticks: CandlestickData<Time>[] = []
  const volumes: VolumeData[] = []

  for (let i = 0; i < data.length; i++) {
    const currentPrice = calculatePrice(data[i].tick)
    let open, high, low, close

    if (i === 0) {
      open = currentPrice
      high = currentPrice
      low = currentPrice
      close = currentPrice
    } else {
      const previousPrice = calculatePrice(data[i - 1].tick)
      open = previousPrice
      close = currentPrice
      // Add extended wicks by applying a multiplier to the price range
      const priceRange = Math.abs(close - open)
      const wickExtension = priceRange * 0.3 // Adjust this multiplier to control wick length
      high = Math.max(open, close) + wickExtension
      low = Math.min(open, close) - wickExtension
    }

    const candlestick = {
      time: data[i].timestamp as Time,
      open,
      high,
      low,
      close,
    }
    candlesticks.push(candlestick)

    const volumeValue = Number.parseFloat(formatUnits(BigInt(data[i].volume), 6))
    volumes.push({
      time: data[i].timestamp as Time,
      value: volumeValue,
      color: close >= open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
    })
  }

  return { candlesticks, volumes }
}

function filterUniqueTimestamps(data: MatchOrderEvent[]) {
  const uniqueMap = new Map()
  data.forEach((item) => {
    if (!uniqueMap.has(item.timestamp)) {
      uniqueMap.set(item.timestamp, item)
    }
  })
  return Array.from(uniqueMap.values())
}

interface ChartComponentProps {
  height?: number
}

function ChartComponent({ height = 500 }: ChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const timeDisplayRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState("")

  const { data, isLoading, error } = useQuery<MatchOrderEventResponse>({
    queryKey: ["tickEvents"],
    queryFn: async () => {
      return await request(LIQUIDBOOK_GRAPHQL_URL, matchOrderEvents)
    },
    refetchInterval: 500,
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

  useEffect(() => {
    if (!chartContainerRef.current || isLoading || !data) return

    const isDarkMode = theme === "dark"
    const mainHeight = height
    const volumeHeight = Math.floor(height * 0.2)

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

    if (data?.matchOrderEvents?.items) {
      const sortedItems = [...data.matchOrderEvents.items].sort((a, b) => a.timestamp - b.timestamp)
      const uniqueItems = filterUniqueTimestamps(sortedItems)
      const { candlesticks, volumes } = processTickData(uniqueItems)

      candlestickSeries.setData(candlesticks)
      volumeSeries.setData(volumes)

      chart.timeScale().fitContent()
      chart.timeScale().scrollToPosition(5, false)
    }
// update chart

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
      chart.remove()
    }
  }, [data, isLoading, theme, height])

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
      <div className="w-full p-2 bg-white dark:bg-[#151924] text-gray-900 dark:text-white ">
        <div ref={chartContainerRef} className="w-full" style={{ height }} />

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