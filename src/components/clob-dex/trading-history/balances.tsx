"use client"

import { ClobDexComponentProps } from "../clob-dex";
import { BalanceItem, PoolItem } from "@/graphql/gtx/clob";
import { formatAmount } from '@/lib/utils';
import { ChevronDown, Loader2, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { formatUnits } from 'viem';

export interface BalancesHistoryTableProps extends ClobDexComponentProps {
  balancesResponse: BalanceItem[];
  balancesLoading: boolean;
  balancesError: Error | null;
  selectedPool: PoolItem;
}

export default function BalancesHistoryTable({
  address,
  chainId,
  defaultChainId,
  balancesResponse,
  balancesLoading,
  balancesError,
  selectedPool
}: BalancesHistoryTableProps) {
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'amount' | 'symbol';

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'amount',
    direction: 'desc',
  });

  const handleSort = (key: SortableKey) => {
    setSortConfig((currentConfig) => ({
      key,
      direction: currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedBalances = [...(balancesResponse || [])].sort((a, b) => {
    const key = sortConfig.key;

    if (key === 'amount') {
      const aValue = BigInt(a.amount || '0');
      const bValue = BigInt(b.amount || '0');
      return sortConfig.direction === 'asc'
        ? aValue < bValue
          ? -1
          : aValue > bValue
            ? 1
            : 0
        : bValue < aValue
          ? -1
          : bValue > aValue
            ? 1
            : 0;
    }
    if (key === 'symbol') {
      const aValue = a.symbol || '';
      const bValue = b.symbol || '';
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

  if (balancesLoading)
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );

  if (balancesError)
    return (
      <div className="p-4 bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-xl border border-red-800/50 text-red-300">
        <p>Error loading balances: {balancesError.message}</p>
      </div>
    );

  if (!balancesResponse || balancesResponse.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2">
        <BookOpen className="h-8 w-8 text-gray-400" />
        <p className="text-gray-400">No balances found</p>
      </div>
    );

  return (
    <div className="relative overflow-x-auto">
      <div className="grid grid-cols-3 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => handleSort('symbol')}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Token</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${sortConfig.key === 'symbol' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
              }`}
          />
        </button>
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Amount</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${sortConfig.key === 'amount' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
              }`}
          />
        </button>
        <div className="text-sm font-medium text-gray-200">Actions</div>
      </div>
      <div className="space-y-2 p-4">
        {sortedBalances.map((balance) => (
          <div
            key={balance.currency}
            className="grid grid-cols-3 gap-4 rounded-lg bg-gray-900/20 p-4 transition-colors hover:bg-gray-900/40"
          >
            <div className="text-gray-200">{balance.symbol}</div>
            <div className="font-medium text-white">{formatAmount(formatUnits(BigInt(balance.amount), 18))}</div>
            <div className="flex gap-2">
              {/* <button className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-700">
                Deposit
              </button> */}
              <button className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-700">
                Withdraw
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}