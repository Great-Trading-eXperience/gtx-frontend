'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from "wagmi"
import ChartComponent from "./chart/chart"
import MarketDataWidget from "./market-widget/market-widget"
import TradingPosition from "./trading-position/trading-position"
import PlaceOrder from "./place-order/place-order"
import { Button } from "../ui/button"
import { Moon, Sun } from 'lucide-react'
import Link from "next/link"
import MarketDataTabs from "./market-data-tabs/market-data-tabs"
import { ButtonConnectWallet } from "../button-connect-wallet.tsx/button-connect-wallet"

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

                <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] py-[4px]">
                    <div className="">
                        <div className="shadow-lg rounded-lg">
                            {/* <MarketDataWidget /> */}
                            {/* <ChartComponent /> */}
                        </div>
                        {/* <TradingPosition /> */}
                    </div>

                    <div className="space-y-[6px]">
                        {/* <OrderBookComponent />
                        <RecentTradesComponent /> */}
                        <MarketDataTabs />
                    </div>

                    <div className="space-y-2">
                        <PlaceOrder />
                    </div>
                </div>

                {/* <OrderManagement /> */}
            </div>
        </QueryClientProvider>
    )
}

// Update chart