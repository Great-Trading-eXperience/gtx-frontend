"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

const BuyAndSellComponent = ({ type, side }: { type: string; side: string }) => {
    const [value, setValue] = useState([0])
    const [selectedToken, setSelectedToken] = useState("ETH")
    const [showTPSL, setShowTPSL] = useState(false)

    return (
        <div className="flex flex-col justify-between min-h-[562px] bg-[#111827] text-white p-4 rounded-b-lg">
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-row justify-between">
                    <span className="text-gray-400">Available to Trade</span>
                    <span>0.00</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-gray-400">Current Position</span>
                    <span>0.0000 ETH</span>
                </div>
                {type === "limit" && (
                    <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                        <span className="text-gray-400">Price (USD)</span>
                        <div className="flex items-center ml-auto">
                            <input type="number" className="w-24 text-right bg-transparent outline-none" placeholder="0.00" />
                            <span className="text-[#0064A7] ml-2">Mid</span>
                        </div>
                    </div>
                )}
                <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                    <span className="text-gray-400">Size</span>
                    <div className="flex items-center ml-auto">
                        <input type="number" className="w-24 text-right bg-transparent outline-none" placeholder="0.00" />
                        <button className="flex items-center gap-1 ml-2 text-white">
                            {selectedToken}
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="flex w-full gap-2 items-center">
                    <Slider defaultValue={value} max={100} step={1} className="flex-1" onValueChange={setValue} />
                    <div className="flex items-center bg-[#19202F] rounded-lg px-3 py-1.5">
                        <input
                            type="number"
                            max={100}
                            value={value[0]}
                            onChange={(e) => setValue([Number(e.target.value)])}
                            className="w-8 text-right bg-transparent outline-none"
                        />
                        <span className="ml-1">%</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="reduce" className="border border-white bg-white" />
                        <label htmlFor="reduce" className="text-sm font-medium leading-none">
                            Reduce Only
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="stop-loss" checked={showTPSL} onCheckedChange={(checked) => setShowTPSL(checked === true)} className="border border-white bg-white" />
                        <label htmlFor="stop-loss" className="text-sm font-medium leading-none">
                            Take Profit / Stop Loss
                        </label>
                    </div>
                    {showTPSL && (
                        <div className="space-y-2 pt-4 mt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-row items-center w-full bg-[#19202F] rounded-lg px-4 py-1">
                                    <input type="number" placeholder="TP Price" className="w-full bg-transparent outline-none" />
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
                                    <input type="number" placeholder="SL Price" className="w-full bg-transparent outline-none" />
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
            <div className="space-y-0">
                <button
                    className={`w-full text-center font-medium py-2 rounded-lg ${side === "buy"
                            ? "bg-[#0064A7] text-white hover:bg-[#0064A7]/90"
                            : "bg-[#ff5d6e] text-white hover:bg-[#ff5d6e]/90"
                        }`}
                >
                    {side === "buy" ? "Buy / Long" : "Sell / Short"}
                </button>
                <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Liquidation Price</span>
                        <span>N/A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Order Value</span>
                        <span>N/A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Margin Required</span>
                        <span>N/A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Fees</span>
                        <span>0.0350% / 0.0100%</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

const TradingTabs = () => {
    return (
        <div>
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

