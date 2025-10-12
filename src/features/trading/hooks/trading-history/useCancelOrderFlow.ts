import { useEffect, useState } from 'react';
import { OpenOrderItem } from '@/graphql/gtx/clob';
import { useCancelOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/useCancelOrder';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { HexAddress } from '@/types/general/address';
import { NotificationState } from '../../types/trading-history';

export const useCancelOrderFlow = (
  selectedOrder: OpenOrderItem | null,
  selectedPool?: ProcessedPoolItem
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    success: true,
  });

  const {
    handleCancelOrder,
    isCancelOrderPending,
    isCancelOrderConfirming,
    isCancelOrderConfirmed,
    cancelOrderError,
    cancelOrderHash,
    resetCancelOrderState,
  } = useCancelOrder();

  // Handle successful cancellation
  useEffect(() => {
    if (cancelOrderHash && isCancelOrderConfirmed && isProcessing) {
      setNotification({
        open: true,
        success: true,
        message: `Successfully cancelled order #${selectedOrder?.orderId} for ${
          selectedOrder?.side === 'Buy' ? 'buying' : 'selling'
        } ${selectedPool?.coin}`,
        txHash: cancelOrderHash,
      });
      setIsProcessing(false);
    }
  }, [
    isCancelOrderConfirmed,
    cancelOrderHash,
    selectedOrder,
    selectedPool,
    isProcessing,
  ]);

  // Handle errors
  useEffect(() => {
    if (cancelOrderError && isProcessing) {
      setNotification({
        open: true,
        success: false,
        message:
          cancelOrderError instanceof Error
            ? cancelOrderError.message
            : 'Failed to cancel order',
      });
      setIsProcessing(false);
    }
  }, [cancelOrderError, isProcessing]);

  const executeCancelOrder = async () => {
    if (!selectedOrder || !selectedPool) return false;

    try {
      setIsProcessing(true);
      setNotification(prev => ({ ...prev, open: false }));

      const pool = {
        baseCurrency: selectedPool.baseTokenAddress as HexAddress,
        quoteCurrency: selectedPool.quoteTokenAddress as HexAddress,
        orderBook: selectedPool.orderBook as HexAddress,
      };

      await handleCancelOrder(pool, Number(selectedOrder.orderId));
      return true;
    } catch (error) {
      console.error('Error canceling order:', error);
      setIsProcessing(false);
      setNotification({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel order',
      });
      return false;
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
    if (!isProcessing) {
      resetCancelOrderState?.();
    }
  };

  return {
    notification,
    isProcessing: isCancelOrderPending || isCancelOrderConfirming,
    executeCancelOrder,
    closeNotification,
    resetState: resetCancelOrderState,
  };
};
