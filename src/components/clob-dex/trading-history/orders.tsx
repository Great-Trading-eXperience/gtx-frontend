'use client';

import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { getExplorerUrl } from '@/constants/urls/urls-config';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { useCancelOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/useCancelOrder';
import { OrderData } from '@/lib/market-api';
import { formatPrice } from '@/lib/utils';
import { HexAddress } from '@/types/general/address';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  Clock,
  Loader2,
  Wallet2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { formatDate } from '../../../../helper';
import { ClobDexComponentProps } from '../clob-dex';

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

export default function OrderHistoryTable({
  address,
  chainId,
  defaultChainId,
  ordersData,
  ordersLoading,
  ordersError,
  selectedPool,
  marketOpenOrdersData,
  marketOpenOrdersLoading,
  marketAllOrdersData,
  marketAllOrdersLoading,
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
  }, [cancelDialogOpen, isProcessingCancel]);

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
  const isOrderCancelable = (order: OrderData | OpenOrderItem) => {
    return order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED';
  };

  // Type guard to check if an object is an OpenOrderItem
  const isOpenOrderItem = (order: OrderData | OpenOrderItem): order is OpenOrderItem => {
    return 'poolId' in order && 'transactionId' in order;
  };

  // Filtered orders based on selected pool
  const filteredOrders = selectedPool
    ? ordersData.filter(
        (order) => order.poolId?.toLowerCase() === selectedPool.id.toLowerCase()
      )
    : ordersData;
  // Helper function to get timestamp value from either order type
  const getTimestamp = (order: OpenOrderItem | OrderData): number => {
    if ('timestamp' in order) {
      // GraphQL order
      return Number(order.timestamp);
    } else {
      // Market API order
      return order.time;
    }
  };

  // Helper function to get fill percentage from either order type
  const getFillPercentage = (order: OpenOrderItem | OrderData): number => {
    if ('filled' in order && 'quantity' in order) {
      // GraphQL order
      return parseFloat(calculateFillPercentage(order.filled, order.quantity));
    } else {
      // Market API order
      return order.executedQty && order.origQty
        ? (parseFloat(order.executedQty) / parseFloat(order.origQty)) * 100
        : 0;
    }
  };

  // Helper function to get order ID for sorting
  const getOrderId = (order: OpenOrderItem | OrderData): string => {
    if ('poolId' in order) {
      // GraphQL order
      return order.poolId;
    } else {
      // Market API order
      return order.orderId;
    }
  };

  // Helper function to get price for sorting
  const getPrice = (order: OpenOrderItem | OrderData): number => {
    if ('price' in order) {
      // Both types have price, but they might be different types
      if (typeof order.price === 'string') {
        return parseFloat(order.price);
      } else {
        return Number(order.price);
      }
    }
    // Fallback
    return 0;
  };

  // Sort orders based on current sort configuration
  const sortedOrders = useMemo(() => [...(marketAllOrdersData || [])].sort((a, b) => {
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
      return sortConfig.direction === 'asc'
        ? getPrice(a) - getPrice(b)
        : getPrice(b) - getPrice(a);
    }
    return 0;
  }), [marketOpenOrdersData, sortConfig]);

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

  if (!sortedOrders || sortedOrders.length === 0) {
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
          {sortedOrders.map((order: OrderData | OpenOrderItem) => (
            <div
              key={order.orderId}
              className="grid grid-cols-7 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
            >
              <div className="text-gray-200">
                {formatDate(getTimestamp(order).toString())}
              </div>
              <div className="text-gray-200">{getPoolName(getOrderId(order))}</div>
              <div className="font-medium text-white">
                $
                {formatPrice(
                  formatUnits(BigInt(getPrice(order)), selectedPool?.quoteDecimals || 6)
                )}
              </div>
              <div
                className={order.side === 'Buy' ? 'text-emerald-400' : 'text-rose-400'}
              >
                {order.side}
              </div>
              <div className="font-medium text-white">
                {getFillPercentage(order)}%
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
                      
                      // Convert OrderData to OpenOrderItem format if needed
                      let orderForCancel: OpenOrderItem;
                      
                      if (isOpenOrderItem(order)) {
                        orderForCancel = order;
                      } else {
                        // First convert to unknown to avoid direct type casting errors
                        const baseOrder = {
                          chainId: Number(chainId ?? defaultChainId),
                          poolId: selectedPool?.id || '',
                          orderId: BigInt(order.orderId), // Convert string to bigint
                          id: order.id,
                          side: order.side,
                          timestamp: order.time,
                          transactionId: order.id,
                          price: order.price,
                          quantity: order.origQty,
                          filled: order.executedQty,
                          type: order.type,
                          status: order.status,
                          expiry: 0 // Default value as this might not be available in OrderData
                        };
                        
                        orderForCancel = baseOrder as unknown as OpenOrderItem;
                      }
                      
                      setSelectedOrder(orderForCancel);
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
