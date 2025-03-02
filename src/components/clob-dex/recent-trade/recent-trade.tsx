"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { request } from "graphql-request"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { formatUnits } from "viem"
import { tradesQuery } from "@/graphql/gtx/gtx.query"
import { ArrowDown, ArrowUp, BarChart2, Clock, RefreshCw } from "lucide-react"

// Define interface for the trades response based on the example data
interface TradeItem {
  id: string
  orderId: string
  poolId: string
  price: string
  quantity: string
  timestamp: number
  transactionId: string
  pool: {
    baseCurrency: string
    coin: string
    id: string
    lotSize: string
    maxOrderAmount: string
    orderBook: string
    quoteCurrency: string
    timestamp: number
  }
}

interface TradesResponse {
  tradess: {
    items: TradeItem[]
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
    totalCount: number
  }
}

interface Trade {
  price: number
  time: string
  size: number
  side: "Buy" | "Sell" // We'll use heuristics to determine side
  total?: number
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString("en-US", { hour12: false })
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

const RecentTradesComponent = () => {
  const [mounted, setMounted] = useState(false)

  // Query for trade events
  const { data, isLoading, error } = useQuery<TradesResponse>({
    queryKey: ["trades"],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL, tradesQuery)
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const processTrades = (items: TradeItem[]): Trade[] => {
    // Sort trades by timestamp (newest first)
    const sortedTrades = [...items].sort((a, b) => b.timestamp - a.timestamp)

    // Process each trade
    return sortedTrades.slice(0, 25).map((trade, index, array) => {
      // Convert price from string to number (assuming price is in wei)
      const priceNum = Number(formatUnits(BigInt(trade.price), 12)) // Adjust decimal places as needed

      // Determine the side of the trade using a simple heuristic:
      // If the price is higher than the previous trade, it's a buy, otherwise it's a sell
      // For the first trade, we'll default to 'Buy'
      let side: "Buy" | "Sell" = "Buy"
      if (index > 0) {
        const prevPrice = Number(formatUnits(BigInt(array[index - 1].price), 12))
        side = priceNum >= prevPrice ? "Buy" : "Sell"
      }

      return {
        price: priceNum,
        size: Number(formatUnits(BigInt(trade.quantity), 18)), // Assuming quantity is in wei (18 decimals)
        side: side,
        time: formatTime(trade.timestamp),
      }
    })
  }

  const calculateTotal = (trades: Trade[]): Trade[] => {
    let runningTotal = 0
    return trades.map((trade) => {
      runningTotal += trade.size
      return { ...trade, total: runningTotal }
    })
  }

  if (!mounted || isLoading) {
    return <RecentTradesSkeleton />
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-gray-800/30 bg-gray-950 p-4 text-white">
        <div className="flex items-center gap-2 text-rose-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <span>Error loading trades</span>
        </div>
        <p className="mt-2 text-sm text-gray-300">{error.toString()}</p>
      </div>
    )
  }

  const trades = calculateTotal(processTrades(data?.tradess.items || []))

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-white">Recent Trades</h2>
        </div>
      </div>

      <div className="flex h-[550px] flex-col rounded-lg">
        {/* Column Headers */}
        <div className="sticky top-0 z-10 border-b border-gray-800/30 bg-gray-900/40 px-4 py-2">
          <div className="grid grid-cols-3 items-center text-xs font-medium text-gray-300">
            <div className="flex items-center gap-1">Price</div>
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Time</span>
            </div>
            <div className="text-right">Size</div>
          </div>
        </div>

        {/* Trades List */}
        <div className="flex-1 px-0 py-2 overflow-auto [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-900">
          <div className="space-y-[2px]">
            {trades.map((trade, i) => {
              const maxTotal = Math.max(...trades.map((t) => t.total || 0))
              const percentageWidth = ((trade.total || 0) * 100) / maxTotal

              return (
                <div key={i} className="group relative">
                  {/* Background bar */}
                  <div
                    className={`absolute bottom-0 left-0 top-0 transition-all ${
                      trade.side === "Buy"
                        ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                        : "bg-rose-500/10 group-hover:bg-rose-500/20"
                    }`}
                    style={{
                      width: `${percentageWidth}%`,
                    }}
                  />

                  {/* Trade data */}
                  <div className="relative grid grid-cols-3 px-4 py-1.5 text-xs">
                    <div className="flex items-center gap-1">
                      {trade.side === "Buy" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span className={`font-medium ${trade.side === "Buy" ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPrice(trade.price)}
                      </span>
                    </div>
                    <div className="text-center font-medium text-gray-200">{trade.time}</div>
                    <div className="text-right font-medium text-gray-200">{formatPrice(trade.size)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const RecentTradesSkeleton = () => {
  return (
    <div className="w-full rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded-md bg-gray-800/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-800/50" />
        </div>
        <div className="h-7 w-7 animate-pulse rounded-full bg-gray-800/50" />
      </div>

      <div className="p-4">
        {/* Column Headers */}
        <div className="mb-4 grid grid-cols-3">
          <div className="h-3 w-12 animate-pulse rounded bg-gray-800/30" />
          <div className="mx-auto h-3 w-12 animate-pulse rounded bg-gray-800/30" />
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-gray-800/30" />
        </div>

        {/* Skeleton Rows */}
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-800/20" />
              <div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-800/20" />
              <div className="ml-auto h-3 w-14 animate-pulse rounded bg-gray-800/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecentTradesComponent

