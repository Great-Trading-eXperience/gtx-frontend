"use client"

import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI"
import OrderBookABI from "@/abis/gtx/clob/OrderBookABI"
import { wagmiConfig } from "@/configs/wagmi"
import { ContractName, getContractAddress } from "@/constants/contract/contract-address"
import { PoolItem, PoolsResponse } from "@/graphql/gtx/clob"
import { useMarketStore } from "@/store/market-store"
import { readContract } from "@wagmi/core"
import { ArrowDown, ArrowUp, Menu, RefreshCw } from "lucide-react"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { formatUnits } from "viem"
import { OrderSideEnum } from "../../../../lib/enums/clob.enum"
import { ClobDexComponentProps } from "../clob-dex"

interface Order {
  price: number
  size: number
  total?: number
  key?: string
  isMatched?: boolean
  lastUpdated?: number
}

interface OrderBook {
  asks: Order[]
  bids: Order[]
  lastPrice: bigint
  spread: bigint
  lastUpdate?: number
  previousAsks?: Order[]
  previousBids?: Order[]
}

type ViewType = "both" | "bids" | "asks"
type DecimalPrecision = "0.01" | "0.1" | "1"

const STANDARD_ORDER_COUNT = 6
const PRICE_MATCH_THRESHOLD = 0.07 
const TOTAL_MATCH_THRESHOLD = 4

export type OrderBookDexProps = ClobDexComponentProps & {
  selectedPool: PoolItem
  poolsData?: PoolsResponse;
  poolsLoading?: boolean;
  poolsError?: Error | null;
}

interface EnhancedOrderBookDexProps {
    selectedPool: PoolItem
    chainId: number | undefined
    defaultChainId: number
    poolsLoading: boolean
    poolsError: Error | null
}

const EnhancedOrderBookDex = ({ chainId, defaultChainId, selectedPool, poolsLoading, poolsError }: EnhancedOrderBookDexProps) => {
  const [mounted, setMounted] = useState(false)
  const [selectedDecimal, setSelectedDecimal] = useState<DecimalPrecision>("0.01")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const priceOptions = ["0.01", "0.1", "1"]
  const previousOrderBook = useRef<OrderBook | null>(null)
  const previousPrice = useRef<number | null>(null)
  const priceDirection = useRef<'up' | 'down' | null>(null)

  // Get the current URL to detect changes
  const pathname = usePathname()

  const [orderBook, setOrderBook] = useState<OrderBook>({
    asks: [],
    bids: [],
    lastPrice: BigInt(0),
    spread: BigInt(0),
    lastUpdate: Date.now(),
  })

  const [viewType, setViewType] = useState<ViewType>("both")
  const { marketData, quoteDecimals, baseDecimals } = useMarketStore()

  // Custom functions to handle dynamic orderbook addresses
  const getBestPrice = async ({ side }: { side: OrderSideEnum }) => {
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
    baseCurrency,
    quoteCurrency,
    side,
    price,
    count,
  }: {
    baseCurrency: string
    quoteCurrency: string
    side: OrderSideEnum
    price: bigint
    count: number
  }) => {
    if (!selectedPool) {
      throw new Error("No pool selected")
    }

    try {
      const prices = await readContract(wagmiConfig, {
        address: getContractAddress(chainId ?? defaultChainId, ContractName.clobRouter) as `0x${string}`,
        abi: GTXRouterABI,
        functionName: "getNextBestPrices",
        args: [{
          orderBook: selectedPool.orderBook as `0x${string}`,
          baseCurrency: selectedPool.baseCurrency as `0x${string}`,
          quoteCurrency: selectedPool.quoteCurrency as `0x${string}`,
        }, side, price, count] as const,
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

  // Reset orderbook when selectedPool changes
  useEffect(() => {
    if (selectedPool) {
      setOrderBook({
        asks: [],
        bids: [],
        lastPrice: BigInt(0),
        spread: BigInt(0),
        lastUpdate: Date.now(),
      })
      previousOrderBook.current = null
      previousPrice.current = null
      priceDirection.current = null
    }
  }, [selectedPool])

  // Helper function to detect if an order should be highlighted (matched)
  const detectMatchedOrders = (
    newOrders: Order[],
    previousOrders: Order[] | undefined,
    now: number
  ): Order[] => {
    if (!previousOrders || previousOrders.length === 0) {
      return newOrders.map(order => ({
        ...order,
        key: `${order.price}-${now}`,
        isMatched: false,
        lastUpdated: now
      }));
    }

    return newOrders.map(newOrder => {
      // Check if this is a new price level that didn't exist before
      const existingOrderAtSamePrice = previousOrders.find(
        prevOrder => Math.abs(prevOrder.price - newOrder.price) < PRICE_MATCH_THRESHOLD
      );

      // Check if there's a size change at this price level
      const isMatched = existingOrderAtSamePrice
        ? Math.abs((existingOrderAtSamePrice.total || 0) - (newOrder.total || 0)) / (existingOrderAtSamePrice.total || 1) > TOTAL_MATCH_THRESHOLD / 100
        : false;

      return {
        ...newOrder,
        key: isMatched ? `${newOrder.price}-${now}` : existingOrderAtSamePrice?.key || `${newOrder.price}-${now}`,
        isMatched,
        lastUpdated: isMatched ? now : existingOrderAtSamePrice?.lastUpdated || now
      };
    });
  };

  // Update price direction whenever the price changes
  useEffect(() => {
    if (marketData?.price) {
      // Compare with previous price and set direction
      if (previousPrice.current !== null) {
        if (marketData.price < previousPrice.current) {
          priceDirection.current = 'down';
        } else if (marketData.price > previousPrice.current) {
          priceDirection.current = 'up';
        }
        // If equal, maintain the previous direction
      }
      
      // Store the current price for the next comparison
      previousPrice.current = marketData.price;
    }
  }, [marketData?.price]);

  useEffect(() => {
    if (!mounted || !selectedPool) return

    const fetchOrderBook = async () => {
      try {
        const askBestPrice = await getBestPrice({
          side: OrderSideEnum.SELL,
        })

        const bidBestPrice = await getBestPrice({
          side: OrderSideEnum.BUY,
        })

        const nextAsks = await getNextBestPrices({
          baseCurrency: selectedPool.baseCurrency as `0x${string}`,
          quoteCurrency: selectedPool.quoteCurrency as `0x${string}`,
          side: OrderSideEnum.SELL,
          price: askBestPrice.price,
          count: STANDARD_ORDER_COUNT - 1,
        })

        const nextBids = await getNextBestPrices({
          baseCurrency: selectedPool.baseCurrency as `0x${string}`,
          quoteCurrency: selectedPool.quoteCurrency as `0x${string}`,
          side: OrderSideEnum.BUY,
          price: bidBestPrice.price,
          count: STANDARD_ORDER_COUNT - 1,
        })

        const sortedNextAsks = nextAsks.sort((a, b) => Number(a.price) - Number(b.price))
        const sortedNextBids = nextBids.sort((a, b) => Number(b.price) - Number(a.price))

        const asks = [
          {
            price: Number(formatUnits(askBestPrice.price, quoteDecimals)),
            size: Number(formatUnits(askBestPrice.volume, baseDecimals)),
          },
          ...sortedNextAsks.map((pv) => ({
            price: Number(formatUnits(pv.price, quoteDecimals)),
            size: Number(formatUnits(pv.volume, baseDecimals)),
          })),
        ]
          .filter(ask => ask.price > 0 && ask.size > 0)
          .reduce((unique, ask) => {
            const exists = unique.find(u => u.price === ask.price);
            if (!exists) {
              unique.push(ask);
            }
            return unique;
          }, [] as Order[])
          .sort((a, b) => a.price - b.price)

        const bids = [
          {
            price: Number(formatUnits(bidBestPrice.price, quoteDecimals)),
            size: Number(formatUnits(bidBestPrice.volume, baseDecimals)),
          },
          ...sortedNextBids.map((pv) => ({
            price: Number(formatUnits(pv.price, quoteDecimals)),
            size: Number(formatUnits(pv.volume, baseDecimals)),
          })),
        ].filter(ask => ask.price > 0 && ask.size > 0)
          .reduce((unique, ask) => {
            const exists = unique.find(u => u.price === ask.price);
            if (!exists) {
              unique.push(ask);
            }
            return unique;
          }, [] as Order[]).sort((a, b) => b.price - a.price)

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

        const spread = asks[0]?.price && bids[0]?.price 
          ? ((Math.abs(asks[0].price - bids[0].price) / ((asks[0].price + bids[0].price) / 2)) * 100).toFixed(2)
          : "0"
        const now = Date.now()

        // Detect matched orders based on previous state
        const matchedAsks = detectMatchedOrders(asksWithTotal, previousOrderBook.current?.asks, now);
        const matchedBids = detectMatchedOrders(bidsWithTotal, previousOrderBook.current?.bids, now);

        const newOrderBook = {
          asks: matchedAsks,
          bids: matchedBids,
          lastPrice: asks.length > 0 ? BigInt(Math.round(asks[0]?.price)) : BigInt(0),
          spread: BigInt(Math.round(Number(spread))),
          lastUpdate: now,
          previousAsks: previousOrderBook.current?.asks,
          previousBids: previousOrderBook.current?.bids
        };

        previousOrderBook.current = {
          asks: matchedAsks,
          bids: matchedBids,
          lastPrice: newOrderBook.lastPrice,
          spread: newOrderBook.spread,
          lastUpdate: now
        };

        setOrderBook(newOrderBook);
      } catch (error) {
        console.error("Error fetching order book:", error)
      }
    }

    const interval = setInterval(fetchOrderBook, 1000)

    return () => clearInterval(interval)
  }, [mounted, selectedPool, quoteDecimals, baseDecimals, getBestPrice, getNextBestPrices])

  const toggleView = useCallback(() => {
    const views: ViewType[] = ["both", "bids", "asks"]
    const currentIndex = views.indexOf(viewType)
    setViewType(views[(currentIndex + 1) % views.length])
  }, [viewType])

  const isLoading = poolsLoading

  if (poolsError) {
    return (
      <div className="w-full rounded-xl bg-gray-950 p-4 text-white border border-gray-800/30">
        <p className="text-rose-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Error loading data
        </p>
        <p className="mt-2 text-sm text-gray-300">
          {poolsError instanceof Error ? poolsError.message : "Unknown error"}
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
            className="rounded-lg bg-gray-700/40 py-1.5 px-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-gray-300 border border-gray-700/50"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-300">
            {viewType === "both" ? "Bid/Ask" : viewType === "asks" ? "Asks Only" : "Bids Only"}
          </span>
        </div>

        <div className="relative">
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
        {isLoading || !selectedPool ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {(viewType === "both" || viewType === "asks") && (
              <div>
                {/* Column Headers for Asks */}
                <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                  <div>Price</div>
                  <div className="text-center">Size</div>
                  <div className="text-right">Total</div>
                </div>

                <div className="flex flex-col-reverse space-y-[2px] space-y-reverse">
                  {orderBook.asks.slice(0, 10).map((ask, i) => {
                    const maxTotal = orderBook.asks.reduce(
                      (max, curr) =>
                        curr.total && max ? (curr.total > max ? curr.total : max) : curr.total || max || 1,
                      0,
                    )

                    // Determine if this order should be blinking
                    const isBlinking = ask.isMatched;

                    return (
                      <div key={ask.key || `ask-${i}`} className={`group relative ${isBlinking ? 'animate-blink-bg' : ''}`}>
                        {/* Volume bar - not animated */}
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-rose-500/10 transition-all group-hover:bg-rose-500/20"
                          style={{
                            width: `${((ask.total || 0) * 100) / maxTotal}%`,
                          }}
                        />

                        {/* Full-width blinking overlay when matched */}
                        {isBlinking && (
                          <div className="absolute inset-0 animate-blink-highlight-ask"></div>
                        )}

                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                          <div className={`font-medium text-rose-400 ${isBlinking ? 'animate-blink-text' : ''}`}>
                            {formatPrice(ask.price)}
                          </div>
                          <div className={`text-center text-gray-200 ${isBlinking ? 'animate-blink-text' : ''}`}>
                            {ask.size.toFixed(2)}
                          </div>
                          <div className={`text-right text-gray-200 ${isBlinking ? 'animate-blink-text' : ''}`}>
                            {(ask.total || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {viewType === "both" && (
              <div className="my-2 border-y border-gray-800/30 bg-gray-900/40 px-4 py-2 text-xs">
                {/* Single row with price (with arrow) and spread */}
                <div className="flex justify-between text-gray-200">
                  <div className="flex items-center gap-4">
                    {/* Price with arrow */}
                    <div className="flex items-center">
                      {marketData?.price && (
                        <span className={`font-medium flex items-center ${
                          priceDirection.current === 'down' 
                            ? "text-rose-400" 
                            : "text-emerald-400"
                        }`}>
                          {formatPrice(Number(formatUnits(BigInt(marketData.price), quoteDecimals)))}
                          {priceDirection.current && (
                            priceDirection.current === 'up' 
                              ? <ArrowUp className="h-3 w-3 ml-1" /> 
                              : <ArrowDown className="h-3 w-3 ml-1" />
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Spread */}
                    <div className="flex items-center gap-1">
                      <span>Spread: </span>
                      <span className="font-medium text-white">
                        {(Number(orderBook.spread) / 100)}% 
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(viewType === "both" || viewType === "bids") && (
              <div>
                {/* Column Headers for Bids */}
                <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                  <div>Price</div>
                  <div className="text-center">Size</div>
                  <div className="text-right">Total</div>
                </div>

                <div className="space-y-[2px]">
                  {orderBook.bids.slice(0, 10).map((bid, i) => {
                    const maxTotal = orderBook.bids.reduce(
                      (max, curr) =>
                        curr.total && max ? (curr.total > max ? curr.total : max) : curr.total || max || 1,
                      0,
                    )

                    // Determine if this order should be blinking
                    const isBlinking = bid.isMatched;

                    return (
                      <div key={bid.key || `bid-${i}`} className={`group relative ${isBlinking ? 'animate-blink-bg' : ''}`}>
                        {/* Volume bar - not animated */}
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-emerald-500/10 transition-all group-hover:bg-emerald-500/20"
                          style={{
                            width: `${((bid.total || 0) * 100) / maxTotal}%`,
                          }}
                        />

                        {/* Full-width blinking overlay when matched */}
                        {isBlinking && (
                          <div className="absolute inset-0 animate-blink-highlight-bid"></div>
                        )}

                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                          <div className={`font-medium text-emerald-400 ${isBlinking ? 'animate-blink-text' : ''}`}>
                            {formatPrice(bid.price)}
                          </div>
                          <div className={`text-center text-gray-200 ${isBlinking ? 'animate-blink-text' : ''}`}>
                            {bid.size.toFixed(2)}
                          </div>
                          <div className={`text-right text-gray-200 ${isBlinking ? 'animate-blink-text' : ''}`}>
                            {(bid.total || 0).toFixed(2)}
                          </div>
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

      {/* Add CSS for the blinking animations with much slower animations */}
      <style jsx global>{`
        @keyframes blink-bg {
          0% { background-color: transparent; }
          100% { background-color: rgba(255, 255, 255, 0.1); }
        }
        
        @keyframes blink-highlight-bid {
          0% { background-color: rgba(16, 185, 129, 0.3); }
          100% { background-color: rgba(16, 185, 129, 1); }
        }
        
        @keyframes blink-highlight-ask {
          0% { background-color: rgba(239, 68, 68, 0.3); }
          100% { background-color: rgba(239, 68, 68, 1); }
        }
        
        @keyframes blink-text {
          0% { opacity: 1; }
          20% { opacity: 0.9; font-weight: bold; }
          40% { opacity: 1; }
          60% { opacity: 0.95; font-weight: bold; }
          80% { opacity: 1; }
          100% { opacity: 1; }
        }
        
        .animate-blink-bg {
          animation: blink-bg 10s linear;
        }
        
        .animate-blink-highlight-bid {
          animation: blink-highlight-bid 10s linear;
        }
        
        .animate-blink-highlight-ask {
          animation: blink-highlight-ask 10s linear;
        }
        
        .animate-blink-text {
          animation: blink-text 10s linear;
        }
      `}</style>
    </div>
  )
}

export default EnhancedOrderBookDex