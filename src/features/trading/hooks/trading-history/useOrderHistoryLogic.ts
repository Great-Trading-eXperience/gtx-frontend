import { useMemo, useState } from 'react';
import {
  OrderItem,
  SortableOrderKey,
  SortDirection,
  getTimestamp,
  getFillPercentage,
  getOrderId,
  getPrice,
} from '../../utils/trading-history/order-history-helper';
import { OrderData } from '@/lib/market-api';

export const useOrderHistoryLogic = (marketAllOrdersData: OrderData[] | undefined) => {
  const [sortConfig, setSortConfig] = useState<{
    key: SortableOrderKey;
    direction: SortDirection;
  }>({
    key: 'timestamp',
    direction: 'desc',
  });

  const handleSort = (key: SortableOrderKey) => {
    setSortConfig(currentConfig => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedOrders = useMemo(() => {
    const orders = marketAllOrdersData ? [...marketAllOrdersData] : [];

    orders.sort((a, b) => {
      const key = sortConfig.key;

      if (key === 'timestamp') {
        return sortConfig.direction === 'asc'
          ? getTimestamp(a) - getTimestamp(b)
          : getTimestamp(b) - getTimestamp(a);
      } else if (key === 'filled') {
        return sortConfig.direction === 'asc'
          ? getFillPercentage(a) - getFillPercentage(b)
          : getFillPercentage(b) - getFillPercentage(a);
      } else if (key === 'orderId') {
        return sortConfig.direction === 'asc'
          ? getOrderId(a).localeCompare(getOrderId(b))
          : getOrderId(b).localeCompare(getOrderId(a));
      } else if (key === 'price') {
        const priceA = parseFloat(getPrice(a));
        const priceB = parseFloat(getPrice(b));
        return sortConfig.direction === 'asc' ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });
    return orders;
  }, [marketAllOrdersData, sortConfig]); // CRITICAL FIX: Added marketAllOrdersData dependency

  return {
    sortedOrders: sortedOrders as OrderItem[],
    sortConfig,
    handleSort,
  };
};
