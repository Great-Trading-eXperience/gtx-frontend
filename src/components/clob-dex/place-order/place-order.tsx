"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { request } from "graphql-request"
import { formatUnits, parseUnits } from "viem"
import { useAccount } from "wagmi"
import type { HexAddress } from "@/types/web3/general/address"
import { poolsQuery } from "@/graphql/gtx/gtx.query"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { useOrderBookAPI } from "@/hooks/web3/gtx/clob-dex/orderbook/useOrderBookAPI"
import { useTradingBalances } from "@/hooks/web3/gtx/clob-dex/balance-manager/useTradingBalances"
import { usePlaceOrder } from "@/hooks/web3/gtx/clob-dex/gtx-router/write/usePlaceOrder"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { ArrowDown, ArrowUp, BarChart3, ChevronDown, CreditCard, Layers, RefreshCw, Wallet } from "lucide-react"

// Order side type
type Side = 0 | 1 // 0 = BUY, 1 = SELL

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

// Configuration constants - replace with actual contract addresses
const BALANCE_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_GTX_BALANCE_MANAGER_ADDRESS as HexAddress

const PlaceOrder = () => {
  const { address, isConnected } = useAccount()
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [orderType, setOrderType] = useState<"limit" | "market">("limit")
  const [side, setSide] = useState<Side>(0) // Default to BUY
  const [price, setPrice] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [total, setTotal] = useState<string>("0")
  const [orderBookAddress, setOrderBookAddress] = useState<HexAddress | undefined>()

  // Balance states
  const [availableBalance, setAvailableBalance] = useState<string>("0")
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [depositMode, setDepositMode] = useState(false)
  const [depositAmount, setDepositAmount] = useState<string>("")

  // Notification dialog states
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationSuccess, setNotificationSuccess] = useState(true)
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>()

  const formatNumberWithCommas = (value: number | string) => {
    // Parse the number and format it with thousands separators and 4 decimal places
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    if (isNaN(value)) {
      return "0.0000";
    }

    // Format with commas and 4 decimal places
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  };

  // Fetch pools data with react-query
  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = useQuery<PoolsData>({
    queryKey: ["poolsData"],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL as string, poolsQuery)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

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

  const { bestPriceBuy, bestPriceSell, isLoadingBestPrices, refreshOrderBook } = useOrderBookAPI(
    (orderBookAddress as HexAddress) || "0x0000000000000000000000000000000000000000",
  )

  // Use the fixed balance hook
  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading,
  } = useTradingBalances(BALANCE_MANAGER_ADDRESS)

  // Set the first pool as default when data is loaded
  useEffect(() => {
    if (poolsData && poolsData.poolss.items.length > 0 && !selectedPool) {
      // Find WETH/USDC pair with exact match
      const wethPool = poolsData.poolss.items.find(
        pool =>
          pool.coin?.toLowerCase() === 'weth/usdc' ||
          (pool.baseCurrency?.toLowerCase() === 'weth' && pool.quoteCurrency?.toLowerCase() === 'usdc')
      );

      // Fallback: look for any pool with WETH in it
      const wethFallbackPool = !wethPool ? poolsData.poolss.items.find(
        pool => pool.coin?.toLowerCase().includes('weth')
      ) : null;

      // Set WETH/USDC as default if found, then try fallback, otherwise use first pool
      if (wethPool) {
        setSelectedPool(wethPool);
        setOrderBookAddress(wethPool.orderBook as HexAddress);
      } else if (wethFallbackPool) {
        setSelectedPool(wethFallbackPool);
        setOrderBookAddress(wethFallbackPool.orderBook as HexAddress);
      } else {
        setSelectedPool(poolsData.poolss.items[0]);
        setOrderBookAddress(poolsData.poolss.items[0].orderBook as HexAddress);
      }
    }
  }, [poolsData])

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

  // Auto-fill best price when available and if price field is empty
  useEffect(() => {
    if (!price && orderType === "limit") {
      if (side === 0 && bestPriceSell) {
        // Buy - use best sell price
        setPrice(formatUnits(bestPriceSell.price, 0))
      } else if (side === 1 && bestPriceBuy) {
        // Sell - use best buy price
        setPrice(formatUnits(bestPriceBuy.price, 0))
      }
    }
  }, [bestPriceBuy, bestPriceSell, side, price, orderType])

  // Load balance when pool or address changes
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && address && selectedPool) {
        setIsLoadingBalance(true)
        try {
          const relevantCurrency =
            side === 0
              ? (selectedPool.quoteCurrency as HexAddress) // For buys, we need quote currency (USDC)
              : (selectedPool.baseCurrency as HexAddress) // For sells, we need base currency (ETH)

          // Use wallet balance as fallback if manager balance fails
          try {
            const total = await getTotalAvailableBalance(relevantCurrency)
            setAvailableBalance(formatUnits(total, 18)) // Assuming 18 decimals
          } catch (error) {
            console.error("Failed to get total balance, falling back to wallet balance:", error)
            const walletBal = await getWalletBalance(relevantCurrency)
            setAvailableBalance(formatUnits(walletBal, 18))
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
      }, 10000) // Refresh every 10 seconds

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
      setNotificationMessage(`Your ${side === 0 ? "buy" : "sell"} order has been placed.`)
      setNotificationSuccess(true)
      // Assuming you have the transaction hash saved somewhere in your hooks
      // setNotificationTxHash(txHash);
      setShowNotification(true)
    }
  }, [isLimitOrderConfirmed, isMarketOrderConfirmed, side])

  const handlePoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poolId = e.target.value
    const pool = poolsData?.poolss.items.find((p: any) => p.id === poolId)
    setSelectedPool(pool)
    setOrderBookAddress(pool?.orderBook as HexAddress)
  }

  const handleMaxDeposit = () => {
    if (availableBalance !== "Error" && !isLoadingBalance && !balanceLoading) {
      // Subtract a small amount to account for gas fees if this is the native token
      const maxAmount = Number.parseFloat(availableBalance)
      if (!isNaN(maxAmount)) {
        // Format to 6 decimal places to avoid floating point issues
        setDepositAmount(maxAmount.toFixed(4))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Log wallet address being used for this order
    console.log("Placing order using wallet address:", address)

    try {
      // Enhanced parameter validation
      const quantityBigInt = parseUnits(quantity, 18)
      const priceBigInt = parseUnits(price, 0)

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

      // Existing order placement logic
      await handlePlaceLimitOrder(
        {
          baseCurrency: selectedPool.baseCurrency as HexAddress,
          quoteCurrency: selectedPool.quoteCurrency as HexAddress,
        },
        priceBigInt,
        quantityBigInt,
        side,
      )
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !selectedPool || !address) {
      setNotificationMessage("Please connect your wallet first.")
      setNotificationSuccess(false)
      setNotificationTxHash(undefined)
      setShowNotification(true)
      return
    }

    try {
      const relevantCurrency =
        side === 0
          ? (selectedPool.quoteCurrency as HexAddress) // For buys, we need quote currency (USDC)
          : (selectedPool.baseCurrency as HexAddress) // For sells, we need base currency (ETH)

      const depositBigInt = parseUnits(depositAmount, 18) // Assuming 18 decimals
      await deposit(relevantCurrency, depositBigInt)

      // Reset and refresh balance
      setDepositAmount("")
      setDepositMode(false)

      // Refresh balance
      try {
        const total = await getTotalAvailableBalance(relevantCurrency)
        setAvailableBalance(formatUnits(total, 18))

        // Show success message
        setNotificationMessage("Successfully deposited funds.")
        setNotificationSuccess(true)
        // You can set transaction hash here if available
        // setNotificationTxHash(depositTxHash);
        setShowNotification(true)
      } catch (error) {
        console.error("Failed to refresh balance after deposit:", error)
      }
    } catch (error) {
      console.error("Deposit error:", error)

      setNotificationMessage("There was an error processing your deposit.")
      setNotificationSuccess(false)
      setNotificationTxHash(undefined)
      setShowNotification(true)
    }
  }

  const getCoinIcon = (pair: string | null) => {
    if (!pair) return "/icon/eth-usdc.png"

    const lowerPair = pair.toLowerCase()
    if (lowerPair.includes("eth") || lowerPair.includes("weth")) {
      return "/icon/eth-usdc.png"
    } else if (lowerPair.includes("btc") || lowerPair.includes("wbtc")) {
      return "/icon/btc-usdc.png"
    } else if (lowerPair.includes("pepe")) {
      return "/icon/pepe-usdc.png"
    } else if (lowerPair.includes("link")) {
      return "/icon/link-usdc.png"
    }

    // Default icon
    return "/icon/eth-usdc.png"
  }

  const isPending = isLimitOrderPending || isMarketOrderPending
  const isConfirming = isLimitOrderConfirming || isMarketOrderConfirming
  const isConfirmed = isLimitOrderConfirmed || isMarketOrderConfirmed
  const orderError = limitSimulateError || marketSimulateError

  if (poolsLoading)
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
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl p-5 max-w-md mx-auto border border-gray-700/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-sm">
      {/* Header with glowing effect */}
      <div className="relative mb-6">
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-gray-500/20 rounded-full blur-xl"></div>
        <h2 className="text-2xl font-bold text-white flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-gray-400" />
            <span>Trade</span>
          </div>
          {isConnected && (
            <div className="text-sm px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 text-gray-300 flex items-center gap-1.5">
              <span>{selectedPool?.coin}</span>
              <BarChart3 className="w-4 h-4" />
            </div>
          )}
        </h2>
      </div>

      {/* Balance Row */}
      <div className="flex flex-col w-full gap-4 mb-5">
        {isConnected && selectedPool && (
          <div className="bg-gray-900/30 rounded-lg border border-gray-700/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>Available Balance</span>
              </h3>
              <button
                onClick={() => refreshOrderBook()}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-white">
                {isLoadingBalance || balanceLoading
                  ? "..."
                  : availableBalance === "Error"
                    ? "Error"
                    : formatNumberWithCommas(availableBalance)}
              </div>
              <div className="text-gray-300 text-sm px-2 py-0.5 bg-gray-800/40 rounded-md border border-gray-700/40">
                {side === 0 ? "USDC" : selectedPool.coin.split("/")[0]}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Form */}
      <div className="mb-5">
        <form onSubmit={handleDeposit} className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <input
            type="number"
            className="w-full bg-gray-900/40 text-white text-sm rounded-l-lg py-3 pl-10 pr-24 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder={`Deposit ${side === 0 ? "USDC" : selectedPool?.coin?.split("/")[0] || ""}`}
            step="0.0001"
            min="0"
          />
          <div className="absolute right-[76px] top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handleMaxDeposit}
              className="text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-1 py-1 rounded border border-gray-700/50 transition-colors"
              disabled={balanceLoading || availableBalance === "Error" || !isConnected}
            >
              MAX
            </button>
          </div>
          <button
            type="submit"
            className="absolute right-0 top-0 h-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-2 rounded-r-lg transition-colors flex items-center gap-1 border border-blue-500"
            disabled={balanceLoading || !depositAmount}
          >
            {balanceLoading ? (
              <>
                {/* <RefreshCw className="w-3.5 h-3.5 animate-spin" /> */}
                <span>Loading</span>
              </>
            ) : (
              <>
                {/* <ArrowDown className="w-3.5 h-3.5" /> */}
                <span>Deposit</span>
              </>
            )}
          </button>
        </form>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type and Side Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Order Type Selection */}
          <div className="relative">
            <div className="flex h-11 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
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
            <div className="flex h-11 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${side === 0 ? "bg-emerald-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                  }`}
                onClick={() => setSide(0)}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Buy</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${side === 1 ? "bg-rose-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                  }`}
                onClick={() => setSide(1)}
              >
                <ArrowUp className="w-3.5 h-3.5" />
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
                className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-3 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                step="0.000001"
                min="0"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
                USDC
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
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-3 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
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
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-3 px-3 pr-16 border border-gray-700/50"
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
            className={`absolute inset-0 rounded-lg blur-md transition-opacity group-hover:opacity-100 ${side === 0 ? "bg-emerald-500/30" : "bg-rose-500/30"
              } ${isPending || isConfirming || !isConnected ? "opacity-0" : "opacity-50"}`}
          ></div>
          <button
            type="submit"
            className={`relative w-full py-3.5 px-4 rounded-lg text-sm font-medium transition-all ${side === 0
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
                {side === 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                <span>{`${side === 0 ? "Buy" : "Sell"} ${selectedPool?.coin.split("/")[0]}`}</span>
              </div>
            )}
          </button>
        </div>
      </form>

      {!isConnected && (
        <div className="mt-4 p-3 bg-gray-900/30 text-gray-300 rounded-lg text-sm border border-gray-700/40 text-center flex items-center justify-center gap-2">
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

