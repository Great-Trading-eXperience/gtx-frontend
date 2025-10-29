import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { DepthData, OrderData, Ticker24hrData } from '@/lib/market-api';

import { usePools } from './usePools';
import { useSelectedPool } from './useSelectedPool';
import {
  useDepthData,
  useTicker24hr,
  useTickerPrice,
  useTradesData,
  useUserTrades,
} from './useMarketData';
import { useAccountData, useAllOrders, useOpenOrders } from './useAccountData';
import { useWebSocketData } from './useWebsocketData';
import { useCombinedDepth, useCombinedOrders, useCombinedTrades } from './useCombineData';
import { useTransformedBalances } from './useTransformedBalance';

export type UseTradingResult = {
  // chain and identity
  address?: HexAddress;
  chainId: number;
  defaultChainId: number;
  // pools
  poolsData: any;
  poolsLoading: boolean;
  poolsError: Error | null;
  selectedPool?: ProcessedPoolItem;
  symbol: string;
  // market data
  depthData: DepthData | null;
  ticker24hr?: Ticker24hrData;
  tradesData: any[];
  userTradesData: any[];
  // account
  accountData: any;
  accountLoading: boolean;
  accountError: Error | null;
  refetchAccount: () => void;
  allOrdersData: OrderData[];
  openOrdersData: OrderData[];
  openOrdersLoading: boolean;
  refetchAllOrders: () => void;
  refetchOpenOrders: () => void;
  // websocket
  wsDepthUpdates: any;
  wsTradeUpdates: any[];
  wsTickerUpdates: any;
  wsOpenOrders: OrderData[];
  wsUserTrades: any[];
  // combined
  combinedTrades: any[];
  combinedDepth: DepthData | null;
  combinedOrders: any[];
  transformedBalances: any[];
  // ui flags
  isLoading: boolean;
  tradesLoading: boolean;
};

export function useTrading(): UseTradingResult {
  // auth + chain
  const { address, isConnected } = useAccount();
  const { walletAddress, isFullyAuthenticated } = usePrivyAuth();
  const { wallets } = useWallets();
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);

  const embedded = wallets.find(w => w.walletClientType === 'privy');
  const effectiveAddress = (embedded?.address as HexAddress) || (walletAddress as HexAddress) || (address as HexAddress);
  const effectiveIsConnected = isConnected || isFullyAuthenticated;

  // pools
  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = usePools(chainId);

  // selected pool
  const { selectedPool, symbol } = useSelectedPool(poolsData);

  // market data
  const { data: depthData } = useDepthData(selectedPool);
  const { data: tickerPrice, isLoading: isLoadingTickerPrice } = useTickerPrice(symbol);
  const { data: ticker24hr, isLoading: isLoadingTicker24hr } = useTicker24hr(symbol);
  const { data: tradesData, isLoading: isLoadingApiTrades } = useTradesData(selectedPool);
  const { data: userTradesData = [] } = useUserTrades(selectedPool, effectiveAddress);

  // account data
  const {
    data: accountData,
    isLoading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useAccountData(effectiveAddress);

  const {
    data: allOrdersData = [],
    isLoading: allOrdersLoading,
    refetch: refetchAllOrders,
  } = useAllOrders(effectiveAddress);

  const {
    data: openOrdersData = [],
    isLoading: openOrdersLoading,
    refetch: refetchOpenOrders,
  } = useOpenOrders(effectiveAddress);

  // websocket
  const { wsDepthUpdates, wsTradeUpdates, wsTickerUpdates, wsOpenOrders, wsUserTrades } =
    useWebSocketData(chainId, symbol, selectedPool, effectiveAddress);

  // combine
  const combinedTrades = useCombinedTrades(tradesData, wsTradeUpdates);
  const combinedDepth = useCombinedDepth(depthData, wsDepthUpdates);
  const combinedOrders = useCombinedOrders(openOrdersData, wsOpenOrders, chainId);
  const transformedBalances = useTransformedBalances(accountData, poolsData);

  // refresh on connection
  useEffect(() => {
    if (effectiveIsConnected && effectiveAddress) {
      refetchAllOrders();
      refetchOpenOrders();
      refetchAccount();
    }
  }, [effectiveIsConnected, effectiveAddress]);

  const tradesLoading = isLoadingApiTrades;
  const isLoading = poolsLoading || isLoadingTicker24hr;

  return {
    address: effectiveAddress,
    chainId,
    defaultChainId,
    poolsData,
    poolsLoading,
    poolsError: (poolsError as Error) || null,
    selectedPool,
    symbol,
    depthData: combinedDepth,
    ticker24hr,
    tradesData: combinedTrades,
    userTradesData: [...userTradesData, ...wsUserTrades],
    accountData,
    accountLoading,
    accountError: (accountError as Error) || null,
    refetchAccount,
    allOrdersData,
    openOrdersData,
    openOrdersLoading,
    refetchAllOrders,
    refetchOpenOrders,
    wsDepthUpdates,
    wsTradeUpdates,
    wsTickerUpdates,
    wsOpenOrders,
    wsUserTrades,
    combinedTrades,
    combinedDepth,
    combinedOrders,
    transformedBalances,
    isLoading,
    tradesLoading,
  };
}