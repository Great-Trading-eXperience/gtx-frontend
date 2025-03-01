"use client"

import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { tradesQuery } from "@/graphql/gtx/gtx.query"
// import { tradesQuery } from "@/graphql/liquidbook/liquidbook.query" // Updated import
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { type CandlestickData, ColorType, createChart, type IChartApi, ISeriesApi, type Time } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { formatUnits } from "viem"

// Define interfaces for the trades query response
interface TradeItem {
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
  transactionId: string;
  pool: {
    baseCurrency: string;
    coin: string;
    id: string;
    lotSize: string;
    maxOrderAmount: string;
    orderBook: string;
    quoteCurrency: string;
    timestamp: number;
  };
}

// Update the interface to match your actual GraphQL response structure
interface TradesResponse {
  tradess?: {
    items: TradeItem[];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  };
  // Alternative field name - uncomment if your GraphQL response uses this instead
  // trades?: {
  //   items: TradeItem[];
  //   pageInfo: {
  //     endCursor: string;
  //     hasNextPage: boolean;
  //     hasPreviousPage: boolean;
  //     startCursor: string;
  //   };
  //   totalCount: number;
  // };
}

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

function processTradeData(data: TradeItem[], selectedPoolId: string | null): {
  candlesticks: CandlestickData<Time>[]
  volumes: VolumeData[]
} {
  const candlesticks: CandlestickData<Time>[] = []
  const volumes: VolumeData[] = []

  // Filter trades for the selected pool
  const filteredTrades = selectedPoolId 
    ? data.filter(trade => trade.poolId === selectedPoolId)
    : data;
    
  console.log(`Filtering trades for poolId: ${selectedPoolId || 'all'}`);
  console.log(`Filtered ${filteredTrades.length} out of ${data.length} trades`);
  
  if (selectedPoolId) {
    // Debug which pool IDs are actually in the data
    const uniquePoolIds = [...new Set(data.map(trade => trade.poolId))];
    console.log(`Available pool IDs in data: ${uniquePoolIds.join(', ')}`);
  }
  
  if (filteredTrades.length === 0) {
    console.log("No trades found for the selected pool");
    return { candlesticks, volumes };
  }

  // Create 1-minute OHLC candles
  const ohlcMap = new Map<number, {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    count: number;
  }>();

  // Sort trades by timestamp (oldest first)
  const sortedTrades = [...filteredTrades].sort((a, b) => a.timestamp - b.timestamp);

  // Group trades into 1-minute candles
  sortedTrades.forEach(trade => {
    // Convert price from string to number
    const priceValue = Number(formatUnits(BigInt(trade.price), 12)); // Adjust decimals as needed
    const volumeValue = Number(formatUnits(BigInt(trade.quantity), 18)); // Adjust decimals as needed
    
    // Round timestamp to the nearest minute (60 seconds)
    const minuteTimestamp = Math.floor(trade.timestamp / 60) * 60;
    
    if (ohlcMap.has(minuteTimestamp)) {
      const candle = ohlcMap.get(minuteTimestamp)!;
      // Update high/low
      candle.high = Math.max(candle.high, priceValue);
      candle.low = Math.min(candle.low, priceValue);
      // Update close with the latest price
      candle.close = priceValue;
      // Add to volume
      candle.volume += volumeValue;
      candle.count += 1;
    } else {
      // Create new candle
      ohlcMap.set(minuteTimestamp, {
        open: priceValue,
        high: priceValue,
        low: priceValue,
        close: priceValue,
        volume: volumeValue,
        count: 1
      });
    }
  });

  // Convert map to array of candlesticks and volumes
  ohlcMap.forEach((candle, timestamp) => {
    candlesticks.push({
      time: timestamp as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });

    volumes.push({
      time: timestamp as Time,
      value: candle.volume,
      color: candle.close >= candle.open 
        ? "rgba(38, 166, 154, 0.5)" // green for up candles
        : "rgba(239, 83, 80, 0.5)" // red for down candles
    });
  });

  // Sort by timestamp
  candlesticks.sort((a, b) => Number(a.time) - Number(b.time));
  volumes.sort((a, b) => Number(a.time) - Number(b.time));

  return { candlesticks, volumes };
}

interface TradingSpotChartProps {
  height?: number;
  selectedPoolId?: string | null;
}

function TradingSpotChart({ height = 500, selectedPoolId = null }: TradingSpotChartProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const timeDisplayRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState("")
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["trades", selectedPoolId],
    queryFn: async () => {
      console.log(`Fetching trade data for poolId: ${selectedPoolId || 'all'}`);
      
      // Check if we need to pass a parameter to the GraphQL query
      // If your tradesQuery accepts a poolId parameter, you would use:
      // return await request(GTX_GRAPHQL_URL, tradesQuery, { poolId: selectedPoolId })
      
      // For now, we'll just fetch all trades and filter client-side
      const response = await request(GTX_GRAPHQL_URL, tradesQuery);
      
      // Safely handle the response as unknown type
      if (response && typeof response === 'object') {
        // Now TypeScript knows response is an object
        console.log("GraphQL response keys:", Object.keys(response));
        
        // Type assertion for accessing properties
        const typedResponse = response as Record<string, any>;
        
        // Check how many trades we got (handle different response structures)
        const tradesData = typedResponse.tradess || typedResponse.trades || {};
        const itemsCount = tradesData.items?.length || 0;
        console.log(`Fetched ${itemsCount} trades from API`);
      } else {
        console.log("Received non-object response from API");
      }
      
      return response;
    },
    refetchInterval: 5000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // Ensure query reruns when selectedPoolId changes
    refetchOnMount: true,
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

  // Update current price from latest trade
  useEffect(() => {
    if (!data) return;
    
    // Check both possible field names
    const tradesData = data.tradess || (data as any).trades;
    
    if (tradesData?.items && tradesData.items.length > 0) {
      // Filter for selected pool
      const relevantTrades = selectedPoolId
        ? tradesData.items.filter((trade: { poolId: string }) => trade.poolId === selectedPoolId)
        : tradesData.items;

      if (relevantTrades.length > 0) {
        // Find the trade with the latest timestamp
        const latestTrade = [...relevantTrades].sort((a, b) => b.timestamp - a.timestamp)[0];
        const formattedPrice = Number(formatUnits(BigInt(latestTrade.price), 12)).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setCurrentPrice(formattedPrice);
      }
    }
  }, [data, selectedPoolId]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
    
    candlestickSeriesRef.current = candlestickSeries

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    })
    
    volumeSeriesRef.current = volumeSeries

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
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [theme, height]) // Only re-initialize on theme or height change

  // Update data when trades data or selected pool changes
  useEffect(() => {
    // First check if the data object is available
    if (!data) {
      console.log("No data returned from query");
      return;
    }
    
    // Determine which field contains the trades data
    const tradesData = data.tradess || (data as any).trades;
    
    if (!tradesData?.items || !chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) {
      console.log("Missing required refs or data:", {
        hasTradesData: !!tradesData?.items,
        hasChart: !!chartRef.current,
        hasCandlestickSeries: !!candlestickSeriesRef.current,
        hasVolumeSeries: !!volumeSeriesRef.current
      });
      return;
    }
    
    console.log(`Updating chart for poolId: ${selectedPoolId || 'all'}`);
    console.log(`Total trades before filtering: ${tradesData.items.length}`);
    
    // Make sure we're processing the correct data for the selected pool
    const { candlesticks, volumes } = processTradeData(tradesData.items, selectedPoolId);
    
    console.log(`Generated ${candlesticks.length} candlesticks and ${volumes.length} volume bars`);
    
    // Always update the chart data, even if empty
    candlestickSeriesRef.current.setData(candlesticks);
    volumeSeriesRef.current.setData(volumes);
    
    if (candlesticks.length > 0) {
      // Fit content if we have data
      chartRef.current.timeScale().fitContent();
      console.log("Chart updated with data and fitted to content");
    } else {
      console.log("No data available for selected pool, chart cleared");
    }
  }, [data, selectedPoolId]);

  // Update theme
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
      <div className="w-full bg-white dark:bg-[#151924] text-gray-900 dark:text-white">        
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

export default TradingSpotChart