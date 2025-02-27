import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { matchOrderEvents } from '@/graphql/liquidbook/liquidbook.query';
import { calculatePrice, formatAddress, formatDate } from '../../../../helper';
import { formatUnits } from 'viem';

interface MatchOrderEvent {
  id: string;
  is_buy: boolean;
  is_market: boolean;
  order_index: string;
  tick: string;
  timestamp: string;
  user: string;
  volume: string;
}

interface TradeHistoryResponse {
  matchOrderEvents: {
    items: MatchOrderEvent[];
  };
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const TradeHistoryTable = () => {
  const { address } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'volume' | 'price';
  
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'timestamp',
    direction: 'desc'
  });

  const { data, isLoading, error } = useQuery<TradeHistoryResponse>({
    queryKey: ['tradeHistory', address],
    queryFn: async () => {
      const response = await request<TradeHistoryResponse>(
        GTX_GRAPHQL_URL, 
        matchOrderEvents
      );

      if (!response || !response.matchOrderEvents) {
        throw new Error('Invalid response format');
      }

      return {
        matchOrderEvents: {
          ...response.matchOrderEvents,
          items: response.matchOrderEvents.items.filter(trade => 
            address && trade.user.toLowerCase() === address.toLowerCase()
          )
        }
      };
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const handleSort = (key: SortableKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (isLoading) {
    return (
      <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center">
        Loading your trade history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-red-600 dark:text-red-400 text-sm text-center">
        Error loading your trade history: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const trades = data?.matchOrderEvents.items || [];

  const sortedTrades = [...trades].sort((a, b) => {
    const key = sortConfig.key;
    
    if (key === 'timestamp' || key === 'volume') {
      const aValue = parseFloat(a[key]);
      const bValue = parseFloat(b[key]);
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (key === 'price') {
      const aValue = calculatePrice(a.tick);
      const bValue = calculatePrice(b.tick);
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('timestamp')}>
          Time
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>Type</div>
        <div>Side</div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('price')}>
          Price
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('volume')}>
          Amount
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>User</div>
      </div>

      {sortedTrades.length > 0 ? (
        sortedTrades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-6 gap-4 px-4 py-3 text-sm border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-400">{formatDate(trade.timestamp)}</div>
            <div className="text-gray-600 dark:text-gray-400">{trade.is_market ? 'Market' : 'Limit'}</div>
            <div className={trade.is_buy ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
              {trade.is_buy ? 'Buy' : 'Sell'}
            </div>
            <div className="text-gray-900 dark:text-gray-100">${calculatePrice(trade.tick).toFixed(2)}</div>
            <div className="text-gray-900 dark:text-gray-100">{formatPrice(Number(formatUnits(BigInt(trade.volume), 6)))}</div>
            <div className="text-gray-600 dark:text-gray-400">{formatAddress(trade.user)}</div>
          </div>
        ))
      ) : (
        <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center border-t border-gray-200 dark:border-gray-700">
          No trades found for your wallet
        </div>
      )}
    </div>
  );
};

export default TradeHistoryTable;

