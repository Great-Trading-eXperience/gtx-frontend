"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, AlertCircle } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { parseEther, parseUnits, formatEther } from "viem"
import { useAccount, useBalance } from "wagmi"
import { HexAddress } from "@/types/web3/general/address"
import { usePerpetualPlaceOrder } from "@/hooks/web3/gtx/perpetual/usePerpetualPlaceOrder"
import {
    PERPETUAL_MARKET_ADDRESS,
    PERPETUAL_ORDER_VAULT_ADDRESS,
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

const BuyAndSellComponent = ({ type, side }: { type: string; side: string }) => {
    const { address } = useAccount()
    const [sizeValue, setSizeValue] = useState<string>("")
    const [sliderValue, setSliderValue] = useState([0])
    const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0])
    const [showTPSL, setShowTPSL] = useState(false)
    const [reduceOnly, setReduceOnly] = useState(false)
    const [limitPrice, setLimitPrice] = useState<string>("")
    const [tpPrice, setTpPrice] = useState<string>("")
    const [slPrice, setSlPrice] = useState<string>("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [leverage, setLeverage] = useState(1) // Default 1x leverage
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
    const calculatedTriggerPrice = type === "limit" && limitPrice
        ? parseUnits(limitPrice, 18)
        : tokenPrice * 10n ** 18n
        
    // Calculate liquidation price (more accurate calculation with leverage)
    const liquidationPrice = side === "buy"
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
        
        if (type === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
            toast.error("Please enter a valid limit price")
            return
        }
        
        try {
            const collateralAmount = parseUnits(sizeValue, selectedToken.decimals)
            
            const orderParams: OrderParams = {
                market: PERPETUAL_MARKET_ADDRESS,
                collateralToken: selectedToken.address,
                isLong: side === "buy",
                sizeDeltaUsd: sizeDeltaUsd, // Now correctly includes leverage
                collateralAmount: collateralAmount,
                leverage: leverage,
                triggerPrice: calculatedTriggerPrice,
                acceptablePriceImpact: 1, // 1% slippage
                autoCancel: false
            }

            if (reduceOnly) {
                // For reduce only orders
                if (type === "market") {
                    await placeMarketDecreaseOrder(orderParams)
                } else {
                    await placeLimitDecreaseOrder(orderParams)
                }
            } else {
                // For increase positions
                if (type === "market") {
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
        <div className="flex flex-col justify-between min-h-[562px] bg-[#111827] text-white p-4 rounded-b-lg">
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-row justify-between">
                    <span className="text-gray-400">Available to Trade</span>
                    <span>{balance ? formatEther(balance.value).slice(0, 8) : "0.00"} {selectedToken.symbol}</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-gray-400">Current Position</span>
                    <span>0.0000 {selectedToken.symbol}</span>
                </div>
                
                {/* Leverage slider */}
                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Leverage</span>
                        <span>{leverage}x</span>
                    </div>
                    <Slider 
                        defaultValue={[1]} 
                        min={1} 
                        max={10} 
                        step={1} 
                        value={[leverage]}
                        onValueChange={(val) => setLeverage(val[0])} 
                        className="flex-1" 
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>1x</span>
                        <span>5x</span>
                        <span>10x</span>
                    </div>
                </div>
                
                {type === "limit" && (
                    <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                        <span className="text-gray-400">Price (USD)</span>
                        <div className="flex items-center ml-auto">
                            <input 
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-24 text-right bg-transparent outline-none" 
                                placeholder="0.00" 
                            />
                            <span className="text-[#0064A7] ml-2">Mid</span>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                    <span className="text-gray-400">Size</span>
                    <div className="flex items-center ml-auto">
                        <input 
                            type="number"
                            value={sizeValue}
                            onChange={(e) => setSizeValue(e.target.value)}
                            className="w-24 text-right bg-transparent outline-none" 
                            placeholder="0.00" 
                        />
                        <div className="relative">
                            {isClient && (
                                <button 
                                    className="flex items-center gap-1 ml-2 text-white"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {selectedToken.symbol}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            )}
                            
                            {isClient && isDropdownOpen && (
                                <div className="absolute right-0 mt-1 bg-[#19202F] border border-gray-700 rounded-md shadow-lg z-10">
                                    {SUPPORTED_TOKENS.map((token) => (
                                        <div 
                                            key={token.symbol}
                                            className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
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
                
                <div className="flex w-full gap-2 items-center">
                    <Slider 
                        value={sliderValue}
                        max={100} 
                        step={1} 
                        className="flex-1" 
                        onValueChange={setSliderValue}
                    />
                    <div className="flex items-center bg-[#19202F] rounded-lg px-3 py-1.5">
                        <input
                            type="number"
                            max={100}
                            value={sliderValue[0]}
                            onChange={(e) => setSliderValue([Number(e.target.value)])}
                            className="w-8 text-right bg-transparent outline-none"
                        />
                        <span className="ml-1">%</span>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="reduce" 
                            checked={reduceOnly}
                            onCheckedChange={(checked) => setReduceOnly(checked === true)}
                            className="border border-white bg-white" 
                        />
                        <label htmlFor="reduce" className="text-sm font-medium leading-none">
                            Reduce Only
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="stop-loss" 
                            checked={showTPSL} 
                            onCheckedChange={(checked) => setShowTPSL(checked === true)} 
                            className="border border-white bg-white" 
                        />
                        <label htmlFor="stop-loss" className="text-sm font-medium leading-none">
                            Take Profit / Stop Loss
                        </label>
                    </div>
                    
                    {showTPSL && (
                        <div className="space-y-2 pt-4 mt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                                    <input 
                                        type="number" 
                                        placeholder="TP Price" 
                                        value={tpPrice}
                                        onChange={(e) => setTpPrice(e.target.value)}
                                        className="w-full bg-transparent outline-none" 
                                    />
                                </div>
                                <button className="flex items-center justify-between w-full bg-[#19202F] rounded-lg px-4 py-1">
                                    <span>Gain</span>
                                    <div className="flex items-center gap-1">
                                        <span>%</span>
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                                    <input 
                                        type="number" 
                                        placeholder="SL Price" 
                                        value={slPrice}
                                        onChange={(e) => setSlPrice(e.target.value)}
                                        className="w-full bg-transparent outline-none" 
                                    />
                                </div>
                                <button className="flex items-center justify-between w-full bg-[#19202F] rounded-lg px-4 py-1">
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
            </div>
            
            <div className="space-y-3">
                <button
                    className={`w-full text-center font-medium py-2 rounded-lg ${
                        side === "buy"
                            ? "bg-[#0064A7] text-white hover:bg-[#0064A7]/90"
                            : "bg-[#ff5d6e] text-white hover:bg-[#ff5d6e]/90"
                    } ${(isOrderPending || isOrderConfirming) ? "opacity-70 cursor-not-allowed" : ""}`}
                    onClick={handlePlaceOrder}
                    disabled={isOrderPending || isOrderConfirming}
                >
                    {isOrderPending || isOrderConfirming ? (
                        "Processing..."
                    ) : (
                        side === "buy" ? "Buy / Long" : "Sell / Short"
                    )}
                </button>
                
                <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Liquidation Price</span>
                        <span>{Number(liquidationPrice) > 0 ? `$${(Number(liquidationPrice) / 1e18).toFixed(2)}` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Order Value</span>
                        <span>${(Number(orderValue) / 1e18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Margin Required</span>
                        <span>${(Number(marginRequired) / 1e18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Fees</span>
                        <span>0.0350% / 0.0100%</span>
                    </div>
                    {leverage > 5 && (
                        <div className="flex items-center text-amber-500 text-sm mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>High leverage increases liquidation risk</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const TradingTabs = () => {
    const { isConnected } = useAccount()
    
    return (
        <div>
            {!isConnected && (
                <div className="p-4 mb-4 bg-amber-900/30 text-amber-400 rounded-lg">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>Please connect your wallet to trade</span>
                    </div>
                </div>
            )}
            
            <Tabs defaultValue="market" className="w-full bg-[#111827] rounded-lg">
                <TabsList className="flex rounded-t-lg w-full bg-[#111827] border-b border-[#19202F]">
                    <TabsTrigger
                        value="market"
                        className="flex-1 py-2 text-base data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#0064A7] text-gray-400 hover:text-gray-200"
                    >
                        Market
                    </TabsTrigger>
                    <TabsTrigger
                        value="limit"
                        className="flex-1 py-2 text-base data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#0064A7] text-gray-400 hover:text-gray-200"
                    >
                        Limit
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="market" className="mt-3">
                    <Tabs defaultValue="buy" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-[#111827]">
                            <TabsTrigger
                                value="buy"
                                className="rounded-md data-[state=active]:bg-[#0064A7] data-[state=active]:text-white"
                            >
                                Buy / Long
                            </TabsTrigger>
                            <TabsTrigger value="sell" className="rounded-md data-[state=active]:bg-[#ff5d6e]">
                                Sell / Short
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="buy">
                            <BuyAndSellComponent type="market" side="buy" />
                        </TabsContent>
                        <TabsContent value="sell">
                            <BuyAndSellComponent type="market" side="sell" />
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="limit" className="mt-0">
                    <Tabs defaultValue="buy" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-[#111827]">
                            <TabsTrigger
                                value="buy"
                                className="rounded-md data-[state=active]:bg-[#0064A7] data-[state=active]:text-white"
                            >
                                Buy / Long
                            </TabsTrigger>
                            <TabsTrigger value="sell" className="rounded-md data-[state=active]:bg-[#ff5d6e]">
                                Sell / Short
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="buy">
                            <BuyAndSellComponent type="limit" side="buy" />
                        </TabsContent>
                        <TabsContent value="sell">
                            <BuyAndSellComponent type="limit" side="sell" />
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default TradingTabs