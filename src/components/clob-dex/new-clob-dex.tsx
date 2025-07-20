'use client';

import { useMarketStore } from '@/store/market-store';
import { HexAddress } from '@/types/gtx/clob';
import { QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';

// Extracted custom hooks
import { usePoolsData } from '@/hooks/web3/gtx/new-clob-dex-hooks/usePoolsData';
import { useMarketData } from '@/hooks/web3/gtx/new-clob-dex-hooks/useMarketData';
import { useUserData } from '@/hooks/web3/gtx/new-clob-dex-hooks/useUserData';
import { useWebSocketConnections } from '@/hooks/web3/gtx/new-clob-dex-hooks/useWebSocketConnections';
import { usePoolSelection } from '@/hooks/web3/gtx/new-clob-dex-hooks/usePoolSelection';

// Components
import ChartComponent from './chart/chart';
import MarketDataTabs from './market-data-tabs/market-data-tabs';
import MarketDataWidget from './market-widget/market-widget';
import PlaceOrder from './place-order/place-order';
import TradingHistory from './trading-history/trading-history';

// Utils
import { useIsClient } from '@/utils/clob-dex/useIsClient';
import { createQueryClient } from '@/utils/clob-dex/queryClient';

export default function NewClobDex() {
  const { address, isConnected } = useAccount();
  const { walletAddress, isFullyAuthenticated } = usePrivyAuth();
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  const isClient = useIsClient();
  const pathname = usePathname();

  // Derived values
  const effectiveAddress = (walletAddress || address) as HexAddress;
  const effectiveIsConnected = isConnected || isFullyAuthenticated;

  // Store
  const { selectedPoolId, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } =
    useMarketStore();

  // State
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => createQueryClient());

  // Custom hooks for data management
  const { poolsData, poolsLoading, poolsError } = usePoolsData(chainId, defaultChainId);

  const { selectedPool, symbol } = usePoolSelection({
    poolsData,
    pathname,
    selectedPoolId,
    setSelectedPoolId,
    setBaseDecimals,
    setQuoteDecimals,
    mounted,
  });

  const { depthData, combinedTrades, ticker24hr, tradesLoading } = useMarketData(
    selectedPool,
    symbol
  );

  const {
    userTrades,
    transformedBalances,
    transformedOpenOrders,
    marketAccountLoading,
    marketAccountError,
    marketOpenOrdersLoading,
    refetchAccount,
    refetchOpenOrders,
    refetchAllOrders,
  } = useUserData(effectiveAddress, selectedPool, effectiveIsConnected);

  useWebSocketConnections({
    effectiveAddress,
    chainId,
    symbol,
    selectedPool,
    effectiveIsConnected,
  });

  // Effects
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px] h-fit">
        <div className="shadow-lg rounded-lg border border-gray-700/20 h-full flex flex-col">
          <MarketDataWidget
            address={effectiveAddress}
            chainId={chainId}
            defaultChainId={defaultChainId}
            poolId={selectedPoolId}
            selectedPool={selectedPool}
            ticker24hr={ticker24hr}
          />
          <ChartComponent
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
          />
        </div>

        <div className="space-y-[6px] h-fit">
          <MarketDataTabs
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            poolsLoading={poolsLoading}
            poolsError={poolsError}
            depthData={depthData}
            trades={combinedTrades}
            tradesLoading={tradesLoading}
          />
        </div>

        <div className="space-y-2">
          <PlaceOrder
            address={effectiveAddress}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            tradesData={combinedTrades}
            tradesLoading={tradesLoading}
            depthData={depthData}
            ticker24hr={ticker24hr}
            refetchAccount={refetchAccount}
          />
        </div>
      </div>

      <TradingHistory
        address={effectiveAddress}
        chainId={chainId}
        defaultChainId={defaultChainId}
        balanceData={transformedBalances}
        balancesLoading={marketAccountLoading}
        balancesError={marketAccountError}
        ordersData={transformedOpenOrders}
        ordersLoading={marketOpenOrdersLoading}
        ordersError={null}
        selectedPool={selectedPool}
        userTradesData={userTrades}
        tradesLoading={false}
        tradesError={null}
        refetchFn={refetchAccount}
      />
    </QueryClientProvider>
  );
}
