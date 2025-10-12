import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/_components/ui/dialog';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { formatPrice } from '@/lib/utils';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { AlertCircle, Loader2 } from 'lucide-react';
import { formatUnits } from 'viem';
import { calculateFillPercentage } from '../../../utils/trading-history/order-history-helper';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OpenOrderItem | null;
  pool?: ProcessedPoolItem;
  poolName: string;
  isProcessing: boolean;
  onConfirm: () => void;
}

export const CancelOrderDialog = ({
  open,
  onOpenChange,
  order,
  pool,
  poolName,
  isProcessing,
  onConfirm,
}: CancelOrderDialogProps) => {
  if (!order) return null;

  const getStatusStyle = (status: string) => {
    const styles = {
      OPEN: 'bg-blue-900/30 text-blue-300',
      PARTIALLY_FILLED: 'bg-amber-900/30 text-amber-300',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-800/30 text-gray-400';
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800/30 text-gray-200">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to cancel this order?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-gray-800/30 p-4 border border-gray-700/30">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-gray-400">Order ID:</div>
              <div className="font-medium text-gray-200">#{order.orderId.toString()}</div>

              <div className="text-gray-400">Pool:</div>
              <div className="font-medium text-gray-200">{poolName}</div>

              <div className="text-gray-400">Side:</div>
              <div
                className={`font-medium ${
                  order.side === 'Buy' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {order.side}
              </div>

              <div className="text-gray-400">Price:</div>
              <div className="font-medium text-gray-200">
                ${formatPrice(formatUnits(BigInt(order.price), pool?.quoteDecimals || 6))}
              </div>

              <div className="text-gray-400">Filled:</div>
              <div className="font-medium text-gray-200">
                {calculateFillPercentage(order.filled, order.quantity)}%
              </div>

              <div className="text-gray-400">Status:</div>
              <div className="font-medium">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-amber-950/30 p-3 text-sm text-amber-300 border border-amber-900/30">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              Cancelling this order will remove it from the orderbook. This action cannot
              be undone.
            </span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-gray-100"
            disabled={isProcessing}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Cancel Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
