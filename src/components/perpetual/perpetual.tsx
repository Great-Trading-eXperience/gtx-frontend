'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import useCurrentTheme from "@/hooks/styles/theme"
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from "wagmi"

import TradingPosition from "./perpetual-history/perpetual-history"
import PerpetualPlaceOrder from "./perpetual-place-order/perpetual-place-order"
import PerpetualMarketDataTabs from "./perpetual-market-data-tabs/perpetual-market-data-tabs"
import GradientLoader from "../gradient-loader/gradient-loader"
import PerpetualChartComponent from "./perpetual-chart/perpetual-chart"
import PerpetualMarket from "./perpetual-market/perpetual-market"
import PerpetualHistory from "./perpetual-history/perpetual-history"

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

export default function Perpetual() {
    // Create QueryClient instance inside component to ensure it's 
    // created on the client side, not during server-side rendering
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: true,
                staleTime: 5000,
            },
        },
    }));

    const { theme, setTheme } = useTheme();
    const currentTheme = useCurrentTheme();

    const { connectors, connect } = useConnect();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: ensName } = useEnsName({ address });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showConnectionLoader, setShowConnectionLoader] = useState(false);
    const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

    // Handle component mounting
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Debug effect to monitor selectedPoolId changes
    useEffect(() => {
        console.log(`selectedPoolId changed to: ${selectedPoolId || 'null'}`);
    }, [selectedPoolId]);

    // Handle wallet connection state changes
    useEffect(() => {
        if (mounted) {
            // Only handle connection changes after mounting
            if (isConnected && !previousConnectionState) {
                setShowConnectionLoader(true);
                const timer = setTimeout(() => {
                    setShowConnectionLoader(false);
                }, 2000); // Show for 2 seconds
                return () => clearTimeout(timer);
            }
            setPreviousConnectionState(isConnected);
        }
    }, [isConnected, previousConnectionState, mounted]);

    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }

    // Show connection loading state only when transitioning from disconnected to connected
    if (showConnectionLoader) {
        return <GradientLoader />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-950 text-white">
                <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px]">
                    <div className="shadow-lg rounded-lg border border-gray-700/20">
                        <PerpetualMarket />
                        <PerpetualChartComponent />
                    </div>

                    <div className="space-y-[6px]">
                        <PerpetualMarketDataTabs />
                    </div>

                    <div className="space-y-2">
                        <PerpetualPlaceOrder />
                    </div>
                </div>

                <div className="mt-[4px]">
                    <PerpetualHistory />
                </div>
            </div>
        </QueryClientProvider>
    )
}