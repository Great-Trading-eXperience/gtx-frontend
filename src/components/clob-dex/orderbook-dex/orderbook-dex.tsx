"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowDownUp, ChevronDown, Menu, RefreshCw } from "lucide-react"
import { formatUnits } from "viem"
import { Side } from "@/types/web3/gtx/gtx"
import { useGetBestPrice } from "@/hooks/web3/gtx/clob-dex/orderbook/useGetBestPrice"
import { useGetNextBestPrices } from "@/hooks/web3/gtx/clob-dex/orderbook/useGetNextBestPrices"
import { useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { readContract } from "@wagmi/core"
import { wagmiConfig } from "@/configs/wagmi"
import OrderBookABI from "@/abis/gtx/clob-dex/OrderBookABI"
import { poolsQuery } from "@/graphql/gtx/gtx.query"
import { useMarketStore, Pool } from "@/store/market-store"

interface PoolsResponse {
  poolss: {
    items: Pool[]
    totalCount: number
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
  }
}

interface Order {
  price: number
  size: number
  total?: number
}

interface OrderBook {
  asks: Order[]
  bids: Order[]
  lastPrice: bigint
  spread: bigint
  lastUpdate?: number
}

type ViewType = "both" | "bids" | "asks"
type DecimalPrecision = "0.01" | "0.1" | "1"

const STANDARD_ORDER_COUNT = 8

const EnhancedOrderBookDex = () => {
  const [mounted, setMounted] = useState(false)
  const [selectedDecimal, setSelectedDecimal] = useState<DecimalPrecision>("0.01")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false)
  const priceOptions = ["0.01", "0.1", "1"]
  
  // Use the Zustand store instead of local state for selected pool
  const { selectedPool } = useMarketStore()

  const [orderBook, setOrderBook] = useState<OrderBook>({
    asks: [],
    bids: [],
    lastPrice: BigInt(0),
    spread: BigInt(0),
    lastUpdate: Date.now(),
  })

  const [viewType, setViewType] = useState<ViewType>("both")

  // Fetch pools data - keep this as a fallback
  const {
    data: poolsData,
    isLoading: isLoadingPools,
    error: poolsError,
  } = useQuery<PoolsResponse>({
    queryKey: ["pools"],
    queryFn: async () => {
      const response = await request<PoolsResponse>(GTX_GRAPHQL_URL, poolsQuery)
      return response
    },
    staleTime: 60000, // 1 minute
  })

  // Use the custom hooks
  const { getBestPrice: getDefaultBestPrice, isLoading: isLoadingBestPrice, error: bestPriceError } = useGetBestPrice()
  const {
    getNextBestPrices: getDefaultNextBestPrices,
    isLoading: isLoadingNextPrices,
    error: nextPricesError,
  } = useGetNextBestPrices()

  // Custom functions to handle dynamic orderbook addresses
  const getBestPrice = async ({ side }: { side: Side }) => {
    if (!selectedPool) {
      throw new Error("No pool selected")
    }

    try {
      return await readContract(wagmiConfig, {
        address: selectedPool.orderBook as `0x${string}`,
        abi: OrderBookABI,
        functionName: "getBestPrice",
        args: [side] as const,
      })
    } catch (error) {
      console.error("Error getting best price:", error)
      throw error
    }
  }

  const getNextBestPrices = async ({
    side,
    price,
    count,
  }: {
    side: Side
    price: bigint
    count: number
  }) => {
    if (!selectedPool) {
      throw new Error("No pool selected")
    }

    try {
      const prices = await readContract(wagmiConfig, {
        address: selectedPool.orderBook as `0x${string}`,
        abi: OrderBookABI,
        functionName: "getNextBestPrices",
        args: [side, price, count] as const,
      })

      return [...prices] as Array<{ price: bigint; volume: bigint }>
    } catch (error) {
      console.error("Error getting next best prices:", error)
      throw error
    }
  }

  const formatPrice = (price: number | bigint): string => {
    const precision = Number.parseFloat(selectedDecimal)
    const priceNumber = typeof price === "bigint" ? Number(price) : price
    const roundedPrice = Math.round(priceNumber / precision) * precision

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(roundedPrice)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !selectedPool) return

    const fetchOrderBook = async () => {
      try {
        const askBestPrice = await getBestPrice({
          side: Side.Sell,
        })

        const bidBestPrice = await getBestPrice({
          side: Side.Buy,
        })

        const nextAsks = await getNextBestPrices({
          side: Side.Sell,
          price: askBestPrice.price,
          count: STANDARD_ORDER_COUNT - 1,
        })

        const nextBids = await getNextBestPrices({
          side: Side.Buy,
          price: bidBestPrice.price,
          count: STANDARD_ORDER_COUNT - 1,
        })

        const asks = [
          {
            price: Number(formatUnits(askBestPrice.price, 6)),
            size: Number(formatUnits(askBestPrice.volume, 18)),
          },
          ...nextAsks.map((pv) => ({
            price: Number(formatUnits(pv.price, 6)),
            size: Number(formatUnits(pv.volume, 18)),
          })),
        ].sort((a, b) => a.price - b.price)

        const bids = [
          {
            price: Number(formatUnits(bidBestPrice.price, 6)),
            size: Number(formatUnits(bidBestPrice.volume, 18)),
          },
          ...nextBids.map((pv) => ({
            price: Number(formatUnits(pv.price, 6)),
            size: Number(formatUnits(pv.volume, 18)),
          })),
        ].sort((a, b) => b.price - a.price)

        let bidTotal = 0
        const bidsWithTotal = bids.map((bid) => {
          bidTotal += bid.size
          return { ...bid, total: bidTotal }
        })

        let askTotal = 0
        const asksWithTotal = asks.map((ask) => {
          askTotal += ask.size
          return { ...ask, total: askTotal }
        })

        const spread = Number((asks[0]?.price - bids[0]?.price).toFixed(2))

        setOrderBook({
          asks: asksWithTotal,
          bids: bidsWithTotal,
          lastPrice: BigInt(Math.round(asks[0]?.price * 10 ** 8)),
          spread: BigInt(Math.round(spread * 10 ** 8)),
          lastUpdate: Date.now(),
        })
      } catch (error) {
        console.error("Error fetching order book:", error)
      }
    }

    const interval = setInterval(fetchOrderBook, 1000)
    fetchOrderBook()

    return () => clearInterval(interval)
  }, [mounted, selectedPool, getBestPrice, getNextBestPrices])

  const toggleView = useCallback(() => {
    const views: ViewType[] = ["both", "bids", "asks"]
    const currentIndex = views.indexOf(viewType)
    setViewType(views[(currentIndex + 1) % views.length])
  }, [viewType])

  const isLoading = isLoadingBestPrice || isLoadingNextPrices || isLoadingPools

  if (bestPriceError || nextPricesError || poolsError) {
    return (
      <div className="w-full rounded-xl bg-gray-950 p-4 text-white border border-gray-800/30">
        <p className="text-rose-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Error loading data
        </p>
        <p className="mt-2 text-sm text-gray-300">
          {bestPriceError?.message ||
            nextPricesError?.message ||
            (poolsError instanceof Error ? poolsError.message : "Unknown error")}
        </p>
      </div>
    )
  }

  // Get base token from selected pool
  const baseToken = selectedPool?.coin?.split("/")[0] || "WETH"

  return (
    <div className="w-full overflow-hidden rounded-b-xl bg-gradient-to-b from-gray-950 to-gray-900 text-white shadow-lg">

      <div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleView}
            className="rounded-lg bg-gray-900/40 p-1.5 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-gray-300"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-300">
            {viewType === "both" ? "Order Book" : viewType === "asks" ? "Asks Only" : "Bids Only"}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded border border-gray-700/50 bg-gray-900/40 px-3 py-1.5 text-gray-200 transition-all duration-200 hover:bg-gray-800/50"
          >
            <span className="text-xs">Precision: {selectedDecimal}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-gray-700/50 bg-gray-900 shadow-lg">
              {priceOptions.map((option) => (
                <button
                  key={option}
                  className="w-full px-4 py-2 text-left text-xs text-gray-200 transition-colors duration-200 hover:bg-gray-800 hover:text-white"
                  onClick={() => {
                    setSelectedDecimal(option as DecimalPrecision)
                    setIsDropdownOpen(false)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="py-2">
        {/* Loading state */}
        {isLoading || !selectedPool || (orderBook.asks.length === 0 && orderBook.bids.length === 0) ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {(viewType === "both" || viewType === "asks") && (
              <div>
                {/* Column Headers for Asks */}
                <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                  <div>Price ({baseToken})</div>
                  <div className="text-center">Size ({baseToken})</div>
                  <div className="text-right">Total</div>
                </div>

                <div className="flex flex-col-reverse space-y-[2px] space-y-reverse">
                  {orderBook.asks.map((ask, i) => {
                    const maxTotal = orderBook.asks.reduce(
                      (max, curr) =>
                        curr.total && max ? (curr.total > max ? curr.total : max) : curr.total || max || 1,
                      0,
                    )

                    return (
                      <div key={`ask-${i}`} className="group relative">
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-rose-500/10 transition-all group-hover:bg-rose-500/20"
                          style={{
                            width: `${((ask.total || 0) * 100) / maxTotal}%`,
                          }}
                        />
                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                          <div className="font-medium text-rose-400">{formatPrice(ask.price)}</div>
                          <div className="text-center text-gray-200">{ask.size.toFixed(6)}</div>
                          <div className="text-right text-gray-200">{(ask.total || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {viewType === "both" && (
              <div className="my-2 border-y border-gray-800/30 bg-gray-900/40 px-4 py-2 text-xs">
                <div className="flex justify-between text-gray-200">
                  <span>Spread</span>
                  <span className="font-medium text-white">
                    {Number(orderBook.spread) / 10 ** 8} ({baseToken})
                  </span>
                </div>
              </div>
            )}

            {(viewType === "both" || viewType === "bids") && (
              <div>
                {/* Column Headers for Bids */}
                <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                  <div>Price (USDC)</div>
                  <div className="text-center">Size (USDC)</div>
                  <div className="text-right">Total</div>
                </div>

                <div className="space-y-[2px]">
                  {orderBook.bids.map((bid, i) => {
                    const maxTotal = orderBook.bids.reduce(
                      (max, curr) =>
                        curr.total && max ? (curr.total > max ? curr.total : max) : curr.total || max || 1,
                      0,
                    )

                    return (
                      <div key={`bid-${i}`} className="group relative">
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-emerald-500/10 transition-all group-hover:bg-emerald-500/20"
                          style={{
                            width: `${((bid.total || 0) * 100) / maxTotal}%`,
                          }}
                        />
                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                          <div className="font-medium text-emerald-400">{formatPrice(bid.price)}</div>
                          <div className="text-center text-gray-200">{bid.size.toFixed(6)}</div>
                          <div className="text-right text-gray-200">{(bid.total || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default EnhancedOrderBookDex