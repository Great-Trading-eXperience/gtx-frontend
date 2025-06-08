"use client"

import { EXPLORER_URL } from '@/constants/explorer-url';
import { PoolItem, TradeItem } from '@/graphql/gtx/clob';
import { formatPrice, formatQuantity } from '@/lib/utils';
import { useMarketStore } from '@/store/market-store';
import { ArrowDownUp, ChevronDown, Clock, ExternalLink, Loader2, Wallet2, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { formatDate } from '../../../../helper';
import { ClobDexComponentProps } from "../clob-dex";

export interface TradesProps extends ClobDexComponentProps {
  tradesData: TradeItem[];
  tradesLoading: boolean;
  tradesError: Error | null;
  selectedPool: PoolItem;
}

const TradeHistoryTable = ({
  address,
  chainId,
  defaultChainId,
  tradesData,
  tradesLoading,
  tradesError,
  selectedPool
}: TradesProps) => {
  const { address: accountAddress } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'quantity' | 'price';

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'timestamp',
    direction: 'desc'
  });
  
  const [filterByMyAddress, setFilterByMyAddress] = useState(false);

  const { baseDecimals, quoteDecimals } = useMarketStore()

  const handleSort = (key: SortableKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handler for the checkbox change
  const handleFilterChange = () => {
    setFilterByMyAddress(!filterByMyAddress);
  };

  if (!address) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wallet2 className="h-12 w-12 text-gray-400" />
          <p className="text-lg text-gray-200">Connect your wallet to view trade history</p>
        </div>
      </div>
    );
  }

  if (tradesLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-lg text-gray-200">Loading your trade history...</p>
        </div>
      </div>
    );
  }

  if (tradesError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-rose-800/30 bg-rose-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <p className="text-lg text-rose-200">{tradesError instanceof Error ? tradesError.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const trades = tradesData || [];
  
  const filteredTrades = filterByMyAddress 
    ? trades.filter(trade => 
        trade.order?.user?.user?.toLowerCase() === accountAddress?.toLowerCase()
      )
    : trades;

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const key = sortConfig.key;

    if (key === 'timestamp') {
      return sortConfig.direction === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    }
    if (key === 'quantity') {
      const aValue = BigInt(a.quantity);
      const bValue = BigInt(b.quantity);
      return sortConfig.direction === 'asc'
        ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        : bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
    if (key === 'price') {
      const aValue = BigInt(a.price);
      const bValue = BigInt(b.price);
      return sortConfig.direction === 'asc'
        ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        : bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Filter checkbox */}
      <div className="flex items-center gap-2 ml-auto">
        <input
          type="checkbox"
          id="filter-by-address"
          checked={filterByMyAddress}
          onChange={handleFilterChange}
          className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        />
        <label htmlFor="filter-by-address" className="text-sm font-medium text-gray-200">
          Show only my trades
        </label>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => handleSort('timestamp')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <Clock className="h-4 w-4" />
            <span>Time</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${sortConfig.key === 'timestamp' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
                }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Pair</div>
          <button
            onClick={() => handleSort('price')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Price</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${sortConfig.key === 'price' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
                }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Side</div>
          <button
            onClick={() => handleSort('quantity')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Amount</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${sortConfig.key === 'quantity' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
                }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Transaction</div>
        </div>

        {/* Table Body */}
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
          {sortedTrades.length > 0 ? (
            sortedTrades.map((trade) => {
              const isBuy = trade.order?.side === 'Buy';
              const pair = selectedPool.coin;

              return (
                <div
                  key={trade.id}
                  className="grid grid-cols-6 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
                >
                  <div className="text-gray-200">{formatDate(trade.timestamp.toString())}</div>
                  <div className="text-gray-200">{pair}</div>
                  <div className="font-medium text-white">${formatPrice(formatUnits(BigInt(trade.price), quoteDecimals))}</div>
                  <div className={isBuy ? "text-emerald-400" : "text-rose-400"}>
                    {isBuy ? 'Buy' : 'Sell'}
                  </div>
                  <div className="font-medium text-white">{formatQuantity(formatUnits(BigInt(trade.quantity), baseDecimals))}</div>
                  <div className="text-blue-400 hover:text-blue-300 transition-colors truncate">
                    <a
                      href={`${EXPLORER_URL(chainId ?? defaultChainId)}/tx/${trade.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {`${trade.transactionId.slice(0, 6)}...${trade.transactionId.slice(-4)}`} <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-[200px] items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
                <p className="text-gray-200">
                  {filterByMyAddress 
                    ? "No trades found for your wallet" 
                    : "No trades found for this pool"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHistoryTable;