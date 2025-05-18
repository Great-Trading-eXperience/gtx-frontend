'use client';

import { ClobDexComponentProps } from '../clob-dex';
import { OpenOrderItem, PoolItem } from '@/graphql/gtx/clob';
import { formatPrice } from '@/lib/utils';
import { useMarketStore } from '@/store/market-store';
import {
  ArrowDownUp,
  ChevronDown,
  Clock,
  Loader2,
  Wallet2,
  BookOpen,
  X,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { formatDate } from '../../../../helper';
import { useCancelOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/useCancelOrder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HexAddress } from '@/types/general/address';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { getExplorerUrl } from '@/constants/urls/urls-config';
import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';

export interface OrderHistoryTableProps extends ClobDexComponentProps {
  ordersData: OpenOrderItem[];
  ordersLoading: boolean;
  ordersError: Error | null;
  selectedPool: ProcessedPoolItem;
}

export default function OrderHistoryTable({
  address,
  chainId,
  defaultChainId,
  ordersData,
  ordersLoading,
  ordersError,
  selectedPool,
}: OrderHistoryTableProps) {
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'filled' | 'orderId' | 'price';

  // Order cancelation state
  const [selectedOrder, setSelectedOrder] = useState<OpenOrderItem | null>(null);
  // Initialize the cancel order hook
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(true);
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>(
    undefined
  );

  // Get the explorer base URL for the current chain
  const getExplorerBaseUrl = () => {
    try {
      return getExplorerUrl(chainId);
    } catch (error) {
      console.error('Failed to get explorer URL:', error);
      return '';
    }
  };

  const {
    handleCancelOrder,
    isCancelOrderPending,
    isCancelOrderConfirming,
    isCancelOrderConfirmed,
    cancelOrderError,
    cancelOrderHash,
    resetCancelOrderState,
  } = useCancelOrder();

  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: SortDirection;
  }>({
    key: 'timestamp',
    direction: 'desc',
  });

  // Watch for transaction status changes to trigger notifications
  useEffect(() => {
    if (cancelOrderHash && isCancelOrderConfirmed && isProcessingCancel) {
      // Show success notification when cancellation is confirmed
      setNotificationSuccess(true);
      setNotificationMessage(
        `Successfully cancelled order #${selectedOrder?.orderId} for ${
          selectedOrder?.side === 'Buy' ? 'buying' : 'selling'
        } ${selectedPool?.coin}`
      );
      setNotificationTxHash(cancelOrderHash);
      setNotificationOpen(true);
      setIsProcessingCancel(false);

      // Close the cancel dialog
      setCancelDialogOpen(false);
    }
  }, [
    isCancelOrderConfirmed,
    cancelOrderHash,
    selectedOrder,
    selectedPool,
    isProcessingCancel,
  ]);

  // Watch for errors to show in notification
  useEffect(() => {
    if (cancelOrderError && isProcessingCancel) {
      // Show error notification
      setNotificationSuccess(false);
      setNotificationMessage(
        cancelOrderError instanceof Error
          ? cancelOrderError.message
          : 'Failed to cancel order'
      );
      setNotificationTxHash(undefined);
      setNotificationOpen(true);
      setIsProcessingCancel(false);
    }
  }, [cancelOrderError, isProcessingCancel]);

  // Reset notification state when dialog closes
  useEffect(() => {
    if (!cancelDialogOpen) {
      // Small delay to ensure dialog is fully closed before resetting
      const timer = setTimeout(() => {
        if (!isProcessingCancel) {
          resetCancelOrderState?.();
          setSelectedOrder(null);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [cancelDialogOpen, isProcessingCancel, resetCancelOrderState]);

  const handleSort = (key: SortableKey) => {
    setSortConfig(currentConfig => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const calculateFillPercentage = (filled: string, quantity: string): string => {
    if (!filled || !quantity) return '0';
    const filledBigInt = BigInt(filled);
    const quantityBigInt = BigInt(quantity);
    if (quantityBigInt === 0n) return '0';
    return ((filledBigInt * 100n) / quantityBigInt).toString();
  };

  // Function to handle order cancellation
  const onCancelOrder = async () => {
    if (!selectedOrder || !selectedPool) return;

    try {
      setIsProcessingCancel(true);
      // Reset any previous notification state
      setNotificationOpen(false);

      // Create pool object for the cancel order function
      const pool = {
        baseCurrency: selectedPool.baseTokenAddress as HexAddress,
        quoteCurrency: selectedPool.quoteTokenAddress as HexAddress,
        orderBook: selectedPool.orderBook as HexAddress,
      };

      console.log('Cancelling order:', {
        selectedOrder,
        selectedPool,
        poolObject: pool,
        orderIdToCancel: Number(selectedOrder.orderId),
      });

      await handleCancelOrder(pool, Number(selectedOrder.orderId));

      // Dialog will be closed by the useEffect when confirmed
    } catch (error) {
      console.error('Error canceling order:', error);
      setIsProcessingCancel(false);

      // Show error notification
      setNotificationSuccess(false);
      setNotificationMessage(
        error instanceof Error ? error.message : 'Failed to cancel order'
      );
      setNotificationOpen(true);
    }
  };

  // Handler for notification close
  const handleNotificationClose = () => {
    setNotificationOpen(false);
    // Reset cancellation state when notification is closed
    if (!isProcessingCancel) {
      resetCancelOrderState?.();
    }
  };

  // Check if order is cancelable (only open or partially filled orders can be canceled)
  const isOrderCancelable = (order: OpenOrderItem) => {
    return order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED';
  };

  const sortedOrders = [...(ordersData || [])].sort((a, b) => {
    const key = sortConfig.key;

    if (key === 'timestamp') {
      return sortConfig.direction === 'asc'
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp;
    }
    if (key === 'filled') {
      const aPercentage = Number(calculateFillPercentage(a.filled, a.quantity));
      const bPercentage = Number(calculateFillPercentage(b.filled, b.quantity));
      return sortConfig.direction === 'asc'
        ? aPercentage - bPercentage
        : bPercentage - aPercentage;
    }
    if (key === 'orderId') {
      const aValue = Number.parseInt(a.orderId.toString() || '0');
      const bValue = Number.parseInt(b.orderId.toString() || '0');
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (key === 'price') {
      const aValue = BigInt(a.price || '0');
      const bValue = BigInt(b.price || '0');
      return sortConfig.direction === 'asc'
        ? aValue < bValue
          ? -1
          : aValue > bValue
          ? 1
          : 0
        : bValue < aValue
        ? -1
        : bValue > aValue
        ? 1
        : 0;
    }
    return 0;
  });

  const getPoolName = (poolId: string): string => {
    if (!selectedPool) return 'Unknown';
    return selectedPool.coin || 'Unknown';
  };

  if (!address) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wallet2 className="h-12 w-12 text-gray-400" />
          <p className="text-lg text-gray-200">
            Connect your wallet to view order history
          </p>
        </div>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-lg text-gray-200">Loading your order history...</p>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-rose-800/30 bg-rose-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <p className="text-lg text-rose-200">
            {ordersError instanceof Error ? ordersError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (!ordersData || ordersData.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BookOpen className="h-8 w-8 text-gray-400" />
          <p className="text-gray-200">No orders found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
        {/* Header */}
        <div className="grid grid-cols-7 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => handleSort('timestamp')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <Clock className="h-4 w-4" />
            <span>Time</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'timestamp' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Pool</div>
          <button
            onClick={() => handleSort('price')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Price</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'price' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Side</div>
          <button
            onClick={() => handleSort('filled')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Filled</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'filled' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Status</div>
          <div className="text-sm font-medium text-gray-200">Actions</div>
        </div>

        {/* Table Body with Scroll */}
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
          {sortedOrders.map(order => (
            <div
              key={order.orderId}
              className="grid grid-cols-7 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
            >
              <div className="text-gray-200">
                {formatDate(order.timestamp.toString())}
              </div>
              <div className="text-gray-200">{getPoolName(order.poolId)}</div>
              <div className="font-medium text-white">
                $
                {formatPrice(
                  formatUnits(BigInt(order.price), selectedPool?.quoteDecimals || 6)
                )}
              </div>
              <div
                className={order.side === 'Buy' ? 'text-emerald-400' : 'text-rose-400'}
              >
                {order.side}
              </div>
              <div className="font-medium text-white">
                {calculateFillPercentage(order.filled, order.quantity)}%
              </div>
              <div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'OPEN'
                      ? 'bg-blue-900/30 text-blue-300'
                      : order.status === 'FILLED'
                      ? 'bg-green-900/30 text-green-300'
                      : order.status === 'PARTIALLY_FILLED'
                      ? 'bg-amber-900/30 text-amber-300'
                      : order.status === 'CANCELLED'
                      ? 'bg-gray-800/50 text-gray-400'
                      : 'bg-gray-800/30 text-gray-400'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div>
                {isOrderCancelable(order) && (
                  <Button
                    variant="ghost"
                    className="h-8 rounded-md bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 hover:text-rose-100 transition-colors"
                    onClick={() => {
                      // Reset any previous notification state
                      setNotificationOpen(false);
                      setSelectedOrder(order);
                      setCancelDialogOpen(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={open => {
          if (!isProcessingCancel) {
            setCancelDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800/30 text-gray-200">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel this order?
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-3">
              <div className="rounded-lg bg-gray-800/30 p-4 border border-gray-700/30">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-400">Order ID:</div>
                  <div className="font-medium text-gray-200">
                    #{selectedOrder.orderId.toString()}
                  </div>

                  <div className="text-gray-400">Pool:</div>
                  <div className="font-medium text-gray-200">
                    {getPoolName(selectedOrder.poolId)}
                  </div>

                  <div className="text-gray-400">Side:</div>
                  <div
                    className={`font-medium ${
                      selectedOrder.side === 'Buy' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedOrder.side}
                  </div>

                  <div className="text-gray-400">Price:</div>
                  <div className="font-medium text-gray-200">
                    $
                    {formatPrice(
                      formatUnits(
                        BigInt(selectedOrder.price),
                        selectedPool?.quoteDecimals || 6
                      )
                    )}
                  </div>

                  <div className="text-gray-400">Filled:</div>
                  <div className="font-medium text-gray-200">
                    {calculateFillPercentage(
                      selectedOrder.filled,
                      selectedOrder.quantity
                    )}
                    %
                  </div>

                  <div className="text-gray-400">Status:</div>
                  <div className="font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.status === 'OPEN'
                          ? 'bg-blue-900/30 text-blue-300'
                          : selectedOrder.status === 'PARTIALLY_FILLED'
                          ? 'bg-amber-900/30 text-amber-300'
                          : 'bg-gray-800/30 text-gray-400'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancel warning */}
              <div className="flex items-start gap-2 rounded-md bg-amber-950/30 p-3 text-sm text-amber-300 border border-amber-900/30">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  Cancelling this order will remove it from the orderbook. This action
                  cannot be undone.
                </span>
              </div>
            </div>
          )}

          {/* {cancelOrderError && (
            <div className="flex items-center gap-2 rounded-md bg-rose-950/50 p-3 text-sm text-rose-300 border border-rose-900/30">
              <AlertCircle className="h-4 w-4" />
              <span>Error: {cancelOrderError instanceof Error ? cancelOrderError.message : 'Failed to cancel order'}</span>
            </div>
          )} */}

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isProcessingCancel) {
                  setCancelDialogOpen(false);
                }
              }}
              className="border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-gray-100"
              disabled={isCancelOrderPending || isCancelOrderConfirming}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              onClick={onCancelOrder}
              disabled={isCancelOrderPending || isCancelOrderConfirming}
            >
              {isCancelOrderPending || isCancelOrderConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCancelOrderPending ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                'Cancel Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notificationOpen}
        onClose={handleNotificationClose}
        message={notificationMessage}
        isSuccess={notificationSuccess}
        txHash={notificationTxHash}
        explorerBaseUrl={getExplorerBaseUrl()}
      />
    </>
  );
}
