'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import ChartComponent from "./chart/chart"
import MarketDataWidget from "./market-widget/market-widget"
import PlaceOrder from "./place-order/place-order"
import MarketDataTabs from "./market-data-tabs/market-data-tabs"
import TradingSpotChart from "./chart/trading-spot-chart"
import TradingInterface from "./trading-position/trading-position"

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

    // Function to handle pool changes from MarketDataWidget
    const handlePoolChange = (poolId: string) => {
        console.log(`Pool selection changed to: ${poolId}`);
        setSelectedPoolId(poolId);
    }

    // Debug effect to monitor selectedPoolId changes
    useEffect(() => {
        console.log(`selectedPoolId changed to: ${selectedPoolId || 'null'}`);
    }, [selectedPoolId]);

    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }
    
    return (
        <QueryClientProvider client={queryClient}>
            <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] py-[4px]">
                <div className="">
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
                    <TradingInterface />
                </div>

                <div className="space-y-[6px]">
                    <MarketDataTabs />
                </div>

                <div className="space-y-2">
                    <PlaceOrder />
                </div>
            </div>

            {/* <OrderManagement /> */}
        </QueryClientProvider>
    )
}