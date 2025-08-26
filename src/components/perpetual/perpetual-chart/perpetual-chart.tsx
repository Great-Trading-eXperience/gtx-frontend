"use client"

import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { pricesQuery } from "@/graphql/gtx/perpetual"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { formatUnits } from "viem"
import { createChart, ColorType, type IChartApi, type Time, type CandlestickData } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { usePerpetualMarketStore } from "@/store/perpetual-market-store"

// Define interfaces for the price and market data responses
interface PriceItem {
  id: string
  token: string
  price: number
  timestamp: number
  blockNumber: number
}

interface PricesResponse {
  prices: {
    items: PriceItem[]
    totalCount: number
    pageInfo: {
      startCursor: string
      hasPreviousPage: boolean
      hasNextPage: boolean
      endCursor: string
    }
  }
}

interface ChartDataPoint {
  time: Time
  value: number
}

// Safe format units function to prevent crashes
const safeFormatUnits = (value: string | number, decimals: number): number => {
  try {
    // Ensure we have a valid string to work with
    const valueStr = String(value).replace(/[^0-9]/g, "") || "0"
    // For extremely large numbers, we need to be careful
    if (valueStr.length > 78) {
      // Too large for BigInt, approximate value
      const scientific = Number.parseFloat(valueStr).toExponential()
      return Number.parseFloat(scientific) / Math.pow(10, decimals)
    }
    // Use BigInt for normal values
    return Number(formatUnits(BigInt(valueStr), decimals))
  } catch (error) {
    console.error("Error formatting units:", error, "Value:", value, "Decimals:", decimals)
    return 0
  }
}

// Get token decimals based on symbol or market name
const getTokenDecimals = (tokenAddress: string, marketTokenMap: Record<string, any>): number => {
  try {
    // Find the market that uses this token
    const market = marketTokenMap[tokenAddress]

    if (!market) return 18 // Default to 18 decimals (ETH standard)

    // Extract symbol from market name (assumes format like GTX_XXX_YYY)
    const parts = market.name.split("_")
    if (parts.length < 2) return 18

    // Get token symbol - if this is a long token, it's the middle part, otherwise it's the last part
    const isLongToken = market.longToken === tokenAddress
    const symbol = isLongToken ? parts[1] : parts[2]

    switch (symbol) {
      case "WETH":
        return 18
      case "WBTC":
        return 18
      case "LINK":
        return 18
      case "DOGE":
        return 18
      case "PEPE":
        return 18
      case "TRUMP":
        return 18
      case "USDC":
        return 6
      default:
        return 18
    }
  } catch (error) {
    console.error("Error determining token decimals:", error)
    return 18 // Default to 18 in case of any errors
  }
}

const formatPrice = (price: number | string, tokenAddress: string, marketTokenMap: Record<string, any>): string => {
  try {
    const decimals = getTokenDecimals(tokenAddress, marketTokenMap)
    const formattedValue = safeFormatUnits(price, decimals)
    return formattedValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch (error) {
    console.error("Error formatting price:", error)
    return "0.00" // Return a default value in case of errors
  }
}

function processChartData(prices: PriceItem[], tokenAddress: string, marketTokenMap: Record<string, any>): CandlestickData<Time>[] {
  try {
    // Filter prices for the selected token is now handled in the GraphQL query
    const tokenPrices = prices

    // Sort by timestamp (ascending)
    tokenPrices.sort((a, b) => a.timestamp - b.timestamp)

    // Get token decimals
    const decimals = getTokenDecimals(tokenAddress, marketTokenMap)

    const candlesticks: CandlestickData<Time>[] = []

    // Group prices by day for candlestick formation
    const dailyPrices = new Map<number, PriceItem[]>()

    tokenPrices.forEach((price) => {
      // Convert timestamp to day (truncate to day)
      const day = Math.floor(price.timestamp / 86400) * 86400
      if (!dailyPrices.has(day)) {
        dailyPrices.set(day, [])
      }
      dailyPrices.get(day)?.push(price)
    })

    // Create candlesticks from daily price groups
    dailyPrices.forEach((prices, day) => {
      if (prices.length === 0) return

      // Sort prices within the day
      prices.sort((a, b) => a.timestamp - b.timestamp)

      const open = safeFormatUnits(prices[0].price, decimals)
      const close = safeFormatUnits(prices[prices.length - 1].price, decimals)

      // Find high and low
      let high = Number.NEGATIVE_INFINITY
      let low = Number.POSITIVE_INFINITY

      prices.forEach((price) => {
        const value = safeFormatUnits(price.price, decimals)
        high = Math.max(high, value)
        low = Math.min(low, value)
      })

      // Create candlestick data point
      candlesticks.push({
        time: day as Time,
        open,
        high,
        low,
        close,
      })
    })

    return candlesticks
  } catch (error) {
    console.error("Error processing chart data:", error)
    return [] // Return empty array in case of errors
  }
}

interface PerpetualChartComponentProps {
  height?: number
}

function PerpetualChartComponent({ height = 620 }: PerpetualChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { theme } = useTheme()
  
  // Get data from Zustand store
  const { 
    selectedTokenId, 
    marketTokenMap, 
    marketData,
    tradingPairs
  } = usePerpetualMarketStore()

  // Find the token address based on the selected ID
  const selectedPair = tradingPairs.find(pair => pair.id === selectedTokenId);
  // Use the pair's id directly as the token address since they should be the same
  // This fixes the error since MarketPair doesn't have a tokenAddress property
  const selectedTokenAddress = selectedPair ? selectedPair.id : '';

  // Fetch prices data with token filter
  const {
    data: pricesData,
    isLoading: pricesLoading,
    error: pricesError,
  } = useQuery<PricesResponse>({
    queryKey: ["perpetualPrices", selectedTokenAddress],
    queryFn: async () => {
      // Skip if no token address is selected
      if (!selectedTokenAddress) {
        return { prices: { items: [], totalCount: 0, pageInfo: { startCursor: "", hasPreviousPage: false, hasNextPage: false, endCursor: "" } } };
      }
      
      // Using the token address in the GraphQL query
      const query = `
        query pricesQuery {
          prices(where: {token: "${selectedTokenAddress}"}) {
            items {
              blockNumber
              id
              price
              timestamp
              token
            }
            totalCount
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
          }
        }
      `;
      
      return await request(PERPETUAL_GRAPHQL_URL, query);
    },
    refetchInterval: 5000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: !!selectedTokenAddress, // Only run the query if we have a token address
    onSuccess: () => {
      console.log('[RPC-DEBUG] 📊 perpetual-chart.tsx - Chart data refetch completed');
    },
    onError: (error) => {
      console.error('[RPC-DEBUG] 📊 perpetual-chart.tsx - Chart data refetch error:', error);
    },
  })

  // Create and update chart
  useEffect(() => {
    if (!chartContainerRef.current || pricesLoading || !pricesData || !selectedTokenAddress || Object.keys(marketTokenMap).length === 0) return

    // Clean up any existing chart
    try {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    } catch (e) {
      console.error("Error removing chart:", e)
      chartRef.current = null
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

    // Add a candlestick series for the token price
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    })

    // Process and set data
    const candlesticks = processChartData(pricesData.prices.items, selectedTokenAddress, marketTokenMap)

    candlestickSeries.setData(candlesticks)

    // Fit content to show all data points
    chart.timeScale().fitContent()

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
  }, [pricesData, selectedTokenAddress, pricesLoading, theme, height, marketTokenMap])

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

  // Find selected pair name for display
  const pairName = selectedPair ? selectedPair.symbol : '';

  const isLoading = pricesLoading || !marketData.marketsLoaded;
  const error = pricesError;

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
        Error: {error?.message || String(error) || 'Unknown error'}
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full bg-white dark:bg-[#151924] text-gray-900 dark:text-white">
        {/* Chart container only */}
        <div ref={chartContainerRef} className="w-full" style={{ height }} />
      </div>
    </QueryClientProvider>
  )
}

// Helper function to format volume with appropriate suffix (K, M, B)
const formatVolume = (value: number | bigint, decimals: number = 2) => {
  // Convert BigInt to number if needed
  const numValue = typeof value === 'bigint' ? Number(value) : value;
  
  const config = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }
  
  if (numValue >= 1e9) {
    return (numValue / 1e9).toLocaleString('en-US', config) + 'B'
  } else if (numValue >= 1e6) {
    return (numValue / 1e6).toLocaleString('en-US', config) + 'M'
  } else if (numValue >= 1e3) {
    return (numValue / 1e3).toLocaleString('en-US', config) + 'K'
  } else {
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: 6
    })
  }
}

export default PerpetualChartComponent