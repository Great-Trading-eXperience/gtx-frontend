import { TradeItem } from '@/graphql/gtx/clob';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { OrderData } from '@/lib/market-api';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { ClobDexComponentProps } from './chart.types';

export type SortDirection = 'asc' | 'desc';
export type SortableKeyOrder = 'timestamp' | 'filled' | 'orderId' | 'price';
export type SortableKeyTrades = 'timestamp' | 'quantity' | 'price';

export interface SortConfigOrder {
  key: SortableKeyOrder;
  direction: SortDirection;
}

export interface OrderHistoryTableProps extends ClobDexComponentProps {
  ordersData: OpenOrderItem[];
  ordersLoading: boolean;
  ordersError: Error | null;
  selectedPool?: ProcessedPoolItem;
  marketOpenOrdersData?: OrderData[];
  marketOpenOrdersLoading?: boolean;
  marketAllOrdersData?: OrderData[];
  marketAllOrdersLoading?: boolean;
}

export interface NotificationState {
  open: boolean;
  message: string;
  success: boolean;
  txHash?: string;
}

export interface SortConfigTrade {
  key: SortableKeyTrades;
  direction: SortDirection;
}

export interface TradeHistoryProps extends ClobDexComponentProps {
  userTradesData?: TradeItem[];
  tradesLoading: boolean;
  tradesError: Error | null;
  selectedPool?: ProcessedPoolItem;
}

export interface TradeRowProps {
  trade: TradeItem;
  selectedPool?: ProcessedPoolItem;
  baseDecimals: number;
  quoteDecimals: number;
  chainId?: number;
  defaultChainId: number;
}

export interface TableHeaderProps {
  sortConfig: SortConfigTrade;
  onSort: (key: SortableKeyTrades) => void;
}

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  variant?: 'default' | 'error';
}