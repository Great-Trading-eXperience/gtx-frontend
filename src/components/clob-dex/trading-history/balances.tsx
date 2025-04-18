"use client"

import { BalancesResponse } from '@/graphql/gtx/clob';
import { formatAmount } from '@/lib/utils';
import { ChevronDown, CreditCard, ExternalLink, Loader2, Wallet2 } from 'lucide-react';
import { useState } from 'react';
import { formatAddress } from '../../../../helper';
import { ClobDexComponentProps } from '../clob-dex';
import { EXPLORER_URL } from '@/constants/explorer-url';
import { formatUnits } from 'viem';

export type BalancesHistoryTableProps = ClobDexComponentProps & {
  balancesResponse?: BalancesResponse;
  balancesLoading?: boolean;
  balancesError?: Error | null;
}

const BalancesHistoryTable = ({ address, chainId, defaultChainId, balancesResponse, balancesLoading, balancesError }: BalancesHistoryTableProps) => {
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'amount' | 'symbol';

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'amount',
    direction: 'desc'
  });

  const handleSort = (key: SortableKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (!address) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wallet2 className="h-12 w-12 text-gray-400" />
          <p className="text-lg text-gray-200">Connect your wallet to view balances</p>
        </div>
      </div>
    );
  }

  if (balancesLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-lg text-gray-200">Loading your balances...</p>
        </div>
      </div>
    );
  }

  if (balancesError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-rose-800/30 bg-rose-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <p className="text-lg text-rose-200">{balancesError instanceof Error ? balancesError.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const balances = balancesResponse?.balancess?.items || [];

  const sortedBalances = [...balances].sort((a, b) => {
    const key = sortConfig.key;

    if (key === 'amount') {
      const aValue = BigInt(a.amount);
      const bValue = BigInt(b.amount);
      return sortConfig.direction === 'asc'
        ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        : bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
    if (key === 'symbol') {
      return sortConfig.direction === 'asc'
        ? a.symbol.localeCompare(b.symbol)
        : b.symbol.localeCompare(a.symbol);
    }
    return 0;
  });

  // Function to determine the appropriate decimals for a token
  const getTokenDecimals = (symbol?: string): number => {
    if (!symbol) {
      return 18;
    }

    // Common token decimals
    switch (symbol.toUpperCase()) {
      case 'USDC':
      case 'USDT':
        return 6;
      case 'WBTC':
        return 8;
      default:
        return 18; // Most ERC20 tokens including ETH use 18 decimals
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => handleSort('symbol')}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Asset</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${sortConfig.key === 'symbol' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
              }`}
          />
        </button>
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Available</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${sortConfig.key === 'amount' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
              }`}
          />
        </button>
        <div className="text-sm font-medium text-gray-200">Locked</div>
        <div className="text-sm font-medium text-gray-200">Total</div>
        <div className="text-sm font-medium text-gray-200">Currency Address</div>
      </div>

      {/* Table Body */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
        {sortedBalances.length > 0 ? (
          sortedBalances.map((balance) => {
            const decimals = getTokenDecimals(balance.symbol) ?? 18;
            const available = formatAmount(balance.amount);
            const locked = formatAmount(balance.lockedAmount);
            const total = formatAmount(
              (BigInt(balance.amount) + BigInt(balance.lockedAmount)).toString()
            );

            return (
              <div
                key={balance.currency}
                className="grid grid-cols-5 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-800 mr-3 flex items-center justify-center text-xs text-gray-200">
                    {balance.symbol?.charAt(0) ?? 'ETH'}
                  </div>
                  <div>
                    <div className="text-gray-100 font-medium">{balance.symbol}</div>
                    <div className="text-gray-400 text-xs">{balance.name}</div>
                  </div>
                </div>
                <div className="font-medium text-white self-center">{formatUnits(BigInt(balance.amount), decimals)}</div>
                <div className="text-amber-400 self-center">{formatUnits(BigInt(balance.lockedAmount), decimals)}</div>
                <div className="text-white font-medium self-center">{formatUnits(BigInt(balance.amount) + BigInt(balance.lockedAmount), decimals)}</div>
                <div className="text-blue-400 hover:text-blue-300 transition-colors truncate self-center">
                  <a
                    href={`${EXPLORER_URL(chainId ?? defaultChainId)}/address/${balance.currency}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={balance.currency}
                    className="underline"
                  >
                    {formatAddress(balance.currency)} <ExternalLink className="w-4 h-4 inline" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-[200px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <CreditCard className="h-8 w-8 text-gray-400" />
              <p className="text-gray-200">No balances found for your wallet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalancesHistoryTable;