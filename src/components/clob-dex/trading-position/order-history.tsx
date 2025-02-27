import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
// import { orderHistorysQuery, poolsQuery } from '@/graphql/liquidbook/liquidbook.query'; // Updated import
import { formatAddress, formatDate } from '../../../../helper';
import { formatUnits } from 'viem';
import { orderHistorysQuery, poolsQuery } from '@/graphql/gtx/gtx.query';

// Interface for order history items from the orderHistorysQuery
interface OrderHistoryItem {
  id: string;
  orderId: string;
  poolId: string;
  filled: string;
  status: string;
  timestamp: number;
  user?: string; // Add user field (assuming it exists or will be added to the query)
}

// Interface for pool items to get coin names
interface Pool {
  id: string;
  coin: string;
}

// Updated response interfaces
interface OrderHistoryResponse {
  orderHistorys?: {
    items?: OrderHistoryItem[];
    pageInfo?: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount?: number;
  };
}

interface PoolsResponse {
  poolss?: {
    items?: Pool[];
  };
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const OrderHistoryTable = () => {
  const { address } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'filled' | 'orderId';
  
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'timestamp',
    direction: 'desc'
  });

  // Fetch pools data to get coin names
  const { data: poolsData } = useQuery<PoolsResponse>({
    queryKey: ['pools'],
    queryFn: async () => {
      return await request<PoolsResponse>(
        GTX_GRAPHQL_URL, 
        poolsQuery
      );
    },
    staleTime: 60000 // Cache for 1 minute
  });

  // Fetch order history data
  const { data, isLoading, error } = useQuery<OrderHistoryResponse>({
    queryKey: ['orderHistory', address],
    queryFn: async () => {
      // Option 1: Filter on the server side if possible by modifying the query with variables
      // This would be the most efficient approach
      
      // Option 2: Get all data and filter client-side
      const response = await request<OrderHistoryResponse>(
        GTX_GRAPHQL_URL, 
        orderHistorysQuery
      );

      if (!response || !response.orderHistorys) {
        throw new Error('Invalid response format');
      }

      // Filter by transaction origin if user field exists
      if (address && response.orderHistorys.items) {
        // If your API supports filtering by user's address, modify this to use actual user field
        // For now, assuming we're using transaction data to filter
        
        // Mock implementation for filtering by user - replace with actual implementation
        // that uses the appropriate field for user identification
        response.orderHistorys.items = response.orderHistorys.items.filter(order => {
          // If the order has a user field, check if it matches the address
          if (order.user) {
            return order.user.toLowerCase() === address.toLowerCase();
          }
          
          // If no user field, use order ID or another field as a proxy
          // This is a placeholder - modify based on your actual data structure
          return order.id.toLowerCase().includes(address.toLowerCase().substring(2));
        });
      }

      return response;
    },
    enabled: !!address, // Only run query when address is available
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const handleSort = (key: SortableKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (!address) {
    return (
      <div className="px-4 py-8 text-gray-500 dark:text-gray-400 text-sm text-center">
        Please connect your wallet to view order history
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8 text-gray-500 dark:text-gray-400 text-sm text-center">
        Loading your order history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-red-500 dark:text-red-400 text-sm text-center">
        Error loading your order history: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const orders = data?.orderHistorys?.items || [];

  // Helper function to get pool name by poolId
  const getPoolName = (poolId: string): string => {
    if (!poolsData?.poolss?.items) return 'Unknown';
    const pool = poolsData.poolss.items.find(p => p.id === poolId);
    return pool ? pool.coin : 'Unknown';
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const key = sortConfig.key;
    
    if (key === 'timestamp') {
      return sortConfig.direction === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    }
    if (key === 'filled') {
      const aValue = parseInt(a.filled || '0');
      const bValue = parseInt(b.filled || '0');
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (key === 'orderId') {
      const aValue = parseInt(a.orderId || '0');
      const bValue = parseInt(b.orderId || '0');
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md">
      
      
      <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('timestamp')}>
          Time
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>Trading Pair</div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('orderId')}>
          Order ID
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('filled')}>
          Filled
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div>Status</div>
      </div>

      {sortedOrders.length > 0 ? (
        sortedOrders.map((order) => (
          <div key={order.id} className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-400">{formatDate(order.timestamp.toString())}</div>
            <div className="text-gray-600 dark:text-gray-400">{getPoolName(order.poolId)}</div>
            <div className="text-gray-900 dark:text-white">{order.orderId}</div>
            <div className="text-gray-900 dark:text-white">
              {order.filled === '0' ? '0%' : `${formatPrice(parseInt(order.filled) / 100)}%`}
            </div>
            <div className={
              order.status === 'FILLED' ? 'text-green-600 dark:text-green-500' : 
              order.status === 'CANCELLED' ? 'text-red-600 dark:text-red-500' : 
              'text-yellow-600 dark:text-yellow-500'
            }>
              {order.status}
            </div>
          </div>
        ))
      ) : (
        <div className="px-4 py-8 text-gray-600 dark:text-gray-400 text-sm text-center border-t border-gray-200 dark:border-gray-700">
          No orders found for your wallet
        </div>
      )}
    </div>
  );
};

export default OrderHistoryTable;
