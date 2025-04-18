"use client"

import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { BALANCE_MANAGER_ADDRESS } from "@/constants/contract-address"
import { PoolsResponse, TradesResponse } from "@/graphql/gtx/clob"
import { useTradingBalances } from "@/hooks/web3/gtx/clob-dex/balance-manager/useTradingBalances"
import { usePlaceOrder } from "@/hooks/web3/gtx/clob-dex/gtx-router/usePlaceOrder"
import { useOrderBook } from "@/hooks/web3/gtx/clob-dex/orderbook/useOrderBook"
import { Pool, useMarketStore } from "@/store/market-store"
import type { HexAddress } from "@/types/general/address"
import { RefreshCw, Wallet } from "lucide-react"
import { usePathname } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { formatUnits, parseUnits } from "viem"
import { useAccount } from "wagmi"
import { OrderSideEnum } from "../../../../lib/enums/clob.enum"
import { ClobDexComponentProps } from "../clob-dex"

// Define the expected data structure from the GraphQL query
interface PoolsData {
  poolss: {
    items: Array<{
      id: string
      coin: string
      orderBook: string
      baseCurrency: string
      quoteCurrency: string
      lotSize: string
      maxOrderAmount: string
      timestamp: string
    }>
  }
}

// Create a mapping type to convert string timestamp to number
type PoolItemWithStringTimestamp = {
  id: string
  coin: string
  orderBook: string
  baseCurrency: string
  quoteCurrency: string
  lotSize: string
  maxOrderAmount: string
  timestamp: number
}

export type PlaceOrderProps = ClobDexComponentProps & {
  poolId?: string | null;
  poolsData?: PoolsResponse;
  poolsLoading?: boolean;
  poolsError?: Error | null;
  tradesData?: TradesResponse;
  tradesLoading?: boolean;
}

const PlaceOrder = ({ chainId, defaultChainId, poolsData, poolsLoading, poolsError, tradesData, tradesLoading }: PlaceOrderProps) => {
  const { address, isConnected } = useAccount()
  const pathname = usePathname()
  const { selectedPool, selectedPoolId, baseDecimals, quoteDecimals, setSelectedPool } = useMarketStore()

  const [orderType, setOrderType] = useState<"limit" | "market">("limit")
  const [side, setSide] = useState<OrderSideEnum>(OrderSideEnum.BUY) // Default to BUY
  const [price, setPrice] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [total, setTotal] = useState<string>("0")
  const [orderBookAddress, setOrderBookAddress] = useState<HexAddress | undefined>()

  // Balance states
  const [availableBalance, setAvailableBalance] = useState<string>("0")
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Notification dialog states
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationSuccess, setNotificationSuccess] = useState(true)
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>()

  // Component mounted state
  const [mounted, setMounted] = useState(false)

  const formatNumberWithCommas = (value: number | string) => {
    // Parse the number and format it with thousands separators and 4 decimal places
    if (typeof value === "string") {
      value = Number.parseFloat(value)
    }

    if (isNaN(value)) {
      return "0.0000"
    }

    // Format with commas and 4 decimal places
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  }

  const inputStyles = `
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    appearance: textfield;
  }
`

  // Use individual hooks - split for better error isolation
  const {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
    isLimitOrderPending,
    isLimitOrderConfirming,
    isLimitOrderConfirmed,
    isMarketOrderPending,
    isMarketOrderConfirming,
    isMarketOrderConfirmed,
    limitSimulateError,
    marketSimulateError,
  } = usePlaceOrder()

  const { bestPriceBuy, bestPriceSell, isLoadingBestPrices, refreshOrderBook } = useOrderBook(
    (orderBookAddress as HexAddress) || "0x0000000000000000000000000000000000000000",
  )

  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading,
  } = useTradingBalances(BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`)

  const convertToPoolType = (poolItem: PoolItemWithStringTimestamp): Pool => {
    return {
      ...poolItem,
      timestamp: poolItem.timestamp
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !poolsData?.poolss?.items) return

    // Watch for URL changes that might indicate a pool change from another component
    if (pathname) {
      const urlParts = pathname.split('/')
      if (urlParts.length >= 3) {
        const poolIdFromUrl = urlParts[2]

        // If URL has a different pool ID than what's selected, check if it's a valid pool
        if (poolIdFromUrl && poolIdFromUrl !== selectedPoolId) {
          const poolItem = poolsData.poolss.items.find(p => p.id === poolIdFromUrl)
          if (poolItem) {
            console.log(`PlaceOrder: Detected pool change from URL to ${poolItem.coin}`)
            const pool = convertToPoolType(poolItem)
            setSelectedPool(pool)
            setOrderBookAddress(pool.orderBook as HexAddress)
          }
        }
      }
    }
  }, [pathname, selectedPoolId, poolsData, mounted, setSelectedPool])

  useEffect(() => {
    if (selectedPool && selectedPool.orderBook) {
      console.log(`PlaceOrder: Setting orderbook address for ${selectedPool.coin}`)
      setOrderBookAddress(selectedPool.orderBook as HexAddress)

      setPrice("")
      setQuantity("")
      setTotal("0")
    }
  }, [selectedPool])

  // Fall back to first pool if selectedPool is not set
  useEffect(() => {
    if (poolsData && poolsData.poolss.items.length > 0 && !selectedPool) {
      // Find WETH/USDC pair with exact match
      const wethPoolItem = poolsData.poolss.items.find(
        (pool) =>
          pool.coin?.toLowerCase() === "weth/usdc" ||
          (pool.baseCurrency?.toLowerCase() === "weth" && pool.quoteCurrency?.toLowerCase() === "usdc"),
      )

      const wethFallbackPoolItem = !wethPoolItem
        ? poolsData.poolss.items.find((pool) => pool.coin?.toLowerCase().includes("weth"))
        : null

      if (wethPoolItem) {
        const wethPool = convertToPoolType(wethPoolItem)
        setSelectedPool(wethPool)
        setOrderBookAddress(wethPool.orderBook as HexAddress)
      } else if (wethFallbackPoolItem) {
        const wethFallbackPool = convertToPoolType(wethFallbackPoolItem)
        setSelectedPool(wethFallbackPool)
        setOrderBookAddress(wethFallbackPool.orderBook as HexAddress)
      } else {
        const firstPool = convertToPoolType(poolsData.poolss.items[0])
        setSelectedPool(firstPool)
        setOrderBookAddress(firstPool.orderBook as HexAddress)
      }
    }
  }, [poolsData, selectedPool, setSelectedPool])

  // Update total when price or quantity changes
  useEffect(() => {
    if (price && quantity) {
      try {
        const priceValue = Number.parseFloat(price)
        const quantityValue = Number.parseFloat(quantity)
        setTotal((priceValue * quantityValue).toFixed(6))
      } catch (error) {
        setTotal("0")
      }
    } else {
      setTotal("0")
    }
  }, [price, quantity])

  useEffect(() => {
    if (!price && orderType === "limit") {
      if (side === OrderSideEnum.BUY && bestPriceSell) {
        setPrice(formatUnits(bestPriceSell.price, quoteDecimals))
      } else if (side === OrderSideEnum.SELL && bestPriceBuy) {
        setPrice(formatUnits(bestPriceBuy.price, quoteDecimals))
      }
    }
  }, [bestPriceBuy, bestPriceSell, side, price, orderType])

  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && address && selectedPool) {
        setIsLoadingBalance(true)
        try {
          const relevantCurrency =
            side === OrderSideEnum.BUY
              ? (selectedPool.quoteCurrency as HexAddress)
              : (selectedPool.baseCurrency as HexAddress)

          try {
            const total = await getTotalAvailableBalance(relevantCurrency)
            setAvailableBalance(formatUnits(total, side === OrderSideEnum.BUY ? quoteDecimals : baseDecimals)) // Assuming 18 decimals
          } catch (error) {
            console.error("Failed to get total balance, falling back to wallet balance:", error)
            const walletBal = await getWalletBalance(relevantCurrency)
            setAvailableBalance(formatUnits(walletBal, side === OrderSideEnum.BUY ? quoteDecimals : baseDecimals))
          }
        } catch (error) {
          console.error("Error loading any balance:", error)
          setAvailableBalance("Error")
        } finally {
          setIsLoadingBalance(false)
        }
      }
    }

    loadBalance()
  }, [address, isConnected, selectedPool, side, getTotalAvailableBalance, getWalletBalance])

  // Refresh order book on regular intervals
  useEffect(() => {
    if (orderBookAddress) {
      const interval = setInterval(() => {
        refreshOrderBook()
      }, 1000) // Refresh every 10 seconds

      return () => clearInterval(interval)
    }
  }, [orderBookAddress, refreshOrderBook])

  // Show error notification when there's an error
  useEffect(() => {
    if (limitSimulateError || marketSimulateError) {
      const error = limitSimulateError || marketSimulateError
      setNotificationMessage("There was an error processing your transaction. Please try again.")
      setNotificationSuccess(false)
      setNotificationTxHash(undefined)
      setShowNotification(true)
    }
  }, [limitSimulateError, marketSimulateError])

  // Show success notification when order is confirmed
  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      setNotificationMessage(`Your ${side === OrderSideEnum.BUY ? "buy" : "sell"} order has been placed.`)
      setNotificationSuccess(true)
      // Assuming you have the transaction hash saved somewhere in your hooks
      // setNotificationTxHash(txHash);
    }
  }, [isLimitOrderConfirmed, isMarketOrderConfirmed, side])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPool) {
      setNotificationMessage("No trading pair selected.")
      setNotificationSuccess(false)
      setNotificationTxHash(undefined)
      setShowNotification(true)
      return
    }

    // Log wallet address being used for this order
    console.log("Placing order using wallet address:", address)

    try {
      // Enhanced parameter validation
      const quantityBigInt = parseUnits(quantity, baseDecimals)
      const priceBigInt = parseUnits(price, quoteDecimals)

      // Additional checks before contract call
      if (quantityBigInt <= 0n) {
        throw new Error("Quantity must be positive")
      }

      if (priceBigInt <= 0n) {
        throw new Error("Price must be positive")
      }

      // Log detailed transaction parameters for debugging
      console.log("Order Parameters:", {
        walletAddress: address, // Added wallet address to the parameters log
        baseCurrency: selectedPool.baseCurrency,
        quoteCurrency: selectedPool.quoteCurrency,
        price: priceBigInt.toString(),
        quantity: quantityBigInt.toString(),
        side,
      })

      if (orderType === "limit") {
        await handlePlaceLimitOrder(
          {
            baseCurrency: selectedPool.baseCurrency as HexAddress,
            quoteCurrency: selectedPool.quoteCurrency as HexAddress,
          },
          priceBigInt,
          quantityBigInt,
          side,
        )
      } else {
        await handlePlaceMarketOrder(
          {
            baseCurrency: selectedPool.baseCurrency as HexAddress,
            quoteCurrency: selectedPool.quoteCurrency as HexAddress,
          },
          quantityBigInt,
          side,
          priceBigInt,
          true,
        )
      }
    } catch (error) {
      console.error("Detailed Order Placement Error:", error)

      // More informative error handling
      if (error instanceof Error) {
        setNotificationMessage("There was an error processing your transaction. Please try again.")
        setNotificationSuccess(false)
        setNotificationTxHash(undefined)
        setShowNotification(true)
      }
    }
  }

  const isPending = isLimitOrderPending || isMarketOrderPending
  const isConfirming = isLimitOrderConfirming || isMarketOrderConfirming
  const isConfirmed = isLimitOrderConfirmed || isMarketOrderConfirmed
  const orderError = limitSimulateError || marketSimulateError

  if (poolsLoading || !mounted)
    return (
      <div className="flex items-center justify-center h-40 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-2 text-gray-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading trading pairs...</span>
        </div>
      </div>
    )

  if (poolsError)
    return (
      <div className="p-4 bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-xl border border-red-800/50 text-red-300">
        <p>Error loading trading pairs: {(poolsError as Error).message}</p>
      </div>
    )

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl p-3 max-w-md mx-auto border border-gray-700/30 backdrop-blur-sm">
      <style jsx global>
        {inputStyles}
      </style>

      <div className="flex flex-col w-full gap-3 mb-3">
        {isConnected && selectedPool && (
          <div className="bg-gray-900/30 rounded-lg border border-gray-700/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>Available Balance</span>
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">{availableBalance}</span>
              <span className="text-gray-400">{side === OrderSideEnum.BUY ? "USDC" : selectedPool.coin.split("/")[0]}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Order Type and Side Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Order Type Selection */}
          <div className="relative">
            <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${orderType === "limit" ? "bg-blue-600 text-white" : "bg-transparent text-blue-300 hover:bg-blue-800/50"
                  }`}
                onClick={() => setOrderType("limit")}
              >
                <span>Limit</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${orderType === "market"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-blue-300 hover:bg-blue-800/50"
                  }`}
                onClick={() => setOrderType("market")}
              >
                <span>Market</span>
              </button>
            </div>
          </div>

          {/* Buy/Sell Selection */}
          <div className="relative">
            <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${side === OrderSideEnum.BUY ? "bg-emerald-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                  }`}
                onClick={() => setSide(OrderSideEnum.BUY)}
              >
                <span>Buy</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${side === OrderSideEnum.SELL ? "bg-rose-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                  }`}
                onClick={() => setSide(OrderSideEnum.SELL)}
              >
                <span>Sell</span>
              </button>
            </div>
          </div>
        </div>

        {/* Price - Only for Limit Orders */}
        {orderType === "limit" && (
          <div className="space-y-1">
            <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
              <span>Price</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                step={`0.${"0".repeat(quoteDecimals - 1)}1`}
                min="0"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
                {selectedPool?.quoteCurrency ? selectedPool.coin.split("/")[1] : ""}
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Amount</span>
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter amount"
              step="0.000001"
              min="0"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              {selectedPool?.baseCurrency ? selectedPool.coin.split("/")[0] : ""}
            </div>
          </div>
        </div>

        {/* Total - Calculated Field */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Total</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50"
              value={total}
              placeholder="Total amount"
              readOnly
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              USDC
            </div>
          </div>
        </div>

        {/* Submit Button with glow effect */}
        <div className="relative mt-6 group">
          <div
            className={`absolute inset-0 rounded-lg blur-md transition-opacity group-hover:opacity-100 ${side === OrderSideEnum.BUY ? "bg-emerald-500/30" : "bg-rose-500/30"
              } ${isPending || isConfirming || !isConnected ? "opacity-0" : "opacity-50"}`}
          ></div>
          <button
            type="submit"
            className={`relative w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${side === OrderSideEnum.BUY
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              : "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]"
              } ${isPending || isConfirming || !isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isPending || isConfirming || !isConnected}
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : isConfirming ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming...</span>
              </div>
            ) : isConfirmed ? (
              <div className="flex items-center justify-center gap-2">
                <span>Order Placed!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{`${side === OrderSideEnum.BUY ? "Buy" : "Sell"} ${selectedPool?.coin?.split("/")[0] || ""}`}</span>
              </div>
            )}
          </button>
        </div>
      </form>

      {!isConnected && (
        <div className="mt-3 p-2 bg-gray-900/30 text-gray-300 rounded-lg text-sm border border-gray-700/40 text-center flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Please connect wallet to trade</span>
        </div>
      )}

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        message={notificationMessage}
        isSuccess={notificationSuccess}
        txHash={notificationTxHash}
      />
    </div>
  )
}

export default PlaceOrder