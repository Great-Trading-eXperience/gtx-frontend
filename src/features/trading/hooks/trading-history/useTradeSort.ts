import { useState, useMemo } from 'react';
import { TradeItem } from '@/graphql/gtx/clob';
import { SortableKeyTrades, SortConfigTrade } from '../../types/trading-history';
import {
  getNextSortConfig,
  sortTrades,
} from '../../utils/trading-history/trade-history-helper';

export const useTradeSort = (trades: TradeItem[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfigTrade>({
    key: 'timestamp',
    direction: 'desc',
  });

  const handleSort = (key: SortableKeyTrades) => {
    setSortConfig(prevConfig => getNextSortConfig(prevConfig, key));
  };

  const sortedTrades = useMemo(
    () => sortTrades(trades, sortConfig),
    [trades, sortConfig]
  );

  return {
    sortConfig,
    sortedTrades,
    handleSort,
  };
};
