'use client';

import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';
import { getExplorerUrl } from '@/constants/urls/urls-config';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { OrderData } from '@/lib/market-api';
import { useEffect, useState } from 'react';
import { CancelOrderDialog } from './cancelOrderDialog';
import { ErrorState, LoadingState, NoOrdersState, NoWalletState } from './emptyStates';
import { OrderRow } from './orderRow';
import { TableHeader } from './tableHeader';
import { useCancelOrderFlow } from '../../../hooks/trading-history/useCancelOrderFlow';
import { useOrderSorter } from '../../../hooks/trading-history/useOrderSorter';
import { convertToOpenOrderItem, isOpenOrderItem } from '../../../utils/trading-history/order-history-helper';
import { OrderHistoryTableProps } from '@/features/trading/types/trading-history';

export default function OrderHistoryTable({
  address,
  chainId,
  defaultChainId,
  ordersData,
  ordersLoading,
  ordersError,
  selectedPool,
  marketAllOrdersData,
}: OrderHistoryTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OpenOrderItem | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { sortedOrders, sortConfig, handleSort } = useOrderSorter(
    marketAllOrdersData || []
  );

  const {
    notification,
    isProcessing,
    executeCancelOrder,
    closeNotification,
    resetState,
  } = useCancelOrderFlow(selectedOrder, selectedPool);

  const getExplorerBaseUrl = () => {
    try {
      return getExplorerUrl(chainId);
    } catch (error) {
      console.error('Failed to get explorer URL:', error);
      return '';
    }
  };

  const getPoolName = (poolId: string): string => {
    return selectedPool?.coin || 'Unknown';
  };

  const handleCancelClick = (order: OrderData | OpenOrderItem) => {
    const orderForCancel = isOpenOrderItem(order)
      ? order
      : convertToOpenOrderItem(
          order,
          Number(chainId ?? defaultChainId),
          selectedPool?.id || ''
        );

    setSelectedOrder(orderForCancel);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    const success = await executeCancelOrder();
    if (success) {
      setCancelDialogOpen(false);
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!cancelDialogOpen && !isProcessing) {
      const timer = setTimeout(() => {
        resetState?.();
        setSelectedOrder(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [cancelDialogOpen, isProcessing, resetState]);

  // Close dialog on successful confirmation
  useEffect(() => {
    if (notification.success && notification.open && cancelDialogOpen) {
      setCancelDialogOpen(false);
    }
  }, [notification, cancelDialogOpen]);

  // Render states
  if (!address) return <NoWalletState />;
  if (ordersLoading) return <LoadingState />;
  if (ordersError) return <ErrorState error={ordersError} />;
  if (!sortedOrders?.length) return <NoOrdersState />;

  return (
    <>
      <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
        <TableHeader sortConfig={sortConfig} onSort={handleSort} />

        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
          {sortedOrders.map(order => (
            <OrderRow
              key={order.orderId}
              order={order}
              selectedPool={selectedPool}
              poolName={getPoolName(order.orderId.toString())}
              onCancel={() => handleCancelClick(order)}
            />
          ))}
        </div>
      </div>

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        order={selectedOrder}
        pool={selectedPool}
        poolName={selectedOrder ? getPoolName(selectedOrder.poolId) : ''}
        isProcessing={isProcessing}
        onConfirm={handleConfirmCancel}
      />

      <NotificationDialog
        isOpen={notification.open}
        onClose={closeNotification}
        message={notification.message}
        isSuccess={notification.success}
        txHash={notification.txHash}
        explorerBaseUrl={getExplorerBaseUrl()}
      />
    </>
  );
}
