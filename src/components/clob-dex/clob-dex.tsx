'use client';

import {
  balancesPonderQuery,
  BalancesPonderResponse,
  BalancesResponse,
  ordersPonderQuery,
  OrdersPonderResponse,
  OrdersResponse,
  PoolItem,
  poolsPonderQuery,
  PoolsPonderResponse,
  PoolsResponse,
  tradesPonderQuery,
  TradesPonderResponse,
  TradesResponse,
  recentTradesPonderQuery,
  RecentTradesPonderResponse,
  recentTradesQuery,
  RecentTradesResponse,
  openOrdersPonderQuery,
  OpenOrdersPonderResponse,
  openOrdersQuery,
  OpenOrdersResponse,
  tradeHistoryPonderQuery,
  TradeHistoryPonderResponse,
  TradeHistoryResponse,
  tradeHistoryQuery,
} from '@/graphql/gtx/clob';
import { useMarketStore } from '@/store/market-store';
import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import GradientLoader from '../gradient-loader/gradient-loader';
import ChartComponent from './chart/chart';
import MarketDataTabs from './market-data-tabs/market-data-tabs';
import MarketDataWidget from './market-widget/market-widget';
import PlaceOrder from './place-order/place-order';
import TradingHistory from './trading-history/trading-history';

import TokenABI from '@/abis/tokens/TokenABI';
import { wagmiConfig } from '@/configs/wagmi';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { balancesQuery, ordersQuery, poolsQuery, tradesQuery } from '@/graphql/gtx/clob';
import {
  transformBalancesData,
  transformOrdersData,
  transformTradesData,
  transformRecentTradesData,
  transformOpenOrdersData,
  transformTradeHistoryData,
} from '@/lib/transform-data';
import request from 'graphql-request';
import { getUseSubgraph } from '@/utils/env';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
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
  selectedPool?: ProcessedPoolItem;
};

export default function ClobDex() {
  const { address } = useAccount();
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);

  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { selectedPoolId, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } =
    useMarketStore();
  const [mounted, setMounted] = useState(false);
  const [selectedPool, setSelectedPool] = useState<ProcessedPoolItem | null>(null);
  // const [processedPool, setProcessedPool] = useState<ProcessedPoolItem | null>(null);
  const [processedPools, setProcessedPools] = useState<ProcessedPoolItem[] | null>(null);
  const [showConnectionLoader, setShowConnectionLoader] = useState(false);
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            staleTime: 5000,
          },
        },
      })
  );

  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = useQuery<PoolsResponse | PoolsPonderResponse>({
    queryKey: ['pools', String(chainId ?? defaultChainId)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });

  const processPool = (pool: PoolItem): ProcessedPoolItem => {
    const { baseCurrency, quoteCurrency, ...other } = pool;
    return {
      ...other,
      baseTokenAddress: baseCurrency.address,
      quoteTokenAddress: quoteCurrency.address,
      baseSymbol: baseCurrency.symbol,
      quoteSymbol: quoteCurrency.symbol,
      baseDecimals: baseCurrency.decimals,
      quoteDecimals: quoteCurrency.decimals,
    };
  };

  // Effect to handle URL-based pool selection and processing
  // Effect to handle URL-based pool selection and processing
  useEffect(() => {
    if (!mounted || !poolsData) return;

    const processPools = async () => {
      const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;

      const processedPoolsArray = getUseSubgraph()
        ? pools.map(pool => processPool(pool))
        : pools.map(pool => {
            return processPool(pool);
            // const baseSymbol = pool.coin.split('/')[0]
            // const quoteSymbol = pool.coin.split('/')[1]
            // return {
            //     ...pool,
            //     baseSymbol,
            //     quoteSymbol,
            // }
          });
      setProcessedPools(processedPoolsArray);

      const urlParts = pathname?.split('/') || [];
      const poolIdFromUrl = urlParts.length >= 3 ? urlParts[2] : null;

      let selectedPoolItem = processedPoolsArray.find(
        p => p.id === (poolIdFromUrl || selectedPoolId)
      );

      if (!selectedPoolItem) {
        selectedPoolItem =
          processedPoolsArray.find(
            p =>
              p.coin?.toLowerCase() === 'weth/usdc' ||
              (p.baseSymbol?.toLowerCase() === 'weth' &&
                p.quoteSymbol?.toLowerCase() === 'usdc')
          ) || processedPoolsArray[0];
      }

      if (selectedPoolItem) {
        setSelectedPoolId(selectedPoolItem.id);
        setSelectedPool(selectedPoolItem);
        // setProcessedPool(selectedPoolItem);

        setBaseDecimals(selectedPoolItem.baseDecimals ?? 18);
        setQuoteDecimals(selectedPoolItem.quoteDecimals ?? 6);
      }
    };

    processPools();
  }, [mounted, poolsData, pathname, selectedPoolId]);

  const {
    data: tradesData,
    isLoading: tradesLoading,
    error: tradesError,
  } = useQuery<TradesResponse | TradesPonderResponse>({
    queryKey: ['trades', String(chainId ?? defaultChainId), selectedPoolId],
    queryFn: async (): Promise<TradesResponse> => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request<TradesResponse>(
        url,
        getUseSubgraph() ? tradesQuery : tradesPonderQuery,
        { poolId: selectedPool?.orderBook }
      );
    },
    refetchInterval: 60000,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  const trades = transformTradesData(tradesData);

  const {
    data: balanceData,
    isLoading: balancesLoading,
    error: balancesError,
  } = useQuery<BalancesResponse | BalancesPonderResponse>({
    queryKey: ['balances', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet address not available');
      }

      const userAddress = address.toLowerCase() as HexAddress;

      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');

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

  const balances = transformBalancesData(balanceData);

  const {
    data: recentTradesData,
    isLoading: recentTradesLoading,
    error: recentTradesError,
  } = useQuery<RecentTradesResponse | RecentTradesPonderResponse>({
    queryKey: [
      'orderBookTrades',
      String(chainId ?? defaultChainId),
      selectedPoolId,
      selectedPool,
    ],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(
        url,
        getUseSubgraph() ? recentTradesQuery : recentTradesPonderQuery,
        { poolId: selectedPool?.orderBook }
      );
    },
    refetchInterval: 60000,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  const recentTrades = transformRecentTradesData(recentTradesData);

  const {
    data: openOrdersData,
    isLoading: openOrdersLoading,
    error: openOrdersError,
  } = useQuery<OpenOrdersResponse | OpenOrdersPonderResponse>({
    queryKey: ['orders', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet address not available');
      }

      const userAddress = address.toLowerCase() as HexAddress;
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(
        url,
        getUseSubgraph() ? openOrdersQuery : openOrdersPonderQuery,
        { userAddress }
      );
    },
    enabled: !!address,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const openOrders = transformOpenOrdersData(openOrdersData);

  const {
    data: tradeHistoryData,
    isLoading: tradeHistoryLoading,
    error: tradeHistoryError,
  } = useQuery<TradeHistoryResponse | TradeHistoryPonderResponse>({
    queryKey: ['orderHistory', openOrders],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet address not available');
      }
      if (!openOrders) {
        throw new Error('Orders not available');
      }
      const orderIds: BigInt[] = openOrders.map(order => order.orderId);
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(
        url,
        getUseSubgraph() ? tradeHistoryQuery : tradeHistoryPonderQuery,
        { orderIds }
      );
    },
    enabled: !!address,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const tradeHistory = transformTradeHistoryData(tradeHistoryData);

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

  if (poolsLoading || !selectedPool) {
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
            selectedPool={selectedPool}
            tradesData={trades}
            tradesLoading={tradesLoading}
          />
          <ChartComponent
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
          />
        </div>

        <div className="space-y-[6px]">
          <MarketDataTabs
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            poolsLoading={poolsLoading}
            poolsError={poolsError}
            selectedTrades={recentTrades}
            tradesLoading={recentTradesLoading}
            tradesError={recentTradesError}
          />
        </div>

        <div className="space-y-2">
          <PlaceOrder
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
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
        ordersData={openOrders}
        ordersLoading={openOrdersLoading}
        ordersError={openOrdersError}
        selectedPool={selectedPool}
        tradesData={tradeHistory}
        tradesLoading={tradeHistoryLoading}
        tradesError={tradeHistoryError}
      />
    </QueryClientProvider>
  );
}
