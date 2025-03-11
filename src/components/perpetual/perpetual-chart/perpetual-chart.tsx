"use client"

import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { pricesQuery } from "@/graphql/gtx/perpetual.query"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { type LineData, ColorType, createChart, type IChartApi, type Time } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { formatUnits } from "viem"

// Define interfaces for the price data response
interface PriceItem {
  id: string;
  token: string;
  price: string;
  timestamp: number;
  blockNumber: number;
}

interface PricesResponse {
  prices?: {
    items: PriceItem[];
    totalCount: number;
    pageInfo: {
      startCursor: string;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      endCursor: string;
    }
  };
}

const formatPrice = (price: string): string => {
  return Number(formatUnits(BigInt(price), 18)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function processLineData(data: PriceItem[]): LineData[] {
  const lineData: LineData[] = [];

  data.forEach(item => {
    // Convert pricing data from raw to formatted values with proper decimal places
    const price = Number(formatUnits(BigInt(item.price), 18));

    // Create line data point
    lineData.push({
      time: item.timestamp as Time,
      value: price
    });
  });

  // Sort by timestamp to ensure correct order
  return lineData.sort((a, b) => Number(a.time) - Number(b.time));
}

interface PerpetualChartComponentProps {
  height?: number;
  token?: string;
}

function PerpetualChartComponent({ height = 530, token = "all" }: PerpetualChartComponentProps) {
  const [queryClient] = useState(() => new QueryClient())
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const timeDisplayRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState("")
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<PricesResponse>({
    queryKey: ["perpetualPrices", token],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, pricesQuery)
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

  // Update current price from latest data point
  useEffect(() => {
    if (!data) return;
    
    const items = data.prices?.items;
    
    if (items && items.length > 0) {
      // Find the price item with the latest timestamp
      const latestItem = [...items].sort((a, b) => b.timestamp - a.timestamp)[0];
      setCurrentPrice(formatPrice(latestItem.price));
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
          bottom: 0.1,
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

    const lineSeries = chart.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#2962FF',
      priceLineStyle: 2,
    })

    // Get the price data items
    const items = data.prices?.items;
    
    if (items) {
      // Filter items if token is specified
      const filteredItems = token !== "all" 
        ? items.filter(item => item.token.toLowerCase() === token.toLowerCase())
        : items;
      
      const lineData = processLineData(filteredItems);
      lineSeries.setData(lineData);

      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      chart.applyOptions({
        height: mainHeight,
        width: chartContainerRef.current?.clientWidth || 800,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      } catch (e) {
        console.error("Error cleaning up chart:", e);
        chartRef.current = null;
      }
    };
  }, [data, isLoading, theme, height, token]);

  // Apply theme changes to existing chart
  useEffect(() => {
    if (chartRef.current) {
      const isDarkMode = theme === "dark";
      chartRef.current.applyOptions({
        layout: {
          textColor: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
          background: { type: ColorType.Solid, color: isDarkMode ? "#151924" : "#ffffff" },
        },
        grid: {
          vertLines: { color: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
          horzLines: { color: isDarkMode ? "rgba(42, 46, 57, 0.6)" : "rgba(42, 46, 57, 0.2)" },
        },
      });
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] rounded-b-lg text-gray-900 dark:text-white flex items-center justify-center">
        Loading...
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
        {/* <div className="flex justify-between items-center px-4 py-2">
          <div className="font-medium">Perpetual Price Chart</div>
          {currentPrice && (
            <div className="text-lg font-bold">
              ${currentPrice}
            </div>
          )}
        </div> */}
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
  );
}

export default PerpetualChartComponent;