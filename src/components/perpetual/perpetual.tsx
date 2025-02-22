'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Maximize2, Camera, Sun, Moon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useTheme } from "next-themes"
import useCurrentTheme from "@/hooks/styles/theme"
import Market from "./market/market"
import TradingView from "./trading-view/trading-view"
import RecentTradesPrep from "./recent-trades-prep/recent-trades-prep"
import OrderBookPrep from "./order-book-prep/order-book-prep"
import BuyAndSell from "./buy-and-sell/buy-and-sell"
import TradingPosition from "./trading-position/trading-position"
import TradingTabs from "./buy-and-sell/buy-and-sell"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from "wagmi"
import { QueryClient } from "@tanstack/react-query"
import { ConnectButton } from "@rainbow-me/rainbowkit"

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

export default function Perpetual() {
    const { theme, setTheme } = useTheme();
    const currentTheme = useCurrentTheme();

    const { connectors, connect } = useConnect();
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: ensName } = useEnsName({ address });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

    const queryClient = new QueryClient();

    const changeTheme = () => {
        setTheme(currentTheme === "dark" ? "light" : "dark");
    };

    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }
    return (
        <div className="min-h-screen bg-[#303030] text-white">
            <header className="px-2 py-3 dark:bg-gray-900 shadow-xl transition-colors duration-200">
                <div className="flex items-center justify-between">
                    <div className="w-full flex items-center justify-between space-x-2">
                        {/* Left side - Logo */}
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center space-x-1">
                                <img
                                    src={theme === "dark" ? "/logo/gtx-white.png" : "/logo/gtx-blue.png"}
                                    className="h-8"
                                    alt="GTX Logo"
                                />
                                <span className="text-2xl text-[#0064A7] dark:text-white font-bold pl-1">
                                    GTX
                                </span>
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

                        {/* Right side - Theme toggle and Connect button */}
                        <div className="flex items-center gap-4">
                            <div className="">
                                <ConnectButton />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-[1fr_300px_300px] gap-[3px] px-[2px] py-[3px]">
                <div className="space-y-[3px]">
                    <Market />
                    <TradingView />
                </div>

                <div className="space-y-2">
                    <Tabs defaultValue="order-book" className="w-full">
                        <TabsList className="flex rounded-t-lg w-full bg-[#111827] border-b border-[#303030]">
                            <TabsTrigger
                                value="order-book"
                                className="flex-1 py-2 text-base data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#0064A7] text-gray-400 hover:text-gray-200"
                            >
                                Order Book
                            </TabsTrigger>
                            <TabsTrigger
                                value="recent-trades"
                                className="flex-1 py-2 text-base data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#0064A7] text-gray-400 hover:text-gray-200"
                            >
                                Trades
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="order-book" className="mt-0">
                            <OrderBookPrep />
                        </TabsContent>
                        <TabsContent value="recent-trades" className="mt-0">
                            <RecentTradesPrep />
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-2">
                    <TradingTabs />
                </div>
            </div>

            <TradingPosition />
        </div>
    )
}