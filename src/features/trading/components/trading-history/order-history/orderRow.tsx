import { Button } from '@/components/ui/button';
import { formatDate } from '@/helper';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { OrderData } from '@/lib/market-api';
import { formatPrice } from '@/lib/utils';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { X } from 'lucide-react';
import { formatUnits } from 'viem';
import {
  getFillPercentage,
  getPrice,
  getTimestamp,
  isOrderCancelable,
} from '../../../utils/trading-history/order-history-helper';

interface OrderRowProps {
  order: OrderData | OpenOrderItem;
  selectedPool?: ProcessedPoolItem;
  poolName: string;
  onCancel: () => void;
}

export const OrderRow = ({ order, selectedPool, poolName, onCancel }: OrderRowProps) => {
  const getStatusStyle = (status: string) => {
    const styles = {
      OPEN: 'bg-blue-900/30 text-blue-300',
      FILLED: 'bg-green-900/30 text-green-300',
      PARTIALLY_FILLED: 'bg-amber-900/30 text-amber-300',
      CANCELLED: 'bg-gray-800/50 text-gray-400',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-800/30 text-gray-400';
  };

  return (
    <div className="grid grid-cols-7 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40">
      <div className="text-gray-200">{formatDate(getTimestamp(order).toString())}</div>
      <div className="text-gray-200">{poolName}</div>
      <div className="font-medium text-white">
        $
        {formatPrice(
          formatUnits(BigInt(getPrice(order)), selectedPool?.quoteDecimals || 6)
        )}
      </div>
      <div className={order.side === 'Buy' ? 'text-emerald-400' : 'text-rose-400'}>
        {order.side}
      </div>
      <div className="font-medium text-white">{getFillPercentage(order).toFixed(0)}%</div>
      <div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>
      <div>
        {isOrderCancelable(order) && (
          <Button
            variant="ghost"
            className="h-8 rounded-md bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 hover:text-rose-100 transition-colors"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
