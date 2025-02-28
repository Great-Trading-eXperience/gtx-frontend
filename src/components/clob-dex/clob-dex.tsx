'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import ChartComponent from "./chart/chart"
import MarketDataWidget from "./market-widget/market-widget"
import PlaceOrder from "./place-order/place-order"
import MarketDataTabs from "./market-data-tabs/market-data-tabs"
import TradingHistory from "./trading-history/trading-history"
// import GradientLoader from "./gradient-loader/gradient-loader"
import { useAccount } from "wagmi"
import GradientLoader from "../gradient-loader/gradient-loader"

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

export default function ClobDex() {
    // Create QueryClient instance inside component to ensure it's 
    // created on the client side, not during server-side rendering
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Add default options that might help with reactivity
                refetchOnWindowFocus: true,
                staleTime: 5000,
            },
        },
    }));

    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showConnectionLoader, setShowConnectionLoader] = useState(false);
    const { isConnected } = useAccount();
    const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

    // Function to handle pool changes from MarketDataWidget
    const handlePoolChange = (poolId: string) => {
        console.log(`Pool selection changed to: ${poolId}`);
        setSelectedPoolId(poolId);
    }

    // Debug effect to monitor selectedPoolId changes
    useEffect(() => {
        console.log(`selectedPoolId changed to: ${selectedPoolId || 'null'}`);
    }, [selectedPoolId]);

    // Handle component mounting
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Handle wallet connection state changes
    useEffect(() => {
        if (mounted) {
            // Only handle connection changes after mounting
            if (isConnected && !previousConnectionState) {
                setShowConnectionLoader(true);
                const timer = setTimeout(() => {
                    setShowConnectionLoader(false);
                }, 2000); // Show for 3 seconds as requested
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
            <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] py-[4px]">
                <div className="shadow-lg rounded-lg">
                    <MarketDataWidget onPoolChange={handlePoolChange} />
                    {/* Pass key to force full remount when pool changes */}
                    {/* <TradingSpotChart 
                            height={500} 
                            selectedPoolId={selectedPoolId} 
                            key={`chart-${selectedPoolId || 'default'}`}
                        /> */}
                    <ChartComponent />
                </div>

                <div className="space-y-[6px]">
                    <MarketDataTabs />
                </div>

                <div className="space-y-2">
                    <PlaceOrder />
                </div>
            </div>

            <TradingHistory />

            {/* <OrderManagement /> */}
        </QueryClientProvider>
    )
}