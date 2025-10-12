import { useMemo, useState } from 'react';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { OrderData } from '@/lib/market-api';
import { SortConfigOrder, SortableKeyOrder } from '../../types/trading-history';
import {
  getTimestamp,
  getFillPercentage,
  getOrderId,
  getPrice,
} from '../../utils/trading-history/order-history-helper';

export const useOrderSorter = (orders: (OrderData | OpenOrderItem)[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfigOrder>({
    key: 'timestamp',
    direction: 'desc',
  });

  const handleSort = (key: SortableKeyOrder) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const { key, direction } = sortConfig;
      const modifier = direction === 'asc' ? 1 : -1;

      switch (key) {
        case 'timestamp':
          return (getTimestamp(a) - getTimestamp(b)) * modifier;
        case 'filled':
          return (getFillPercentage(a) - getFillPercentage(b)) * modifier;
        case 'orderId':
          return getOrderId(a).localeCompare(getOrderId(b)) * modifier;
        case 'price':
          return (Number(getPrice(a)) - Number(getPrice(b))) * modifier;
        default:
          return 0;
      }
    });
  }, [orders, sortConfig]);

  return { sortedOrders, sortConfig, handleSort };
};
