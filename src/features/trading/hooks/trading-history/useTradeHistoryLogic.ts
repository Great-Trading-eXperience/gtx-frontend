import { useMemo, useState } from 'react';
import { TradeItem } from '@/graphql/gtx/clob';

export type SortableTradeKey = 'timestamp' | 'quantity' | 'price';

export const useTradeHistoryLogic = (userTradesData: TradeItem[] | undefined) => {
  const [sortConfig, setSortConfig] = useState<{
    key: SortableTradeKey;
    direction: 'asc' | 'desc';
  }>({
    key: 'timestamp',
    direction: 'desc',
  });

  const handleSort = (key: SortableTradeKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedTrades = useMemo(() => {
    const trades = userTradesData ? [...userTradesData] : [];

    trades.sort((a, b) => {
      const key = sortConfig.key;

      if (key === 'timestamp') {
        return sortConfig.direction === 'asc'
          ? a.timestamp - b.timestamp
          : b.timestamp - a.timestamp;
      }

      const aPrice = BigInt(a.order.price);
      const bPrice = BigInt(b.order.price);
      const aQuantity = BigInt(a.order.quantity);
      const bQuantity = BigInt(b.order.quantity);

      if (key === 'price') {
        const diff = aPrice - bPrice;
        const sortResult = diff < 0n ? -1 : diff > 0n ? 1 : 0;
        return sortConfig.direction === 'asc' ? sortResult : -sortResult;
      }

      if (key === 'quantity') {
        const diff = aQuantity - bQuantity;
        const sortResult = diff < 0n ? -1 : diff > 0n ? 1 : 0;
        return sortConfig.direction === 'asc' ? sortResult : -sortResult;
      }
      return 0;
    });

    return trades;
  }, [userTradesData, sortConfig]);

  return {
    sortedTrades,
    sortConfig,
    handleSort,
  };
};
