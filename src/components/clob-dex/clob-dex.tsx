'use client'

import { useMarketStore } from "@/store/market-store"
import { AssetType, HexAddress } from "@/types/gtx/clob"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount, useChainId } from "wagmi"
import GradientLoader from "../gradient-loader/gradient-loader"
import ChartComponent from "./chart/chart"
import MarketDataTabs from "./market-data-tabs/market-data-tabs"
import MarketDataWidget from "./market-widget/market-widget"
import PlaceOrder from "./place-order/place-order"
import TradingHistory from "./trading-history/trading-history"

import TokenABI from "@/abis/tokens/TokenABI"
import { wagmiConfig } from "@/configs/wagmi"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { balancesQuery, BalancesResponse, ordersQuery, OrdersResponse, poolsQuery, PoolsResponse, tradesQuery, TradesResponse } from "@/graphql/gtx/clob"
import request from "graphql-request"

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

export type ClobDexComponentProps = {
    address?: HexAddress;
    chainId: number;
    defaultChainId: number;
}

export default function ClobDex() {
    const { address } = useAccount();
    const chainId = useChainId()
    const defaultChainId = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN)

    const pathname = usePathname();
    const { isConnected } = useAccount();
    const { selectedPoolId, selectedPool, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } = useMarketStore();
    const [mounted, setMounted] = useState(false);
    const [showConnectionLoader, setShowConnectionLoader] = useState(false);
    const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: true,
                staleTime: 5000,
            },
        },
    }));

    const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useQuery<PoolsResponse>({
        queryKey: ['pools', String(chainId ?? defaultChainId)],
        queryFn: async () => {
            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')
            return await request(url, poolsQuery)
        },
        refetchInterval: 1000,
    })

    const { data: tradesData, isLoading: tradesLoading, error: tradesError } = useQuery<TradesResponse>({
        queryKey: ['trades', String(chainId ?? defaultChainId)],
        queryFn: async () => {
            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')
            return await request(url, tradesQuery)
        },
        refetchInterval: 1000,
        staleTime: 1000,
        refetchOnWindowFocus: true,
    })

    const { data: balancesResponse, isLoading: balancesLoading, error: balancesError } = useQuery<BalancesResponse>({
        queryKey: ['balances', address],
        queryFn: async () => {
            if (!address) {
                throw new Error('Wallet address not available');
            }

            const userAddress = address.toLowerCase() as HexAddress;

            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')

            const response = await request<BalancesResponse>(
                url,
                balancesQuery,
                { userAddress }
            );

            if (!response || !response.balancess) {
                throw new Error('Invalid response format');
            }

            return response;
        },
        enabled: !!address,
        staleTime: 60000,
        refetchInterval: 30000,
    });

    const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<OrdersResponse>({
        queryKey: ["orderHistory", address],
        queryFn: async () => {
            if (!address) {
                throw new Error("Wallet address not available")
            }

            const userAddress = address.toLowerCase() as HexAddress
            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')
            return await request<OrdersResponse>(url, ordersQuery, { userAddress, poolId: selectedPoolId })
        },
        enabled: !!address,
        staleTime: 1000,
        refetchInterval: 1000,
    })

    useEffect(() => {
        if (!mounted) return;

        if (pathname) {
            const urlParts = pathname.split('/');
            if (urlParts.length >= 3) {
                const poolIdFromUrl = urlParts[2];

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
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (mounted) {
            if (isConnected && !previousConnectionState) {
                setShowConnectionLoader(true);
                const timer = setTimeout(() => {
                    setShowConnectionLoader(false);
                }, 2000);
                return () => clearTimeout(timer);
            }
            setPreviousConnectionState(isConnected);
        }
    }, [isConnected, previousConnectionState, mounted]);

    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }

    if (showConnectionLoader) {
        return <GradientLoader />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px]">
                <div className="shadow-lg rounded-lg border border-gray-700/20">
                    <MarketDataWidget address={address} chainId={chainId} defaultChainId={defaultChainId} poolId={selectedPoolId} poolsData={poolsData} poolsLoading={poolsLoading} tradesData={tradesData} tradesLoading={tradesLoading} />
                    <ChartComponent address={address} chainId={chainId} defaultChainId={defaultChainId} />
                </div>

                <div className="space-y-[6px]">
                    <MarketDataTabs address={address} chainId={chainId} defaultChainId={defaultChainId} poolsData={poolsData} poolsLoading={poolsLoading} poolsError={poolsError} />
                </div>

                <div className="space-y-2">
                    <PlaceOrder address={address} chainId={chainId} defaultChainId={defaultChainId} poolsData={poolsData} poolsLoading={poolsLoading} poolsError={poolsError} tradesData={tradesData} tradesLoading={tradesLoading} />
                </div>
            </div>

            <TradingHistory address={address} chainId={chainId} defaultChainId={defaultChainId} balancesResponse={balancesResponse} balancesLoading={balancesLoading} balancesError={balancesError} ordersData={ordersData} ordersLoading={ordersLoading} ordersError={ordersError} poolsData={poolsData} poolsLoading={poolsLoading} poolsError={poolsError} tradesData={tradesData} tradesLoading={tradesLoading} tradesError={tradesError} />
        </QueryClientProvider>
    )
}