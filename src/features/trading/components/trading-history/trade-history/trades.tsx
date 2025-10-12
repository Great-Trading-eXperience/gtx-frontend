'use client';

import { Wallet2, Loader2 } from 'lucide-react';
import { useMarketStore } from '@/store/market-store';
import EmptyState from './emptyStates';
import TradeTable from './tradeHistoryTable';
import { TradeHistoryProps } from '@/features/trading/types/trading-history';
import { useTradeSort } from '@/features/trading/hooks/trading-history/useTradeSort';

const TradeHistoryTable = ({
  address,
  chainId,
  defaultChainId,
  userTradesData = [],
  tradesLoading,
  tradesError,
  selectedPool,
}: TradeHistoryProps) => {
  const { baseDecimals, quoteDecimals } = useMarketStore();
  const { sortConfig, sortedTrades, handleSort } = useTradeSort(userTradesData);

  // Loading state
  if (tradesLoading) {
    return <EmptyState icon={Loader2} message="Loading your trade history..." />;
  }

  // No wallet connected
  if (!address) {
    return (
      <EmptyState icon={Wallet2} message="Connect your wallet to view trade history" />
    );
  }

  // Error state
  if (tradesError) {
    return (
      <EmptyState
        icon={() => <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
        message={tradesError instanceof Error ? tradesError.message : 'Unknown error'}
        variant="error"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <TradeTable
        trades={sortedTrades}
        sortConfig={sortConfig}
        onSort={handleSort}
        selectedPool={selectedPool}
        baseDecimals={baseDecimals}
        quoteDecimals={quoteDecimals}
        chainId={chainId}
        defaultChainId={defaultChainId}
      />
    </div>
  );
};

export default TradeHistoryTable;
