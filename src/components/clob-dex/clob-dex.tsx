'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import ChartComponent from "./chart/chart"
import MarketDataWidget from "./market-widget/market-widget"
import PlaceOrder from "./place-order/place-order"
import MarketDataTabs from "./market-data-tabs/market-data-tabs"
import TradingHistory from "./trading-history/trading-history"
import { useAccount } from "wagmi"
import GradientLoader from "../gradient-loader/gradient-loader"
import { useMarketStore } from "@/store/market-store"
import { usePathname } from "next/navigation"
import { AssetType, HexAddress } from "@/types/web3/gtx/gtx"
import { readContract } from "@wagmi/core"

import { wagmiConfig } from "@/configs/wagmi"
import TokenABI from "@/abis/tokens/TokenABI"
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

    const pathname = usePathname();
    const { selectedPoolId, selectedPool, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } = useMarketStore();
    const [mounted, setMounted] = useState(false);
    const [showConnectionLoader, setShowConnectionLoader] = useState(false);
    const { isConnected } = useAccount();
    const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

    // Extract pool ID from URL when the component mounts or URL changes
    useEffect(() => {
        // Wait until the component is mounted to access the pathname
        if (!mounted) return;

        if (pathname) {
            const urlParts = pathname.split('/');
            if (urlParts.length >= 3) {
                const poolIdFromUrl = urlParts[2];

                // Only update the store if the pool ID has changed
                if (poolIdFromUrl && poolIdFromUrl !== selectedPoolId) {
                    console.log(`Setting pool ID from URL: ${poolIdFromUrl}`);
                    setSelectedPoolId(poolIdFromUrl);
                }
            }
        }
    }, [pathname, mounted, selectedPoolId, setSelectedPoolId]);

    const fetchDecimals = async (assetType: AssetType, address: HexAddress) => {
        try {
            const tokenDecimalsResult = await readContract(wagmiConfig, {
                address: address,
                abi: TokenABI,
                functionName: "decimals",
                args: [],
            })

            if (assetType === AssetType.BASE) {
                setBaseDecimals(tokenDecimalsResult as number)
            } else {
                setQuoteDecimals(tokenDecimalsResult as number)
            }
        } catch (err: unknown) {
            console.log("Error fetching token decimals of", address, err)
        }
    }

    useEffect(() => {
        if (!selectedPool) return

        fetchDecimals(AssetType.BASE, selectedPool.baseCurrency as HexAddress)
        fetchDecimals(AssetType.QUOTE, selectedPool.quoteCurrency as HexAddress)
    }, [selectedPool])


    useEffect(() => {
        if (selectedPool) {
            setBaseDecimals(selectedPool.baseDecimals);
            setQuoteDecimals(selectedPool.quoteDecimals);
        }
    }, [selectedPool, setBaseDecimals, setQuoteDecimals]);

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
                }, 2000); // Show for 2 seconds as specified
                return () => clearTimeout(timer);
            }
            setPreviousConnectionState(isConnected);
        }
    }, [isConnected, previousConnectionState, mounted]);

    // Debug effect to monitor selectedPoolId changes
    useEffect(() => {
        if (mounted) {
            console.log(`selectedPoolId changed to: ${selectedPoolId || 'null'}`);
        }
    }, [selectedPoolId, mounted]);

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
            <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px]">
                <div className="shadow-lg rounded-lg border border-gray-700/20">
                    <MarketDataWidget />
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
        </QueryClientProvider>
    )
}