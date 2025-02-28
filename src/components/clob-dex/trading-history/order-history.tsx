import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { formatAddress, formatDate } from '../../../../helper';
import { formatUnits } from 'viem';
import { orderHistorysQuery, poolsQuery } from '@/graphql/gtx/gtx.query';
import { HexAddress } from '@/types/web3/general/address';

// Interface for the user info
interface UserInfo {
  amount: string;
  currency: HexAddress;
  lockedAmount: string;
  name: string;
  symbol: string;
  user: HexAddress;
}

// Interface for order items from the updated query
interface OrderItem {
  expiry: number;
  filled: string;
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  side: string;
  status: string;
  timestamp: number;
  type: string;
  user: UserInfo;
}

// Interface for pool items to get coin names
interface Pool {
  id: string;
  coin: string;
}

// Updated response interfaces
interface OrdersResponse {
  orderss?: {
    items?: OrderItem[];
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

const formatPrice = (price: string): string => {
  return Number(formatUnits(BigInt(price), 12)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const calculateFillPercentage = (filled: string, quantity: string): string => {
  if (!filled || !quantity || filled === '0' || quantity === '0') return '0';
  
  const filledBN = BigInt(filled);
  const quantityBN = BigInt(quantity);
  
  if (quantityBN === 0n) return '0';
  
  // Calculate fill percentage
  const percentage = (filledBN * 10000n) / quantityBN;
  return (Number(percentage) / 100).toFixed(2);
};

const OrderHistoryTable = () => {
  const { address } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'filled' | 'orderId' | 'price';
  
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

  // Fetch order history data with wallet address as a filter
  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ['orderHistory', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet address not available');
      }
      
      const userAddress = address.toLowerCase() as HexAddress;
      
      const response = await request<OrdersResponse>(
        GTX_GRAPHQL_URL, 
        orderHistorysQuery,
        { userAddress }
      );
      
      // Log the response data for debugging
      console.log('Order History Query Response:', response);
      
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

  const orders = data?.orderss?.items || [];

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
      const aPercentage = Number(calculateFillPercentage(a.filled, a.quantity));
      const bPercentage = Number(calculateFillPercentage(b.filled, b.quantity));
      return sortConfig.direction === 'asc' ? aPercentage - bPercentage : bPercentage - aPercentage;
    }
    if (key === 'orderId') {
      const aValue = parseInt(a.orderId || '0');
      const bValue = parseInt(b.orderId || '0');
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (key === 'price') {
      const aValue = BigInt(a.price || '0');
      const bValue = BigInt(b.price || '0');
      return sortConfig.direction === 'asc' 
        ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
        : (bValue < aValue ? -1 : bValue > aValue ? 1 : 0);
    }
    return 0;
  });

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Order History</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatAddress(address)}
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('timestamp')}>
          Time
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${sortConfig.key === 'timestamp' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
        </div>
        <div>Pool</div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('price')}>
          Price
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${sortConfig.key === 'price' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
        </div>
        <div>Side</div>
        <div className="cursor-pointer flex items-center" onClick={() => handleSort('filled')}>
          Filled
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${sortConfig.key === 'filled' && sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
        </div>
        <div>Status</div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-6 gap-4 px-4 py-3 text-sm border-t border-gray-200 dark:border-gray-700">
              <div className="text-gray-600 dark:text-gray-400">{formatDate(order.timestamp.toString())}</div>
              <div className="text-gray-600 dark:text-gray-400">{getPoolName(order.poolId)}</div>
              <div className="text-gray-900 dark:text-white">${formatPrice(order.price)}</div>
              <div className={order.side === 'Buy' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                {order.side}
              </div>
              <div className="text-gray-900 dark:text-white">
                {calculateFillPercentage(order.filled, order.quantity)}%
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
    </div>
  );
};

export default OrderHistoryTable;