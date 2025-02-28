import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
// import { tradesQuery } from '@/graphql/liquidbook/liquidbook.query'; // Updated import
import { formatAddress, formatDate } from '../../../../helper';
import { formatUnits } from 'viem';
import { tradesQuery } from '@/graphql/gtx/gtx.query';

// Updated interface for trade items from tradesQuery
interface TradeItem {
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
  transactionId: string;
  user?: string; // Add user field (assuming it exists or needs to be added)
  pool: {
    baseCurrency: string;
    coin: string;
    id: string;
    lotSize: string;
    maxOrderAmount: string;
    orderBook: string;
    quoteCurrency: string;
    timestamp: number;
  };
}

// Updated response interface for tradesQuery
interface TradeHistoryResponse {
  tradess?: {
    items?: TradeItem[];
    pageInfo?: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount?: number;
  };
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const TradeHistoryTable = () => {
  const { address } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'quantity' | 'price';
  
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'timestamp',
    direction: 'desc'
  });

  const { data, isLoading, error } = useQuery<TradeHistoryResponse>({
    queryKey: ['tradeHistory', address],
    queryFn: async () => {
      const response = await request<TradeHistoryResponse>(
        GTX_GRAPHQL_URL, 
        tradesQuery
      );

      if (!response || !response.tradess) {
        throw new Error('Invalid response format');
      }

      // Filter trades by the connected wallet address
      if (address && response.tradess.items) {
        // If your API has a user field, use that for filtering
        // Otherwise, use transaction data to identify user's trades
        
        // Mock implementation for filtering - replace with actual implementation
        // that uses the appropriate field for user identification
        response.tradess.items = response.tradess.items.filter(trade => {
          // If the trade has a user field, check if it matches the address
          if (trade.user) {
            return trade.user.toLowerCase() === address.toLowerCase();
          }
          
          // If no user field, use transaction ID or another field as a proxy
          // This is a placeholder - modify based on your actual data structure
          return trade.transactionId.toLowerCase().includes(address.toLowerCase().substring(2));
        });
      }

      return response;
    },
    enabled: !!address, // Only run query when address is available
    staleTime: 60000,
    refetchOnWindowFocus: true,
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
        Please connect your wallet to view trade history
      </div>
    );
  }

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

  const trades = data?.tradess?.items || [];

  // Determine trade direction (buy/sell) based on transaction analysis
  // This is a placeholder - implement actual logic based on your system
  const determineTradeSide = (trade: TradeItem): boolean => {
    // Placeholder: in a real app, you'd determine this from transaction data
    // or by comparing user's address with buyer/seller addresses
    // For now, using a simple but arbitrary approach for demonstration
    return parseInt(trade.id, 16) % 2 === 0; // Even ID = buy, odd ID = sell
  };

  const sortedTrades = [...trades].sort((a, b) => {
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
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md">
      
      <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('timestamp')}>
          Time
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>Pair</div>
        <div>Side</div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('price')}>
          Price
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('quantity')}>
          Amount
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>Transaction</div>
      </div>

      {sortedTrades.length > 0 ? (
        sortedTrades.map((trade) => {
          const isBuy = determineTradeSide(trade);
          const priceValue = Number(formatUnits(BigInt(trade.price), 12)); // Adjust decimals as needed
          const quantityValue = Number(formatUnits(BigInt(trade.quantity), 18)); // Adjust decimals as needed
          
          return (
            <div key={trade.id} className="grid grid-cols-6 gap-4 px-4 py-3 text-sm border-t border-gray-200 dark:border-gray-700">
              <div className="text-gray-600 dark:text-gray-400">{formatDate(trade.timestamp.toString())}</div>
              <div className="text-gray-600 dark:text-gray-400">{trade.pool?.coin || 'Unknown'}</div>
              <div className={isBuy ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                {isBuy ? 'Buy' : 'Sell'}
              </div>
              <div className="text-gray-900 dark:text-gray-100">${formatPrice(priceValue)}</div>
              <div className="text-gray-900 dark:text-gray-100">{formatPrice(quantityValue)}</div>
              <div className="text-blue-600 dark:text-blue-400 underline">
                <a 
                  href={`https://etherscan.io/tx/${trade.transactionId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {formatAddress(trade.transactionId)}
                </a>
              </div>
            </div>
          );
        })
      ) : (
        <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center border-t border-gray-200 dark:border-gray-700">
          No trades found for your wallet
        </div>
      )}
    </div>
  );
};

export default TradeHistoryTable;