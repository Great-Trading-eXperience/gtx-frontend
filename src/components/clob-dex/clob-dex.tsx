'use client'

import { balancesPonderQuery, BalancesPonderResponse, BalancesResponse, ordersPonderQuery, OrdersPonderResponse, OrdersResponse, PoolItem, poolsPonderQuery, PoolsPonderResponse, PoolsResponse, tradesPonderQuery, TradesPonderResponse, TradesResponse } from "@/graphql/gtx/clob"
import { useMarketStore } from "@/store/market-store"
import { HexAddress } from "@/types/gtx/clob"
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
import { balancesQuery, ordersQuery, poolsQuery, tradesQuery } from "@/graphql/gtx/clob"
import { transformBalancesData, transformOrdersData, transformTradesData } from '@/lib/transform-data'
import request from "graphql-request"
import { getUseSubgraph } from "@/utils/env"
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address"
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
    selectedPool?: PoolItem;
}

export default function ClobDex() {
    const { address } = useAccount();
    const chainId = useChainId()
    const defaultChainId = Number(DEFAULT_CHAIN)

    const pathname = usePathname();
    const { isConnected } = useAccount();
    const { selectedPoolId, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } = useMarketStore();
    const [mounted, setMounted] = useState(false);
    const [selectedPool, setSelectedPool] = useState<PoolItem | null>(null);
    const [processedPool, setProcessedPool] = useState<PoolItem | null>(null);
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

    const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useQuery<PoolsResponse | PoolsPonderResponse>({
        queryKey: ['pools', String(chainId ?? defaultChainId)],
        queryFn: async () => {
            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')
            return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery)
        },
        refetchInterval: 60000,
        staleTime: 60000,
    })

    const processPool = async (pool: PoolItem): Promise<PoolItem> => {
        const [baseTokenAddress, quoteTokenAddress] = [pool.baseCurrency, pool.quoteCurrency]
        
        let baseSymbol = baseTokenAddress
        let quoteSymbol = quoteTokenAddress
        let baseDecimals = 18
        let quoteDecimals = 6

        // Get base token info
        if (baseTokenAddress !== 'Unknown') {
            try {
                const symbol = await readContract(wagmiConfig, {
                    address: baseTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "symbol",
                })
                const decimals = await readContract(wagmiConfig, {
                    address: baseTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "decimals",
                })
                baseSymbol = symbol as string
                baseDecimals = decimals as number
            } catch (error) {
                console.error(`Error fetching base token info for ${baseTokenAddress}:`, error)
            }
        }

        // Get quote token info
        if (quoteTokenAddress !== 'USDC') {
            try {
                const symbol = await readContract(wagmiConfig, {
                    address: quoteTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "symbol",
                })
                const decimals = await readContract(wagmiConfig, {
                    address: quoteTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "decimals",
                })
                quoteSymbol = symbol as string
                quoteDecimals = decimals as number
            } catch (error) {
                console.error(`Error fetching quote token info for ${quoteTokenAddress}:`, error)
            }
        }

        return {
            ...pool,
            baseSymbol,
            quoteSymbol,
            baseDecimals,
            quoteDecimals,
            coin: `${baseSymbol}/${quoteSymbol}`
        }
    }

    // Effect to handle URL-based pool selection and processing
    useEffect(() => {
        if (!mounted || !poolsData) return;

        const process = async () => {
            const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;
            
            // Get pool ID from URL
            const urlParts = pathname?.split('/') || [];
            const poolIdFromUrl = urlParts.length >= 3 ? urlParts[2] : null;
            
            // Find the pool
            let pool = pools.find(p => p.id === (poolIdFromUrl || selectedPoolId));
            
            // Fallback to WETH/USDC pair or first available pool
            if (!pool) {
                pool = pools.find(
                    p => p.coin?.toLowerCase() === "weth/usdc" ||
                        (p.baseCurrency?.toLowerCase() === "weth" && p.quoteCurrency?.toLowerCase() === "usdc")
                ) || pools[0];
            }

            if (pool) {
                setSelectedPoolId(pool.id);
                setSelectedPool(pool);
                const processed = await processPool(pool);
                setProcessedPool(processed);
                
                // Set decimals
                setBaseDecimals(processed.baseDecimals ?? 18);
                setQuoteDecimals(processed.quoteDecimals ?? 6);
            }
        };

        process();
    }, [mounted, poolsData, pathname, selectedPoolId]);

    const { data: tradesData, isLoading: tradesLoading, error: tradesError } = useQuery<TradesResponse | TradesPonderResponse>({
        queryKey: ['trades', String(chainId ?? defaultChainId), selectedPoolId],
        queryFn: async (): Promise<TradesResponse> => {
            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')
            return await request<TradesResponse>(url, getUseSubgraph() ? tradesQuery : tradesPonderQuery, { poolId: selectedPool?.orderBook })
        },
        refetchInterval: 60000,
        staleTime: 60000,
        refetchOnWindowFocus: true,
    })

    const trades = transformTradesData(tradesData)

    const { data: balanceData, isLoading: balancesLoading, error: balancesError } = useQuery<BalancesResponse | BalancesPonderResponse>({
        queryKey: ['balances', address],
        queryFn: async () => {
            if (!address) {
                throw new Error('Wallet address not available');
            }

            const userAddress = address.toLowerCase() as HexAddress;

            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')

            const response = await request<BalancesResponse | BalancesPonderResponse>(
                url,
                getUseSubgraph() ? balancesQuery : balancesPonderQuery,
                { userAddress }
            );

            return response;
        },
        enabled: !!address,
        staleTime: 60000,
        refetchInterval: 60000,
    });

    const balances = transformBalancesData(balanceData)

    const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<OrdersResponse | OrdersPonderResponse>({
        queryKey: ["orderHistory", address, selectedPoolId],
        queryFn: async () => {
            if (!address) {
                throw new Error("Wallet address not available")
            }

            const userAddress = address.toLowerCase() as HexAddress
            const currentChainId = Number(chainId ?? defaultChainId)
            const url = GTX_GRAPHQL_URL(currentChainId)
            if (!url) throw new Error('GraphQL URL not found')
            return await request<OrdersResponse>(url, getUseSubgraph() ? ordersQuery : ordersPonderQuery, { userAddress, poolId: selectedPool?.orderBook })
        },
        enabled: !!address,
        staleTime: 60000,
        refetchInterval: 60000,
    })

    const orders = transformOrdersData(ordersData)

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

    if (poolsLoading || !processedPool) {
        return <GradientLoader />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px]">
                <div className="shadow-lg rounded-lg border border-gray-700/20">
                    <MarketDataWidget 
                        address={address} 
                        chainId={chainId} 
                        defaultChainId={defaultChainId} 
                        poolId={selectedPoolId} 
                        selectedPool={processedPool}
                        tradesData={trades} 
                        tradesLoading={tradesLoading} 
                    />
                    <ChartComponent 
                        address={address} 
                        chainId={chainId} 
                        defaultChainId={defaultChainId} 
                        selectedPool={processedPool}
                    />
                </div>

                <div className="space-y-[6px]">
                    <MarketDataTabs 
                        address={address}
                        chainId={chainId}
                        defaultChainId={defaultChainId}
                        selectedPool={processedPool} 
                        poolsLoading={poolsLoading} 
                        poolsError={poolsError}                   
                     />
                </div>

                <div className="space-y-2">
                    <PlaceOrder 
                        address={address} 
                        chainId={chainId} 
                        defaultChainId={defaultChainId} 
                        selectedPool={processedPool}
                        tradesData={trades} 
                        tradesLoading={tradesLoading} 
                    />
                </div>
            </div>

            <TradingHistory 
                address={address} 
                chainId={chainId} 
                defaultChainId={defaultChainId} 
                balanceData={balances} 
                balancesLoading={balancesLoading} 
                balancesError={balancesError} 
                ordersData={orders} 
                ordersLoading={ordersLoading} 
                ordersError={ordersError} 
                selectedPool={processedPool}
                tradesData={trades} 
                tradesLoading={tradesLoading} 
                tradesError={tradesError} 
            />
        </QueryClientProvider>
    )
}