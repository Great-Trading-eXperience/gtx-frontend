import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { formatAddress } from '../../../../helper';
import { formatUnits } from 'viem';
import { balancesQuery } from '@/graphql/gtx/gtx.query';
import { HexAddress } from '@/types/web3/general/address';

// Interface for balance items from the balancesQuery
interface BalanceItem {
  amount: string;
  currency: HexAddress;
  lockedAmount: string;
  name: string;
  symbol: string;
  user: HexAddress;
}

// Response interface for balancesQuery
interface BalancesResponse {
  balancess?: {
    items?: BalanceItem[];
    pageInfo?: {
      startCursor: string;
      hasPreviousPage: boolean;
      endCursor: string;
      hasNextPage: boolean;
    };
    totalCount?: number;
  };
}

const formatAmount = (amount: string, decimals: number = 18): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(Number(formatUnits(BigInt(amount), decimals)));
};

const BalancesHistoryTable = () => {
  const { address } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'amount' | 'symbol';

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'amount',
    direction: 'desc'
  });

  // Use the updated query with user filtering
  const { data, isLoading, error } = useQuery<BalancesResponse>({
    queryKey: ['balances', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet address not available');
      }

      const userAddress = address.toLowerCase() as HexAddress;

      const response = await request<BalancesResponse>(
        GTX_GRAPHQL_URL,
        balancesQuery,
        { userAddress }
      );

      // Log the response for debugging
      console.log('Balances Query Response:', response);

      if (!response || !response.balancess) {
        throw new Error('Invalid response format');
      }

      return response;
    },
    enabled: !!address, // Only run query when address is available
    staleTime: 60000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSort = (key: SortableKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (!address) {
    return (
      <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center">
        Please connect your wallet to view balances
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center">
        Loading your balances...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-red-600 dark:text-red-400 text-sm text-center">
        Error loading your balances: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const balances = data?.balancess?.items || [];

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
  const getTokenDecimals = (symbol: string): number => {
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
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Balances</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatAddress(address)}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('symbol')}>
          Asset
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${sortConfig.key === 'symbol' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
        </div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('amount')}>
          Available
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${sortConfig.key === 'amount' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
        </div>
        <div>Locked</div>
        <div>Total</div>
        <div>Currency Address</div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {sortedBalances.length > 0 ? (
          sortedBalances.map((balance) => {
            const decimals = getTokenDecimals(balance.symbol);
            const available = formatAmount(balance.amount, decimals);
            const locked = formatAmount(balance.lockedAmount, decimals);
            const total = formatAmount(
              (BigInt(balance.amount) + BigInt(balance.lockedAmount)).toString(),
              decimals
            );

            return (
              <div key={balance.currency} className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 flex items-center justify-center text-xs">
                    {balance.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-medium">{balance.symbol}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{balance.name}</div>
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white">{available}</div>
                <div className="text-gray-900 dark:text-white">{locked}</div>
                <div className="text-gray-900 dark:text-white">{total}</div>
                <div className="text-blue-600 dark:text-blue-400 underline text-xs truncate">
                  <a
                    href={`https://testnet-explorer.riselabs.xyz/address/${balance.currency}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={balance.currency}
                  >
                    {formatAddress(balance.currency)}
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center border-t border-gray-200 dark:border-gray-700">
            No balances found for your wallet
          </div>
        )}
      </div>
    </div>
  );
};

export default BalancesHistoryTable;