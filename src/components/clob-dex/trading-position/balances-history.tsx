import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
// import { balancesQuery } from '@/graphql/liquidbook/liquidbook.query'; // Make sure to add this import
import { formatAddress } from '../../../../helper';
import { formatUnits } from 'viem';
import { balancesQuery } from '@/graphql/gtx/gtx.query';

// Interface for balance items from the balancesQuery
interface BalanceItem {
  amount: string;
  currency: string;
  lockedAmount: string;
  name: string;
  symbol: string;
  user: string;
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

const formatAmount = (amount: string, decimals: number = 6): string => {
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

  const { data, isLoading, error } = useQuery<BalancesResponse>({
    queryKey: ['balances', address],
    queryFn: async () => {
      const response = await request<BalancesResponse>(
        GTX_GRAPHQL_URL, 
        balancesQuery
      );

      if (!response || !response.balancess) {
        throw new Error('Invalid response format');
      }

      // Filter balances by the connected wallet address
      if (address && response.balancess.items) {
        response.balancess.items = response.balancess.items.filter(balance => 
          balance.user.toLowerCase() === address.toLowerCase()
        );
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

  const getTotalBalance = (): string => {
    // This is a simplified calculation assuming all tokens are in USD
    // In a real implementation, you'd use price data to convert to a common denomination
    const total = sortedBalances.reduce((sum, balance) => {
      // For demo, assume USDC is 1:1 with USD, others need price conversion
      if (balance.symbol === 'USDC') {
        return sum + Number(formatUnits(BigInt(balance.amount), 6));
      }
      // Placeholder - in real app, you'd use current prices to convert to USD
      return sum;
    }, 0);
    
    return total.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md">
      
      
      <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('symbol')}>
          Asset
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('amount')}>
          Available
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>Locked</div>
        <div>Total</div>
        <div>Currency Address</div>
      </div>

      {sortedBalances.length > 0 ? (
        sortedBalances.map((balance) => {
          const available = formatAmount(balance.amount);
          const locked = formatAmount(balance.lockedAmount);
          const total = formatAmount(
            (BigInt(balance.amount) + BigInt(balance.lockedAmount)).toString()
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
              <div className="text-blue-600 dark:text-blue-400 underline">
                <a 
                  href={`https://etherscan.io/token/${balance.currency}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
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
  );
};

export default BalancesHistoryTable;