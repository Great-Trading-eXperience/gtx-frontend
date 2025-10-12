import { TradeItem } from '@/graphql/gtx/clob';
import { SortConfigTrade } from '../../types/trading-history';

/**
 * Sorts trades based on the provided sort configuration
 */
export const sortTrades = (trades: TradeItem[], sortConfig: SortConfigTrade): TradeItem[] => {
  return [...trades].sort((a, b) => {
    const { key, direction } = sortConfig;

    const compareValues = (aVal: bigint, bVal: bigint): number => {
      if (direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
    };

    switch (key) {
      case 'timestamp':
        return direction === 'asc'
          ? a.timestamp - b.timestamp
          : b.timestamp - a.timestamp;

      case 'quantity':
        return compareValues(BigInt(a.order.quantity), BigInt(b.order.quantity));

      case 'price':
        return compareValues(BigInt(a.order.price), BigInt(b.order.price));

      default:
        return 0;
    }
  });
};

/**
 * Toggles sort direction for the given key
 */
export const getNextSortConfig = (
  currentConfig: SortConfigTrade,
  key: SortConfigTrade['key']
): SortConfigTrade => ({
  key,
  direction:
    currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc',
});

/**
 * Formats transaction ID for display
 */
export const formatTransactionId = (txId: string): string => {
  return `${txId.slice(0, 6)}...${txId.slice(-4)}`;
};
