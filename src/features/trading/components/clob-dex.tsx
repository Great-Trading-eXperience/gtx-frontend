'use client';

import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePrivyAuth } from '@/hooks/use-privy-auth';

import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';

import MarketDataTabs from './market-data-tabs/market-data-tabs';
import PlaceOrder from './place-order/placeOrder';
import ChartComponent from './chart';
import TradingHistory from './trading-history/trading-history';

import { useWallets } from '@privy-io/react-auth';

import { usePools } from '../hooks/usePools';
import { useSelectedPool } from '../hooks/useSelectedPool';
import {
  useDepthData,
  useTicker24hr,
  useTickerPrice,
  useTradesData,
  useUserTrades,
} from '../hooks/useMarketData';
import { useAccountData, useAllOrders, useOpenOrders } from '../hooks/useAccountData';
import { useWebSocketData } from '../hooks/useWebsocketData';
import {
  useCombinedDepth,
  useCombinedOrders,
  useCombinedTrades,
} from '../hooks/useCombineData';
import { useTransformedBalances } from '../hooks/useTransformedBalance';
import { useWalletState } from '../hooks/useWalletState';

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
  const walletState = useWalletState();
  const isClient = useIsClient();

  // Fetch pools data
  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = usePools(walletState.embeddedChainId);

  // Get selected pool
  const { selectedPool, symbol } = useSelectedPool(poolsData);

  // Fetch market data using custom hooks
  const { data: depthData } = useDepthData(selectedPool);
  const { data: tickerPrice, isLoading: isLoadingTickerPrice } = useTickerPrice(symbol);
  const { data: ticker24hr, isLoading: isLoadingTicker24hr } = useTicker24hr(symbol);
  const { data: tradesData, isLoading: isLoadingApiTrades } = useTradesData(selectedPool);
  const { data: userTradesData } = useUserTrades(selectedPool, walletState.embeddedAddress);

  // Fetch account data
  const {
    data: accountData,
    isLoading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useAccountData(walletState.embeddedAddress);

  const {
    data: allOrdersData,
    isLoading: allOrdersLoading,
    refetch: refetchAllOrders,
  } = useAllOrders(walletState.embeddedAddress);

  const {
    data: openOrdersData,
    isLoading: openOrdersLoading,
    refetch: refetchOpenOrders,
  } = useOpenOrders(walletState.embeddedAddress);

  // WebSocket data
  const { wsDepthUpdates, wsTradeUpdates, wsTickerUpdates, wsOpenOrders, wsUserTrades } =
    useWebSocketData(walletState.embeddedChainId, symbol, selectedPool, walletState.embeddedAddress);

  // Combined data using custom hooks
  const combinedTrades = useCombinedTrades(tradesData, wsTradeUpdates);
  const combinedDepth = useCombinedDepth(depthData, wsDepthUpdates);
  const combinedOrders = useCombinedOrders(
    openOrdersData,
    wsOpenOrders,
    walletState.embeddedChainId
  );
  const transformedBalances = useTransformedBalances(accountData, poolsData);

  // Handle connection state changes
  useEffect(() => {
    if (walletState.embeddedAddress) {
      refetchAllOrders();
      refetchOpenOrders();
      refetchAccount();
    }
  }, [walletState.embeddedAddress]);

  // Loading states
  const tradesLoading = isLoadingApiTrades || isLoadingTickerPrice;
  const isLoading = poolsLoading || isLoadingTicker24hr;

  if (!isClient) {
    return null;
  }

  return (
    <>
      <div className="grid md:grid-cols-[minmax(0,1fr)_282px_282px] gap-[4px] px-[2px] pt-[4px] h-fit">
        {/* Chart and Market Widget */}
        <div className="shadow-lg rounded-lg border border-gray-700/20 h-full flex flex-col">
          <ChartComponent
            address={walletState.embeddedAddress as `0x${string}`}
            chainId={walletState.embeddedChainId}
            defaultChainId={walletState.embeddedChainId}
            selectedPool={selectedPool}
          />
        </div>

        <MarketDataTabs
          address={walletState.embeddedAddress as `0x${string}`}
          chainId={walletState.embeddedChainId}
          defaultChainId={walletState.embeddedChainId}
          selectedPool={selectedPool}
          poolsLoading={poolsLoading}
          poolsError={poolsError}
          depthData={combinedDepth}
          trades={combinedTrades}
          tradesLoading={tradesLoading}
        />
        <div className="hidden md:flex flex-row w-full">
          <PlaceOrder
            address={walletState.embeddedAddress as `0x${string}`}
            chainId={walletState.embeddedChainId}
            defaultChainId={walletState.embeddedChainId}
            selectedPool={selectedPool}
            depthData={combinedDepth}
            ticker24hr={ticker24hr}
            refetchAccount={refetchAccount}
            isLoading={isLoading}
          />
        </div>
      </div>

      <TradingHistory
        address={walletState.embeddedAddress as `0x${string}`}
        chainId={walletState.embeddedChainId}
        defaultChainId={walletState.embeddedChainId}
        balanceData={transformedBalances}
        balancesLoading={accountLoading}
        balancesError={accountError}
        ordersData={combinedOrders}
        ordersLoading={openOrdersLoading}
        ordersError={null}
        selectedPool={selectedPool}
        userTradesData={[...(userTradesData || []), ...wsUserTrades]}
        tradesLoading={false}
        tradesError={null}
        marketOpenOrdersData={openOrdersData}
        marketOpenOrdersLoading={openOrdersLoading}
        marketAllOrdersData={allOrdersData}
        refetchFn={refetchAccount}
        isLoading={poolsLoading || accountLoading || openOrdersLoading}
      />
    </>
  );
}
