"use client"

import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { ContractName, getContractAddress } from "@/constants/contract/contract-address"
import { EXPLORER_URL } from "@/constants/explorer-url"
import { PoolItem, TradeItem } from "@/graphql/gtx/clob"
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
import { OrderSideEnum } from "../../../../lib/enums/clob.enum"
import { ClobDexComponentProps } from "../clob-dex"
import { useContractRead, useChainId, useAccount } from "wagmi"
import { toast } from "sonner"
import poolManagerABI from "@/abis/gtx/clob/PoolManagerABI"
import { formatNumber } from "@/lib/utils"

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

export interface PlaceOrderProps extends ClobDexComponentProps {
  selectedPool: PoolItem;
  tradesData: TradeItem[];
  tradesLoading: boolean;
}

const PlaceOrder = ({
  address,
  chainId,
  defaultChainId,
  selectedPool,
  tradesData,
  tradesLoading
}: PlaceOrderProps) => {
  const { isConnected } = useAccount()
  const { selectedPoolId, baseDecimals, quoteDecimals, setSelectedPool } = useMarketStore()
  const pathname = usePathname()

  const currentChainId = useChainId();
  const poolManagerAddress = getContractAddress(currentChainId, ContractName.clobPoolManager) as `0x${string}`;
  
  const { data: pool } = useContractRead({
    address: poolManagerAddress,
    abi: poolManagerABI,
    functionName: 'getPool',
    args: [
      {
        baseCurrency: selectedPool?.baseCurrency as `0x${string}`,
        quoteCurrency: selectedPool?.quoteCurrency as `0x${string}`
      }
    ],
    chainId: currentChainId
  }) as { data: { 
    baseCurrency: `0x${string}`, 
    quoteCurrency: `0x${string}`, 
    orderBook: `0x${string}` 
  } | undefined };

  const [orderType, setOrderType] = useState<"limit" | "market">("limit")
  const [side, setSide] = useState<OrderSideEnum>(OrderSideEnum.BUY) // Default to BUY
  const [price, setPrice] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [total, setTotal] = useState<string>("0")

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
    (pool?.orderBook as HexAddress) || "0x0000000000000000000000000000000000000000",
  )

  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading,
  } = useTradingBalances(getContractAddress(chainId ?? defaultChainId, ContractName.clobBalanceManager) as `0x${string}`)

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
    if (!mounted || !selectedPool) return

    if (pathname) {
      const urlParts = pathname.split('/')
      if (urlParts.length >= 3) {
        const poolIdFromUrl = urlParts[2]

        if (poolIdFromUrl && poolIdFromUrl !== selectedPoolId) {
          const poolItem = selectedPool
          if (poolItem) {
            console.log(`PlaceOrder: Detected pool change from URL to ${poolItem.coin}`)
            const pool = convertToPoolType(poolItem)
            setSelectedPool(pool)
          }
        }
      }
    }
  }, [pathname, selectedPoolId, selectedPool, mounted, setSelectedPool])

  useEffect(() => {
    if (selectedPool && selectedPool.orderBook) {
      console.log(`PlaceOrder: Setting orderbook address for ${selectedPool.coin}`)
      setPrice("")
      setQuantity("")
      setTotal("0")
    }
  }, [selectedPool])

  // Fall back to first pool if selectedPool is not set
  useEffect(() => {
    if (selectedPool && selectedPool.orderBook) {
      console.log(`PlaceOrder: Setting orderbook address for ${selectedPool.coin}`)
      setPrice("")
      setQuantity("")
      setTotal("0")
    }
  }, [selectedPool])

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
      if (address && selectedPool) {
        setIsLoadingBalance(true)
        try {
          const relevantCurrency =
            side === OrderSideEnum.BUY
              ? (selectedPool.quoteCurrency as HexAddress)
              : (selectedPool.baseCurrency as HexAddress)

          try {
            const total = await getTotalAvailableBalance(relevantCurrency)
            setAvailableBalance(formatUnits(total, side === OrderSideEnum.BUY ? quoteDecimals : baseDecimals))
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
  }, [address, selectedPool, side, getTotalAvailableBalance, getWalletBalance])

  // Refresh order book on regular intervals
  useEffect(() => {
    if (!pool?.orderBook) {
      return;
    }

    const interval = setInterval(() => {
      refreshOrderBook()
    }, 5000) 

    return () => clearInterval(interval)
  }, [pool?.orderBook])

  // Show error notification when there's an error
  useEffect(() => {
    if (limitSimulateError || marketSimulateError) {
      const error = limitSimulateError || marketSimulateError
      setNotificationMessage(`There was an error processing your transaction. ${error?.message || 'Unknown error occurred.'}`);
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

  // Function to handle order placement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPool) {
      toast.error("No trading pair selected.");
      return;
    }

    if (!pool) {
      toast.error("Pool data not available.");
      return;
    }

    try {
      // Enhanced parameter validation
      const quantityBigInt = parseUnits(quantity, baseDecimals);
      const priceBigInt = parseUnits(price, quoteDecimals);

      // Additional checks before contract call
      if (quantityBigInt <= 0n) {
        throw new Error("Quantity must be positive");
      }

      if (priceBigInt <= 0n) {
        throw new Error("Price must be positive");
      }

      if (orderType === "limit") {
        await handlePlaceLimitOrder(
          pool,
          priceBigInt,
          quantityBigInt,
          side
        );
      } else {
        await handlePlaceMarketOrder(
          pool,
          quantityBigInt,
          side,
          priceBigInt,
          true
        );
      }
    } catch (err) {
      let errorMessage = "Failed to place order";
      if (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
      }
      console.error("Order placement error:", errorMessage);
      toast.error(errorMessage);
    }
  };

  const isPending = isLimitOrderPending || isMarketOrderPending
  const isConfirming = isLimitOrderConfirming || isMarketOrderConfirming
  const isConfirmed = isLimitOrderConfirmed || isMarketOrderConfirmed
  const orderError = limitSimulateError || marketSimulateError

  if (tradesLoading || !mounted)
    return (
      <div className="flex items-center justify-center h-40 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-2 text-gray-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading trading pairs...</span>
        </div>
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
              <span className="text-gray-300">{formatNumber(Number(availableBalance), { decimals: 2, compact: true })}</span>
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
        explorerBaseUrl={EXPLORER_URL(chainId ?? defaultChainId)}
      />
    </div>
  )
}

export default PlaceOrder