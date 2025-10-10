'use client';

import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePrivyAuth } from '@/hooks/use-privy-auth';

import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';

// import ChartComponent from './chart_/chart';
import MarketDataTabs from './market-data-tabs/market-data-tabs';
import MarketDataWidget from './market-widget/market-widget';
import PlaceOrder from './place-order/place-order';
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
  // Auth and wallet setup
  const { address, isConnected } = useAccount();
  const { walletAddress, isFullyAuthenticated } = usePrivyAuth();
  const { wallets } = useWallets();
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  const isClient = useIsClient();

  const embedded = wallets.find(wallet => wallet.walletClientType === 'privy');
  const effectiveAddress = embedded?.address as HexAddress;
  const effectiveIsConnected = isConnected || isFullyAuthenticated;

  // Fetch pools data
  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = usePools(chainId, defaultChainId);

  // Get selected pool
  const { selectedPool, symbol } = useSelectedPool(poolsData);

  // Fetch market data using custom hooks
  const { data: depthData } = useDepthData(selectedPool);
  const { data: tickerPrice, isLoading: isLoadingTickerPrice } = useTickerPrice(symbol);
  const { data: ticker24hr, isLoading: isLoadingTicker24hr } = useTicker24hr(symbol);
  const { data: tradesData, isLoading: isLoadingApiTrades } = useTradesData(selectedPool);
  const { data: userTradesData } = useUserTrades(selectedPool, effectiveAddress);

  // Fetch account data
  const {
    data: accountData,
    isLoading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useAccountData(effectiveAddress);

  const {
    data: allOrdersData,
    isLoading: allOrdersLoading,
    refetch: refetchAllOrders,
  } = useAllOrders(effectiveAddress);

  const {
    data: openOrdersData,
    isLoading: openOrdersLoading,
    refetch: refetchOpenOrders,
  } = useOpenOrders(effectiveAddress);

  // WebSocket data
  const { wsDepthUpdates, wsTradeUpdates, wsTickerUpdates, wsOpenOrders, wsUserTrades } =
    useWebSocketData(chainId, symbol, selectedPool, effectiveAddress);

  // Combined data using custom hooks
  const combinedTrades = useCombinedTrades(tradesData, wsTradeUpdates);
  const combinedDepth = useCombinedDepth(depthData, wsDepthUpdates);
  const combinedOrders = useCombinedOrders(
    openOrdersData,
    wsOpenOrders,
    chainId,
    defaultChainId
  );
  const transformedBalances = useTransformedBalances(accountData, poolsData);

  // Handle connection state changes
  useEffect(() => {
    if (effectiveIsConnected && effectiveAddress) {
      refetchAllOrders();
      refetchOpenOrders();
      refetchAccount();
    }
  }, [effectiveIsConnected, effectiveAddress]);

  // Loading states
  const tradesLoading = isLoadingApiTrades || isLoadingTickerPrice;
  const isLoading = poolsLoading || isLoadingTicker24hr;

  if (!isClient) {
    return null;
  }

  return (
    <>
      <div className="grid md:grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px] h-fit">
        {/* Chart and Market Widget */}
        <div className="shadow-lg rounded-lg border border-gray-700/20 h-full flex flex-col">
          {/* <MarketDataWidget
            poolId={selectedPool?.id || null}
            selectedPool={selectedPool}
            ticker24hr={ticker24hr}
            isLoading={isLoading}
          />
          <ChartComponent
            address={effectiveAddress}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
          /> */}
          <ChartComponent
            address={effectiveAddress}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
          />
        </div>

        <div className='h-48 flex items-center justify-center'>
          <span className='text-gray-500'>On Process Development</span>
        </div>
        {/* Market Data Tabs */}
        {/* <div className="space-y-[6px] h-fit max-height-[546px]">
          <MarketDataTabs
            address={effectiveAddress}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            poolsLoading={poolsLoading}
            poolsError={poolsError}
            depthData={combinedDepth}
            trades={combinedTrades}
            tradesLoading={tradesLoading}
          />
        </div> */}

        {/* Place Order */}
        {/* <div className="space-y-2 h-fit">
          <PlaceOrder
            address={effectiveAddress}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            tradesData={combinedTrades}
            tradesLoading={tradesLoading}
            depthData={combinedDepth}
            ticker24hr={ticker24hr}
            refetchAccount={refetchAccount}
            isLoading={isLoading}
          />
        </div> */}
      </div>

      <TradingHistory
        address={effectiveAddress}
        chainId={chainId}
        defaultChainId={defaultChainId}
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
