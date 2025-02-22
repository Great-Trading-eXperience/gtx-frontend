'use client'

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from "wagmi"
import ChartComponent from "./chart/chart"
import MarketDataWidget from "./market-widget/market-widget"
import TradingPosition from "./trading-position/trading-position"
import BuyAndSellComponent from "./market/buy-and-sell"
import { Button } from "../ui/button"
import { Moon, Sun } from 'lucide-react'
import Link from "next/link"
import MarketDataTabs from "./market-data-tabs/market-data-tabs"

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

export default function TradingLayout() {
    const { theme, setTheme } = useTheme();

    const { connectors, connect } = useConnect();
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: ensName } = useEnsName({ address });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

    const queryClient = new QueryClient();

    

    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }
    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-white dark:bg-[#303030] text-gray-900 dark:text-white">
                <header className="px-2 py-3 dark:bg-gray-900 shadow-xl transition-colors duration-200">
                    <div className="flex items-center justify-between">
                        <div className="w-full flex items-center justify-between space-x-2">
                            <div className="flex items-center gap-4">
                                <Link href="/" className="flex items-center space-x-1">
                                    <img
                                        src={"dark" === theme ? "/logo/gtx-white.png" : "/logo/gtx-blue.png"}
                                        className="h-8"
                                        alt="GTX Logo"
                                    />
                                    <span className="text-2xl text-[#0064A7] dark:text-white font-bold pl-1">GTX</span>
                                </Link>
                            </div>

                            {/* Center - Navigation */}
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/spot"
                                    className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                                >
                                    Spot
                                </Link>
                                <Link
                                    href="/perpetual"
                                    className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                                >
                                    Perpetual
                                </Link>
                                <Link
                                    href="/earn"
                                    className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                                >
                                    Earn
                                </Link>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="text-gray-600 dark:text-gray-200"
                                >
                                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </Button>
                                <div className="">
                                    <ConnectButton />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] py-[4px]">
                    <div className="">
                        <div className="shadow-lg rounded-lg">
                            <MarketDataWidget />
                            <ChartComponent />
                        </div>
                        <TradingPosition />
                    </div>

                    <div className="space-y-[6px]">
                        {/* <OrderBookComponent />
                        <RecentTradesComponent /> */}
                        <MarketDataTabs />
                    </div>

                    <div className="space-y-2">
                        <BuyAndSellComponent />
                    </div>
                </div>

                {/* <OrderManagement /> */}
            </div>
        </QueryClientProvider>
    )
}

// Update chart