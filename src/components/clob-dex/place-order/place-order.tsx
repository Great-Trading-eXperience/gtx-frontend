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
import TokenABI from "@/abis/tokens/TokenABI"
import { readContract } from "@wagmi/core"
import { wagmiConfig } from "@/configs/wagmi"

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

interface ProcessedPool {
  id: string
  baseToken: string
  quoteToken: string
  orderBook: string
  timestamp: number
  maxOrderAmount: string
  baseSymbol: string
  quoteSymbol: string
  baseDecimals: number
  quoteDecimals: number
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

  // Process pool data to get token information
  const processPool = async (pool: PoolItem) => {
    const [baseTokenAddress, quoteTokenAddress] = [pool.baseCurrency, pool.quoteCurrency]
    
    let baseSymbol = baseTokenAddress
    let quoteSymbol = quoteTokenAddress
    let baseDecimals = 18
    let quoteDecimals = 6

    // Get base token info
    if (baseTokenAddress !== 'Unknown') {
      try {
        const symbol = await readContract(wagmiConfig, {
          address: baseTokenAddress as `0x${string}`,
          abi: TokenABI,
          functionName: "symbol",
        })
        const decimals = await readContract(wagmiConfig, {
          address: baseTokenAddress as `0x${string}`,
          abi: TokenABI,
          functionName: "decimals",
        })
        baseSymbol = symbol as string
        baseDecimals = decimals as number
      } catch (error) {
        console.error(`Error fetching base token info for ${baseTokenAddress}:`, error)
      }
    }

    // Get quote token info
    if (quoteTokenAddress !== 'USDC') {
      try {
        const symbol = await readContract(wagmiConfig, {
          address: quoteTokenAddress as `0x${string}`,
          abi: TokenABI,
          functionName: "symbol",
        })
        const decimals = await readContract(wagmiConfig, {
          address: quoteTokenAddress as `0x${string}`,
          abi: TokenABI,
          functionName: "decimals",
        })
        quoteSymbol = symbol as string
        quoteDecimals = decimals as number
      } catch (error) {
        console.error(`Error fetching quote token info for ${quoteTokenAddress}:`, error)
      }
    }

    return {
      id: pool.id,
      baseToken: baseTokenAddress,
      quoteToken: quoteTokenAddress,
      orderBook: pool.orderBook,
      baseSymbol,
      quoteSymbol,
      baseDecimals,
      quoteDecimals,
      timestamp: pool.timestamp,
      maxOrderAmount: pool.maxOrderAmount || '0'
    }
  }

  // Get the pool using poolManager
  const { data: poolData } = useContractRead({
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

  // Process pool data when it changes
  useEffect(() => {
    const processPoolData = async () => {
      if (selectedPool) {
        const processedPool = await processPool(selectedPool);
        // Update store with processed pool data
        setSelectedPool({
          ...selectedPool,
          coin: `${processedPool.baseSymbol}/${processedPool.quoteSymbol}`,
          baseDecimals: processedPool.baseDecimals,
          quoteDecimals: processedPool.quoteDecimals
        });
      }
    };

    processPoolData();
  }, [selectedPool, setSelectedPool]);

  const { bestPriceBuy, bestPriceSell, isLoadingBestPrices, refreshOrderBook } = useOrderBook(
    (poolData?.orderBook as HexAddress) || "0x0000000000000000000000000000000000000000",
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
    if (!selectedPool) return

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
  }, [pathname, selectedPoolId, selectedPool, setSelectedPool])

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
  }, [address, selectedPool, side, getTotalAvailableBalance, getWalletBalance])

  // Refresh order book on regular intervals
  useEffect(() => {
    if (poolData?.orderBook) {
      const interval = setInterval(() => {
        refreshOrderBook()
      }, 1000) // Refresh every 10 seconds

      return () => clearInterval(interval)
    }
  }, [poolData?.orderBook, refreshOrderBook])

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

  useEffect(() => {
    setMounted(true)
  }, [])

  // Function to handle order placement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPool) {
      toast.error("No trading pair selected.");
      return;
    }

    if (!poolData) {
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
          poolData,
          priceBigInt,
          quantityBigInt,
          side
        );
      } else {
        await handlePlaceMarketOrder(
          poolData,
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
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${side === OrderSideEnum.SELL ? "bg-emerald-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                  }`}
                onClick={() => setSide(OrderSideEnum.SELL)}
              >
                <span>Sell</span>
              </button>
            </div>
          </div>
        </div>

        {/* Price and Quantity Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Price Input */}
          <div className="relative">
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="w-full h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20 text-white"
            />
          </div>

          {/* Quantity Input */}
          <div className="relative">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity"
              className="w-full h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20 text-white"
            />
          </div>
        </div>

        {/* Total Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Input */}
          <div className="relative">
            <input
              type="text"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="Total"
              className="w-full h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20 text-white"
              readOnly
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="w-full h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20 text-white hover:bg-gray-800/50"
          >
            {isPending ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PlaceOrder