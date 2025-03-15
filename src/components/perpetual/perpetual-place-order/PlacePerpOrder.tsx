"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { ArrowDown, ArrowUp, ChevronDown, RefreshCw, Wallet, Layers, BarChart3 } from "lucide-react"

// Types
import type { HexAddress } from "@/types/web3/general/address"
import { usePerpTrading } from "@/hooks/web3/gtx/perpetual/usePerpTrading"
import PercentageSlider from "./percentage-slider"
import { LeverageDialog } from "./leverage-dialog"

// Mock market data - replace with your actual data fetching
const MARKETS = [
  {
    id: "1",
    name: "ETH-USDC",
    marketAddress: process.env.NEXT_PUBLIC_WETH_USDC_MARKET_ADDRESS as HexAddress,
    collateralToken: process.env.NEXT_PUBLIC_WETH_ADDRESS as HexAddress,
    symbol: "ETH",
    icon: "/icon/eth-usdc.png",
  },
  {
    id: "2",
    name: "BTC-USDC",
    marketAddress: process.env.NEXT_PUBLIC_WBTC_USDC_MARKET_ADDRESS as HexAddress,
    collateralToken: process.env.NEXT_PUBLIC_WBTC_ADDRESS as HexAddress,
    symbol: "BTC",
    icon: "/icon/btc-usdc.png",
  },
  {
    id: "3",
    name: "PEPE-USDC",
    marketAddress: process.env.NEXT_PUBLIC_PEPE_USDC_MARKET_ADDRESS as HexAddress,
    collateralToken: process.env.NEXT_PUBLIC_PEPE_ADDRESS as HexAddress,
    symbol: "PEPE",
    icon: "/icon/pepe-usdc.png",
  },
]

// Constants
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS as HexAddress
const ORDER_VAULT_ADDRESS = process.env.NEXT_PUBLIC_ORDER_VAULT_ADDRESS as HexAddress

const PlacePerpOrder = () => {
  const { address, isConnected } = useAccount()

  // State for order form
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0])
  const [isLong, setIsLong] = useState(true)
  const [collateralAmount, setCollateralAmount] = useState("")
  const [leverage, setLeverage] = useState(1)
  const [positionSizeUsd, setPositionSizeUsd] = useState("0")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [limitPrice, setLimitPrice] = useState("")
  const [sliderValue, setSliderValue] = useState([0])
  const [changeSource, setChangeSource] = useState<"input" | "slider" | null>(null)
  const [isClient, setIsClient] = useState(false)

  // State for notification dialog
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationSuccess, setNotificationSuccess] = useState(true)
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>()

  // Initialize the hook
  const { createOrder, createLeveragedPosition, txHash, isProcessing, error } = usePerpTrading(
    ROUTER_ADDRESS,
    ORDER_VAULT_ADDRESS,
  )

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Transaction confirmation state
  const {
    data: transactionReceipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Update position size when collateral or leverage changes
  useEffect(() => {
    if (collateralAmount && leverage) {
      try {
        const collateralValue = Number.parseFloat(collateralAmount)
        const leverageValue = leverage

        if (!isNaN(collateralValue) && !isNaN(leverageValue)) {
          setPositionSizeUsd((collateralValue * leverageValue).toFixed(2))
        }
      } catch (err) {
        console.error("Error calculating position size:", err)
        setPositionSizeUsd("0")
      }
    } else {
      setPositionSizeUsd("0")
    }
  }, [collateralAmount, leverage])

  // Show notification on transaction status change
  useEffect(() => {
    if (error) {
      setNotificationMessage(error.message || "Transaction failed")
      setNotificationSuccess(false)
      setNotificationTxHash(undefined)
      setShowNotification(true)
    } else if (isConfirmed) {
      setNotificationMessage(`${isLong ? "Long" : "Short"} position created successfully!`)
      setNotificationSuccess(true)
      setNotificationTxHash(txHash)
      setShowNotification(true)
    }
  }, [error, isConfirmed, txHash, isLong])

  // Update slider when collateral amount changes (but only when input triggered the change)
  useEffect(() => {
    if (changeSource === "input" && collateralAmount) {
      // Mock max amount - in a real app, you'd get this from the wallet balance
      const maxAmount = 10
      const currentAmount = Number.parseFloat(collateralAmount)
      const percentage = Math.min(Math.floor((currentAmount / maxAmount) * 100), 100)
      setSliderValue([percentage])
      setChangeSource(null) // Reset source
    }
  }, [collateralAmount, changeSource])

  // Update collateral amount when slider changes (but only when slider triggered the change)
  useEffect(() => {
    if (changeSource === "slider") {
      // Mock max amount - in a real app, you'd get this from the wallet balance
      const maxAmount = 10

      if (sliderValue[0] === 0) {
        setCollateralAmount("0")
      } else {
        const newAmount = (maxAmount * sliderValue[0]) / 100
        setCollateralAmount(newAmount.toFixed(6))
      }

      setChangeSource(null) // Reset source
    }
  }, [sliderValue, changeSource])

  const handleMarketChange = (marketId: string) => {
    const market = MARKETS.find((m) => m.id === marketId)
    if (market) {
      setSelectedMarket(market)
      setIsDropdownOpen(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setNotificationMessage("Please connect your wallet first")
      setNotificationSuccess(false)
      setNotificationTxHash(undefined)
      setShowNotification(true)
      return
    }

    try {
      // Validate inputs
      if (!collateralAmount || Number.parseFloat(collateralAmount) <= 0) {
        setNotificationMessage("Please enter a valid collateral amount")
        setNotificationSuccess(false)
        setNotificationTxHash(undefined)
        setShowNotification(true)
        return
      }

      if (orderType === "limit" && (!limitPrice || Number.parseFloat(limitPrice) <= 0)) {
        setNotificationMessage("Please enter a valid limit price")
        setNotificationSuccess(false)
        setNotificationTxHash(undefined)
        setShowNotification(true)
        return
      }

      // Create position with simplified interface
      await createLeveragedPosition({
        marketAddress: selectedMarket.marketAddress,
        collateralToken: selectedMarket.collateralToken,
        collateralAmount,
        leverage: leverage,
        isLong,
      })
    } catch (err) {
      console.error("Error submitting order:", err)
    }
  }

  // Format number with commas for display
  const formatNumberWithCommas = (value: number | string) => {
    if (typeof value === "string") {
      value = Number.parseFloat(value)
    }

    if (isNaN(value)) {
      return "0.0000"
    }

    return value.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  }

  // Calculate liquidation price (simplified calculation)
  const getLiquidationPrice = () => {
    // Mock price for the selected market - in a real app, you'd fetch this
    const currentPrice = selectedMarket.id === "1" ? 3000 : selectedMarket.id === "2" ? 50000 : 0.00001

    if (isLong) {
      return currentPrice * (1 - 0.9 / leverage)
    } else {
      return currentPrice * (1 + 0.9 / leverage)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-lg p-4 max-w-md mx-auto border border-gray-700/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-sm">
      {/* Add CSS to remove number input spinners */}
      <style jsx global>{`
        /* Remove arrows/spinners from number inputs in different browsers */
        /* Chrome, Safari, Edge, Opera */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        /* Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Header with glowing effect */}
      <div className="relative mb-3">
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-gray-500/20 rounded-full blur-xl"></div>
        <h2 className="text-xl font-bold text-white flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-gray-400" />
            <span>Perp Trading</span>
          </div>
          {isConnected && (
            <div className="text-sm px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/50 text-gray-300 flex items-center gap-1">
              <span>{selectedMarket.name}</span>
              <BarChart3 className="w-3 h-3" />
            </div>
          )}
        </h2>
      </div>

      {/* Balance Row */}
      <div className="flex flex-col w-full gap-3 mb-3">
        <div className="bg-gray-900/30 rounded-lg border border-gray-700/40 p-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-gray-300 text-sm flex items-center gap-1.5">
              <Wallet className="w-3 h-3" />
              <span>Available to Trade</span>
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-white">10.0000</div>
            <div className="text-gray-300 text-sm px-2 py-0.5 bg-gray-800/40 rounded-md border border-gray-700/40">
              {selectedMarket.symbol}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
            <span>Current Position</span>
            <span>0.0000 {selectedMarket.symbol}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Order Type and Side Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Order Type Selection */}
          <div className="relative">
            <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 transition-colors ${
                  orderType === "market"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-blue-300 hover:bg-blue-800/50"
                }`}
                onClick={() => setOrderType("market")}
              >
                <span>Market</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 transition-colors ${
                  orderType === "limit" ? "bg-blue-600 text-white" : "bg-transparent text-blue-300 hover:bg-blue-800/50"
                }`}
                onClick={() => setOrderType("limit")}
              >
                <span>Limit</span>
              </button>
            </div>
          </div>

          {/* Buy/Sell Selection */}
          <div className="relative">
            <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 transition-colors ${
                  isLong ? "bg-emerald-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setIsLong(true)}
              >
                <ArrowDown className="w-3 h-3" />
                <span>Long</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 transition-colors ${
                  !isLong ? "bg-rose-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setIsLong(false)}
              >
                <ArrowUp className="w-3 h-3" />
                <span>Short</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leverage section */}
        <div className="flex items-center justify-between mb-3">
          <LeverageDialog leverage={leverage} setLeverage={setLeverage} maxLeverage={20} />
        </div>

        {/* Limit Price Container - Always present with consistent height */}
        <div className="h-[68px]">
          {orderType === "limit" ? (
            <div className="space-y-0.5">
              <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
                <span>Price (USD)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2.5 px-3 pr-20 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-gray-500/50 transition-all"
                  placeholder="0.00"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800 px-2 py-0.5 rounded border border-gray-700/40">
                  USDC
                </div>
              </div>
            </div>
          ) : (
            <div className="opacity-0">{/* Empty spacer div with same height */}</div>
          )}
        </div>

        {/* Market Selection */}
        <div className="space-y-0.5">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Market</span>
          </label>
          <div className="relative">
            {isClient && (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2.5 px-3 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-gray-500/50 transition-all flex items-center justify-between"
              >
                <span>{selectedMarket.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {isClient && isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                {MARKETS.map((market) => (
                  <div
                    key={market.id}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300"
                    onClick={() => handleMarketChange(market.id)}
                  >
                    {market.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collateral Amount */}
        <div className="space-y-0.5">
          <label className="text-sm text-gray-300 flex items-center gap-1 ml-1">
            <span>Size</span>
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2.5 px-3 pr-24 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-gray-500/50 transition-all"
              value={collateralAmount}
              onChange={(e) => {
                setCollateralAmount(e.target.value)
                setChangeSource("input")
              }}
              placeholder="Enter collateral amount"
              step="0.000001"
              min="0"
              required
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800 px-2 py-0.5 rounded border border-gray-700/40">
              {selectedMarket.symbol}
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="flex w-full gap-4 items-center">
          <div className="flex-1">
            <PercentageSlider
              value={sliderValue[0]}
              onChange={(val) => {
                setSliderValue([val])
                setChangeSource("slider")
              }}
              onCommit={(val) => {
                setSliderValue([val])
                setChangeSource("slider")
              }}
              activeColor={isLong ? "bg-emerald-500/70" : "bg-rose-500/70"}
              thumbColor={isLong ? "bg-emerald-500" : "bg-rose-500"}
            />
          </div>
          <div className="flex items-center bg-gray-900/40 rounded-lg px-2.5 py-1.5 border border-gray-700/50">
            <input
              type="number"
              max={100}
              value={sliderValue[0]}
              onChange={(e) => {
                const newValue = Math.min(Math.max(0, Number(e.target.value)), 100)
                setSliderValue([newValue])
                setChangeSource("slider")
              }}
              className="w-7 text-left bg-transparent outline-none text-white text-sm"
            />
            <span className="ml-0.5 text-sm text-gray-300">%</span>
          </div>
        </div>

        {/* Position Size - Calculated Field */}
        <div className="space-y-0.5">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Position Size</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2.5 px-3 pr-16 border border-gray-700/50"
              value={formatNumberWithCommas(positionSizeUsd)}
              placeholder="Position size"
              readOnly
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              USDC
            </div>
          </div>
        </div>

        {/* Submit Button with glow effect */}
        <div className="relative mt-4 group">
          <div
            className={`absolute inset-0 rounded-lg blur-md transition-opacity group-hover:opacity-100 ${
              isLong ? "bg-emerald-500/30" : "bg-rose-500/30"
            } ${isProcessing || isConfirming || !isConnected ? "opacity-0" : "opacity-50"}`}
          ></div>
          <button
            type="submit"
            className={`relative w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              isLong
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                : "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            } ${isProcessing || isConfirming || !isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isProcessing || isConfirming || !isConnected}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : isConfirming ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                {isLong ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                <span>{isLong ? "Buy / Long" : "Sell / Short"}</span>
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Order Information */}
      <div className="flex flex-col gap-1.5 border-t border-gray-800 pt-3 mt-3">
        <div className="flex justify-between text-[0.72rem]">
          <span className="text-gray-400">Liquidation Price</span>
          <span className="text-white">${getLiquidationPrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[0.72rem]">
          <span className="text-gray-400">Order Value</span>
          <span className="text-white">${Number.parseFloat(positionSizeUsd).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[0.72rem]">
          <span className="text-gray-400">Margin Required</span>
          <span className="text-white">
            ${collateralAmount ? Number.parseFloat(collateralAmount).toFixed(2) : "0.00"}
          </span>
        </div>
        <div className="flex justify-between text-[0.72rem]">
          <span className="text-gray-400">Fees</span>
          <span className="text-white">0.0350% / 0.0100%</span>
        </div>
      </div>

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

export default PlacePerpOrder

