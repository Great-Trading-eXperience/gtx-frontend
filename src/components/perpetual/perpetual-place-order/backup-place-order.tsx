"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, AlertCircle, ChevronDown, Wallet, Layers, BarChart3, RefreshCw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { parseEther, parseUnits, formatEther } from "viem"
import { useAccount, useBalance } from "wagmi"
import { HexAddress } from "@/types/web3/general/address"
import { usePerpetualPlaceOrder } from "@/hooks/web3/gtx/perpetual/usePerpetualPlaceOrder"
import { LeverageDialog, LeverageBadge } from "./leverage-dialog"
import {
    PERPETUAL_MARKET_ADDRESS,
} from "@/constants/contract-address"

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

// Supported tokens config
const SUPPORTED_TOKENS: TokenInfo[] = [
    { symbol: "WETH", address: "0x97f3d75FcC683c8F557D637196857FA303f7cebd" as HexAddress, decimals: 18 },
    { symbol: "USDC", address: "0x37e9b288c56B734c0291d37af478F60cE58a9Fc6" as HexAddress, decimals: 6 }
]

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
    const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0])
    const [showTPSL, setShowTPSL] = useState(false)
    const [reduceOnly, setReduceOnly] = useState(false)
    const [limitPrice, setLimitPrice] = useState<string>("")
    const [tpPrice, setTpPrice] = useState<string>("")
    const [slPrice, setSlPrice] = useState<string>("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [leverage, setLeverage] = useState(10) // Default 10x leverage
    const [isClient, setIsClient] = useState(false)
    
    // Set isClient to true when component mounts (client-side only)
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Fetch balance of selected token
    const { data: balance } = useBalance({
        address,
        token: selectedToken.address,
    })

    // Get perpetual order hooks
    const {
        placeMarketIncreaseOrder,
        placeLimitIncreaseOrder,
        placeMarketDecreaseOrder,
        placeLimitDecreaseOrder,
        isOrderPending,
        isOrderConfirming
    } = usePerpetualPlaceOrder()

    // Default prices for tokens - in a real app, you'd fetch these from an API
    const getTokenPrice = (symbol: string): bigint => {
        switch (symbol) {
            case "WETH": return 3000n;
            case "USDC": return 1n;
            default: return 0n;
        }
    }

    // Calculate order values WITH CORRECT LEVERAGE APPLIED
    const tokenPrice = getTokenPrice(selectedToken.symbol)
    const sizeTokenAmount = sizeValue ? parseFloat(sizeValue) : 0
    
    // Calculate the USD value of the collateral
    const collateralValueUsd = BigInt(Math.floor(sizeTokenAmount * Number(tokenPrice) * 1e18))
    
    // Apply leverage to get the true position size
    const sizeDeltaUsd = collateralValueUsd * BigInt(leverage)
    
    // Order value is the full leveraged position size
    const orderValue = sizeDeltaUsd
    
    // Margin required is the collateral value
    const marginRequired = collateralValueUsd
    
    // For limit orders, use the specified price
    const calculatedTriggerPrice = orderType === "limit" && limitPrice
        ? parseUnits(limitPrice, 18)
        : tokenPrice * 10n ** 18n
        
    // Calculate liquidation price (more accurate calculation with leverage)
    const liquidationPrice = side
        ? tokenPrice * BigInt(100 - Math.floor(90 / leverage)) / 100n
        : tokenPrice * BigInt(100 + Math.floor(90 / leverage)) / 100n

    // Update slider when size changes
    useEffect(() => {
        if (balance?.value && sizeValue) {
            const maxSize = parseFloat(formatEther(balance.value))
            const currentSize = parseFloat(sizeValue)
            const percentage = Math.min(Math.floor((currentSize / maxSize) * 100), 100)
            setSliderValue([percentage])
        }
    }, [sizeValue, balance])

    // Update size when slider changes
    useEffect(() => {
        if (balance?.value && sliderValue[0] > 0) {
            const maxSize = parseFloat(formatEther(balance.value))
            const newSize = (maxSize * sliderValue[0]) / 100
            setSizeValue(newSize.toFixed(6))
        }
    }, [sliderValue, balance])

    const handleTokenSelect = (token: TokenInfo) => {
        setSelectedToken(token)
        setIsDropdownOpen(false)
    }

    const handlePlaceOrder = async () => {
        if (!address) {
            toast.error("Please connect your wallet first")
            return
        }
        
        if (!sizeValue || parseFloat(sizeValue) <= 0) {
            toast.error("Please enter a valid size")
            return
        }
        
        if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
            toast.error("Please enter a valid limit price")
            return
        }
        
        try {
            const collateralAmount = parseUnits(sizeValue, selectedToken.decimals)
            
            const orderParams: OrderParams = {
                market: PERPETUAL_MARKET_ADDRESS,
                collateralToken: selectedToken.address,
                isLong: side,
                sizeDeltaUsd: sizeDeltaUsd, // Now correctly includes leverage
                collateralAmount: collateralAmount,
                leverage: leverage,
                triggerPrice: calculatedTriggerPrice,
                acceptablePriceImpact: 1, // 1% slippage
                autoCancel: false
            }

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
            
            // Clear form after successful order
            setSizeValue("")
            setLimitPrice("")
            setTpPrice("")
            setSlPrice("")
            setSliderValue([0])
        } catch (error: unknown) {
            console.error("Error placing order:", error)
            toast.error("Failed to place order: " + ((error as Error)?.message || "Unknown error"))
        }
    }

    return (
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl p-5 max-w-md mx-auto border border-gray-700/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-sm">
            {/* Header with glowing effect */}
            <div className="relative mb-6">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gray-500/20 rounded-full blur-xl"></div>
                <h2 className="text-2xl font-bold text-white flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        <Layers className="w-6 h-6 text-gray-400" />
                        <span>Perpetual</span>
                    </div>
                    {isConnected && (
                        <div className="text-sm px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 text-gray-300 flex items-center gap-1.5">
                            <span>{selectedToken.symbol}/USDC</span>
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    )}
                </h2>
            </div>

            {/* Balance Row */}
            <div className="flex flex-col w-full gap-4 mb-5">
                {isConnected && (
                    <div className="bg-gray-900/30 rounded-lg border border-gray-700/40 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-300 flex items-center gap-1.5">
                                <Wallet className="w-4 h-4" />
                                <span>Available to Trade</span>
                            </h3>
                            <button
                                onClick={() => {}}
                                className="text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-white">
                                {balance ? formatNumberWithCommas(formatEther(balance.value).slice(0, 8)) : "0.0000"}
                            </div>
                            <div className="text-gray-300 text-sm px-2 py-0.5 bg-gray-800/40 rounded-md border border-gray-700/40">
                                {selectedToken.symbol}
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                            <span>Current Position</span>
                            <span>0.0000 {selectedToken.symbol}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Type and Side Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Order Type Selection */}
                <div className="relative">
                    <div className="flex h-11 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                                orderType === "market" ? "bg-blue-600 text-white" : "bg-transparent text-blue-300 hover:bg-blue-800/50"
                            }`}
                            onClick={() => setOrderType("market")}
                        >
                            <span>Market</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
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
                    <div className="flex h-11 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                                side ? "bg-emerald-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                            }`}
                            onClick={() => setSide(true)}
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>Long</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                                !side ? "bg-rose-600 text-white" : "bg-transparent text-gray-300 hover:bg-gray-800/50"
                            }`}
                            onClick={() => setSide(false)}
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>Short</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Leverage section */}
            <div className="flex items-center justify-between mb-4 px-1">
                <LeverageDialog leverage={leverage} setLeverage={setLeverage} maxLeverage={20} />
                <div className="text-gray-400 text-sm">
                  Cross
                </div>
            </div>

            {/* Form Content */}
            <div className="space-y-4">
                {/* Limit Price - Only for Limit Orders */}
                {orderType === "limit" && (
                    <div className="space-y-1">
                        <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
                            <span>Price (USD)</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-3 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
                                placeholder="0.00" 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
                                USDC
                            </div>
                        </div>
                    </div>
                )}

                {/* Size Input */}
                <div className="space-y-1">
                    <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
                        <span>Size</span>
                    </label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={sizeValue}
                            onChange={(e) => setSizeValue(e.target.value)}
                            className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-3 px-3 pr-24 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
                            placeholder="0.00" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="relative">
                                {isClient && (
                                    <button 
                                        className="flex items-center gap-1 text-white text-sm bg-gray-800/60 px-2 py-1 rounded border border-gray-700/40"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        {selectedToken.symbol}
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                )}
                                
                                {isClient && isDropdownOpen && (
                                    <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                                        {SUPPORTED_TOKENS.map((token) => (
                                            <div 
                                                key={token.symbol}
                                                className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-gray-300"
                                                onClick={() => handleTokenSelect(token)}
                                            >
                                                {token.symbol}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slider */}
                <div className="flex w-full gap-2 items-center">
                    <Slider 
                        value={sliderValue}
                        max={100} 
                        step={1} 
                        className="flex-1" 
                        onValueChange={setSliderValue}
                    />
                    <div className="flex items-center bg-gray-900/40 rounded-lg px-3 py-1.5 border border-gray-700/50">
                        <input
                            type="number"
                            max={100}
                            value={sliderValue[0]}
                            onChange={(e) => setSliderValue([Number(e.target.value)])}
                            className="w-8 text-right bg-transparent outline-none text-white"
                        />
                        <span className="ml-1 text-gray-300">%</span>
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="reduce" 
                            checked={reduceOnly}
                            onCheckedChange={(checked) => setReduceOnly(checked === true)}
                            className="border border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                        />
                        <label htmlFor="reduce" className="text-sm font-medium leading-none text-gray-300">
                            Reduce Only
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="stop-loss" 
                            checked={showTPSL} 
                            onCheckedChange={(checked) => setShowTPSL(checked === true)} 
                            className="border border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                        />
                        <label htmlFor="stop-loss" className="text-sm font-medium leading-none text-gray-300">
                            Take Profit / Stop Loss
                        </label>
                    </div>
                </div>
                
                {/* TP/SL Fields */}
                {showTPSL && (
                    <div className="space-y-2 pt-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-row items-center w-full bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/50">
                                <input 
                                    type="number" 
                                    placeholder="TP Price" 
                                    value={tpPrice}
                                    onChange={(e) => setTpPrice(e.target.value)}
                                    className="w-full bg-transparent outline-none text-white text-sm" 
                                />
                            </div>
                            <button className="flex items-center justify-between w-full bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/50 text-gray-300 text-sm">
                                <span>Gain</span>
                                <div className="flex items-center gap-1">
                                    <span>%</span>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-row items-center w-full bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/50">
                                <input 
                                    type="number" 
                                    placeholder="SL Price" 
                                    value={slPrice}
                                    onChange={(e) => setSlPrice(e.target.value)}
                                    className="w-full bg-transparent outline-none text-white text-sm" 
                                />
                            </div>
                            <button className="flex items-center justify-between w-full bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/50 text-gray-300 text-sm">
                                <span>Loss</span>
                                <div className="flex items-center gap-1">
                                    <span>%</span>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Button with glow effect */}
            <div className="relative mt-6 group">
                <div
                    className={`absolute inset-0 rounded-lg blur-md transition-opacity group-hover:opacity-100 ${
                        side ? "bg-emerald-500/30" : "bg-rose-500/30"
                    } ${isOrderPending || isOrderConfirming || !isConnected ? "opacity-0" : "opacity-50"}`}
                ></div>
                <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className={`relative w-full py-3.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        side
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            : "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    } ${isOrderPending || isOrderConfirming || !isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isOrderPending || isOrderConfirming || !isConnected}
                >
                    {isOrderPending || isOrderConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            {side ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                            <span>{side ? "Buy / Long" : "Sell / Short"}</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Order Information */}
            <div className="flex flex-col gap-2 border-t border-gray-800 pt-4 mt-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Liquidation Price</span>
                    <span className="text-white">{Number(liquidationPrice) > 0 ? `$${(Number(liquidationPrice) / 1e18).toFixed(2)}` : "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Value</span>
                    <span className="text-white">${(Number(orderValue) / 1e18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Margin Required</span>
                    <span className="text-white">${(Number(marginRequired) / 1e18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fees</span>
                    <span className="text-white">0.0350% / 0.0100%</span>
                </div>
                {leverage >= 15 && (
                    <div className="flex items-center text-amber-500 text-sm mt-2 bg-amber-500/10 rounded-lg p-2 border border-amber-500/30">
                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>High leverage increases liquidation risk</span>
                    </div>
                )}
            </div>

            {!isConnected && (
                <div className="mt-4 p-3 bg-amber-500/10 text-amber-400 rounded-lg text-sm border border-amber-500/30 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Please connect your wallet to trade</span>
                </div>
            )}
        </div>
    )
}

export default PerpetualPlaceOrder