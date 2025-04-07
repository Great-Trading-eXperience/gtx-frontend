"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, ChevronDown, Wallet, Layers, BarChart3, RefreshCw } from "lucide-react"
import { parseUnits, formatEther } from "viem"
import { useAccount, useBalance } from "wagmi"
import { HexAddress } from "@/types/web3/general/address"
import { usePerpetualPlaceOrder } from "@/hooks/web3/gtx/perpetual/usePerpetualPlaceOrder"
import { LeverageDialog } from "./leverage-dialog"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import PercentageSlider from "./percentage-slider"
import { usePerpetualMarketStore } from "@/store/perpetual-market-store"

// Define local type for token
type TokenInfo = {
    symbol: string;
    address: HexAddress;
    decimals: number;
}

// Define order params type locally in case import fails
type OrderParams = {
    market: HexAddress;
    collateralToken: HexAddress;
    isLong: boolean;
    sizeDeltaUsd: bigint;
    collateralAmount: bigint;
    leverage?: number;
    triggerPrice?: bigint;
    acceptablePriceImpact?: number;
    autoCancel?: boolean;
};

// Default decimals for tokens
const TOKEN_DECIMALS = {
    "WETH": 18,
    "ETH": 18,
    "WBTC": 8,
    "BTC": 8,
    "USDC": 6,
    "LINK": 18,
    "DOGE": 18,
    "PEPE": 18,
    "TRUMP": 18,
    "DEFAULT": 18
}

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

const PerpetualPlaceOrder = () => {
    const { address, isConnected } = useAccount()
    const [orderType, setOrderType] = useState<"market" | "limit">("market")
    const [side, setSide] = useState<boolean>(true) // true = buy/long, false = sell/short

    const [sizeValue, setSizeValue] = useState<string>("")
    const [sliderValue, setSliderValue] = useState([0])
    const [selectedCollateralToken, setSelectedCollateralToken] = useState<HexAddress | null>(null)
    const [showTPSL, setShowTPSL] = useState(false)
    const [reduceOnly, setReduceOnly] = useState(false)
    const [limitPrice, setLimitPrice] = useState<string>("")
    const [tpPrice, setTpPrice] = useState<string>("")
    const [slPrice, setSlPrice] = useState<string>("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [leverage, setLeverage] = useState(1) // Default 1x leverage
    const [isClient, setIsClient] = useState(false)
    
    // Add change source state to track what triggered the change
    const [changeSource, setChangeSource] = useState<"input" | "slider" | null>(null)

    // Notification dialog states
    const [showNotification, setShowNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState("")
    const [notificationSuccess, setNotificationSuccess] = useState(true)
    const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>()

    // Get market data from Zustand store
    const { 
        selectedTokenId, 
        marketTokenMap, 
        markets,
        marketData, 
        tradingPairs 
    } = usePerpetualMarketStore()

    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Update selected collateral token when selected token changes in the store
    useEffect(() => {
        if (selectedTokenId && marketTokenMap[selectedTokenId]) {
            const market = marketTokenMap[selectedTokenId]
            setSelectedCollateralToken(market.longToken)
        }
    }, [selectedTokenId, marketTokenMap])

    // Get current market details
    const currentMarket = selectedTokenId ? marketTokenMap[selectedTokenId] : null
    
    // Get token symbol from market name
    const getTokenSymbolFromMarketName = (marketName: string | undefined): string => {
        if (!marketName) return "TOKEN";
        
        // Extract token symbol from market name (e.g., "GTX_WETH_USDC" -> "WETH")
        const parts = marketName.split('_');
        return parts.length >= 2 ? parts[1] : "TOKEN";
    }
    
    // Get current token symbol
    const currentTokenSymbol = currentMarket?.name ? getTokenSymbolFromMarketName(currentMarket.name) : "TOKEN"
    
    // Get decimals for the current token
    const currentTokenDecimals = TOKEN_DECIMALS[currentTokenSymbol as keyof typeof TOKEN_DECIMALS] || TOKEN_DECIMALS.DEFAULT

    // Fetch balance of selected token
    const { data: balance } = useBalance({
        address,
        token: selectedCollateralToken || undefined,
    })

    // Get perpetual order hooks
    const {
        placeMarketIncreaseOrder,
        placeLimitIncreaseOrder,
        placeMarketDecreaseOrder,
        placeLimitDecreaseOrder,
        isOrderPending,
        isOrderConfirming,
        orderHash
    } = usePerpetualPlaceOrder()

    // Update notification transaction hash when it changes
    useEffect(() => {
        if (orderHash) {
            setNotificationTxHash(orderHash)
        }
    }, [orderHash])

    // Use price from Zustand store if available
    const getTokenPrice = (): bigint => {
        if (marketData.price !== null) {
            return BigInt(Math.floor(marketData.price * 1e18))
        }
        
        // Fallback prices if market data is not available
        switch (currentTokenSymbol) {
            case "WETH": return 3000n * 10n ** 18n;
            case "ETH": return 3000n * 10n ** 18n;
            case "WBTC": return 60000n * 10n ** 18n;
            case "BTC": return 60000n * 10n ** 18n;
            case "LINK": return 20n * 10n ** 18n;
            case "DOGE": return 1n * 10n ** 18n;
            case "PEPE": return 1n * 10n ** 18n;
            case "TRUMP": return 1n * 10n ** 18n;
            case "USDC": return 1n * 10n ** 18n;
            default: return 1000n * 10n ** 18n;
        }
    }

    // Calculate order values WITH CORRECT LEVERAGE APPLIED
    const tokenPrice = getTokenPrice()
    const sizeTokenAmount = sizeValue ? parseFloat(sizeValue) : 0

    // Calculate the USD value of the collateral
    const collateralValueUsd = BigInt(Math.floor(sizeTokenAmount * Number(tokenPrice / 10n ** 18n)))

    // Apply leverage to get the true position size
    const sizeDeltaUsd = collateralValueUsd * BigInt(leverage)

    // Order value is the full leveraged position size
    const orderValue = sizeDeltaUsd

    // Margin required is the collateral value
    const marginRequired = collateralValueUsd

    // For limit orders, use the specified price
    const calculatedTriggerPrice = orderType === "limit" && limitPrice
        ? parseUnits(limitPrice, 18)
        : tokenPrice

    // Calculate liquidation price (more accurate calculation with leverage)
    const liquidationPrice = side
        ? tokenPrice * BigInt(100 - Math.floor(90 / leverage)) / 100n
        : tokenPrice * BigInt(100 + Math.floor(90 / leverage)) / 100n

    // Update slider when size changes (but only when input triggered the change)
    useEffect(() => {
        if (changeSource === "input" && balance?.value && sizeValue) {
            const maxSize = parseFloat(formatEther(balance.value))
            const currentSize = parseFloat(sizeValue)
            const percentage = Math.min(Math.floor((currentSize / maxSize) * 100), 100)
            setSliderValue([percentage])
            setChangeSource(null) // Reset source
        }
    }, [sizeValue, balance, changeSource])

    // Update size when slider changes (but only when slider triggered the change)
    useEffect(() => {
        if (changeSource === "slider" && balance?.value) {
            const maxSize = parseFloat(formatEther(balance.value))
            const newSize = (maxSize * sliderValue[0]) / 100
            setSizeValue(newSize.toFixed(6))
            setChangeSource(null) // Reset source
        } else if (changeSource === "slider" && sliderValue[0] === 0) {
            setSizeValue("0")
            setChangeSource(null) // Reset source
        }
    }, [sliderValue, balance, changeSource])

    const handlePlaceOrder = async () => {
        if (!address) {
            // Show error notification instead of toast
            setNotificationMessage("Please connect your wallet first")
            setNotificationSuccess(false)
            setNotificationTxHash(undefined)
            setShowNotification(true)
            return
        }

        if (!currentMarket) {
            setNotificationMessage("No market available")
            setNotificationSuccess(false)
            setNotificationTxHash(undefined)
            setShowNotification(true)
            return
        }

        if (!sizeValue || parseFloat(sizeValue) <= 0) {
            setNotificationMessage("Please enter a valid size")
            setNotificationSuccess(false)
            setNotificationTxHash(undefined)
            setShowNotification(true)
            return
        }

        if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
            setNotificationMessage("Please enter a valid limit price")
            setNotificationSuccess(false)
            setNotificationTxHash(undefined)
            setShowNotification(true)
            return
        }

        try {
            if (!selectedCollateralToken) {
                throw new Error("No collateral token selected")
            }

            const collateralAmount = parseUnits(sizeValue, currentTokenDecimals)

            const orderParams: OrderParams = {
                market: currentMarket.marketToken as HexAddress,
                collateralToken: selectedCollateralToken,
                isLong: side,
                sizeDeltaUsd: sizeDeltaUsd, // Now correctly includes leverage
                collateralAmount: collateralAmount,
                leverage: leverage,
                triggerPrice: calculatedTriggerPrice,
                acceptablePriceImpact: 1, // 1% slippage
                autoCancel: false
            }

            // Prepare notification message
            const actionType = reduceOnly ? "decrease" : "increase"
            const orderTypeText = orderType === "market" ? "Market" : "Limit"
            const sideText = side ? "Long" : "Short"

            // Attempt to place the order
            if (reduceOnly) {
                // For reduce only orders
                if (orderType === "market") {
                    await placeMarketDecreaseOrder(orderParams)
                } else {
                    await placeLimitDecreaseOrder(orderParams)
                }
            } else {
                // For increase positions
                if (orderType === "market") {
                    await placeMarketIncreaseOrder(orderParams)
                } else {
                    await placeLimitIncreaseOrder(orderParams)
                }
            }

            // Show success notification
            setNotificationMessage(`${orderTypeText} ${sideText} order for ${sizeValue} ${currentTokenSymbol} with ${leverage}x leverage placed successfully.`)
            setNotificationSuccess(true)
            setShowNotification(true)

            // Clear form after successful order
            setSizeValue("")
            setLimitPrice("")
            setTpPrice("")
            setSlPrice("")
            setSliderValue([0])
        } catch (error: unknown) {
            console.error("Error placing order:", error)

            // Show error notification
            setNotificationMessage("Failed to place order: " + ((error as Error)?.message || "Unknown error"))
            setNotificationSuccess(false)
            setNotificationTxHash(undefined)
            setShowNotification(true)
        }
    }

    // Find the current market name to display in the header
    const selectedPair = tradingPairs.find(pair => pair.id === selectedTokenId);
    const currentMarketDisplayName = selectedPair?.symbol || "Loading...";

    const areMarketsLoading = !marketData.marketsLoaded;

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
                        <span>Perpetual</span>
                    </div>
                    {isConnected && (
                        <div className="text-sm px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/50 text-gray-300 flex items-center gap-1">
                            <span>{areMarketsLoading ? "Loading..." : currentMarketDisplayName}</span>
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
                        <button
                            onClick={() => { }}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-white">
                            {balance ? formatNumberWithCommas(formatEther(balance.value).slice(0, 8)) : "0.0000"}
                        </div>
                        <div className="text-gray-300 text-sm px-2 py-0.5 bg-gray-800/40 rounded-md border border-gray-700/40">
                            {currentTokenSymbol}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                        <span>Current Position</span>
                        <span>0.0000 {currentTokenSymbol}</span>
                    </div>
                </div>
            </div>

            {/* Order Type and Side Row */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Order Type Selection */}
                <div className="relative">
                    <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1 transition-colors ${orderType === "market" ? "bg-blue-600 text-white" : "bg-transparent text-blue-300 hover:bg-blue-800/50"
                                }`}
                            onClick={() => setOrderType("market")}
                        >
                            <span>Market</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1 transition-colors ${orderType === "limit" ? "bg-blue-600 text-white" : "bg-transparent text-blue-300 hover:bg-blue-800/50"
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
                            className={`flex-1 flex items-center justify-center gap-1 transition-colors ${side ? "bg-emerald-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                                }`}
                            onClick={() => setSide(true)}
                        >
                            <ArrowDown className="w-3 h-3" />
                            <span>Long</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1 transition-colors ${!side ? "bg-rose-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                                }`}
                            onClick={() => setSide(false)}
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

            {/* Form Content */}
            <div className="space-y-2.5">
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
                        <div className="opacity-0">
                            {/* Empty spacer div with same height */}
                        </div>
                    )}
                </div>

                {/* Size Input */}
                <div className="space-y-0.5">
                    <label className="text-sm text-gray-300 flex items-center gap-1 ml-1">
                        <span>Size</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={sizeValue}
                            onChange={(e) => {
                                setSizeValue(e.target.value);
                                setChangeSource("input");
                            }}
                            className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2.5 px-3 pr-24 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-gray-500/50 transition-all"
                            placeholder="0.00"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="relative">
                                <div className="flex items-center gap-1 text-white text-sm bg-gray-800 px-2 py-0.5 rounded border border-gray-700/40">
                                    {currentTokenSymbol}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slider */}
                <div className="flex w-full gap-4 items-center">
                    <div className="flex-1">
                        <PercentageSlider
                            value={sliderValue[0]}
                            onChange={(val) => {
                                setSliderValue([val]);
                                setChangeSource("slider");
                            }}
                            onCommit={(val) => {
                                setSliderValue([val]);
                                setChangeSource("slider");
                            }}
                            activeColor={side ? "bg-emerald-500/70" : "bg-rose-500/70"}
                            thumbColor={side ? "bg-emerald-500" : "bg-rose-500"}
                        />
                    </div>
                    <div className="flex items-center bg-gray-900/40 rounded-lg px-2.5 py-1.5 border border-gray-700/50">
                        <input
                            type="number"
                            max={100}
                            value={sliderValue[0]}
                            onChange={(e) => {
                                const newValue = Math.min(Math.max(0, Number(e.target.value)), 100);
                                setSliderValue([newValue]);
                                setChangeSource("slider");
                            }}
                            className="w-7 text-left bg-transparent outline-none text-white text-sm"
                        />
                        <span className="ml-0.5 text-sm text-gray-300">%</span>
                    </div>
                </div>
            </div>

            {/* Submit Button with glow effect */}
            <div className="relative mt-4 group">
                <div
                    className={`absolute inset-0 rounded-lg blur-md transition-opacity group-hover:opacity-100 ${side ? "bg-emerald-500/30" : "bg-rose-500/30"
                        } ${isOrderPending || isOrderConfirming || !isConnected ? "opacity-0" : "opacity-50"}`}
                ></div>
                <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className={`relative w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${side
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        } ${isOrderPending || isOrderConfirming || !isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isOrderPending || isOrderConfirming || !isConnected}
                >
                    {isOrderPending || isOrderConfirming ? (
                        <div className="flex items-center justify-center gap-1.5">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5">
                            {side ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                            <span>{side ? "Buy / Long" : "Sell / Short"}</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Order Information */}
            <div className="flex flex-col gap-1.5 border-t border-gray-800 pt-3 mt-3">
                <div className="flex justify-between text-[0.72rem]">
                    <span className="text-gray-400">Mark Price</span>
                    <span className="text-white">${marketData.price !== null ? marketData.price.toFixed(2) : "---"}</span>
                </div>
                <div className="flex justify-between text-[0.72rem]">
                    <span className="text-gray-400">Liquidation Price</span>
                    <span className="text-white">{Number(liquidationPrice) > 0 ? `$${(Number(liquidationPrice) / 1e18).toFixed(2)}` : "N/A"}</span>
                </div>
                <div className="flex justify-between text-[0.72rem]">
                    <span className="text-gray-400">Order Value</span>
                    <span className="text-white">${(Number(orderValue) / 1e18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[0.72rem]">
                    <span className="text-gray-400">Margin Required</span>
                    <span className="text-white">${(Number(marginRequired) / 1e18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[0.72rem]">
                    <span className="text-gray-400">Funding Rate</span>
                    <span className={`${marketData.fundingRate !== null && marketData.fundingRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {marketData.fundingRate !== null
                            ? `${marketData.fundingRate >= 0 ? '+' : ''}${(marketData.fundingRate * 100).toFixed(4)}%`
                            : "---"}
                    </span>
                </div>
                <div className="flex justify-between text-[0.72rem]">
                    <span className="text-gray-400">Fees</span>
                    <span className="text-white">0.0350% / 0.0100%</span>
                </div>
            </div>

            {/* Notification Dialog */}
            <NotificationDialog
                isOpen={showNotification}
                onClose={() => setShowNotification(false)}
                message={notificationMessage}
                isSuccess={notificationSuccess}
                txHash={notificationTxHash}
                explorerBaseUrl="https://testnet.monadexplorer.com/tx/"
            />
        </div>
    )
}

export default PerpetualPlaceOrder