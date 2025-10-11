import { useCallback } from 'react';
import { parseUnits } from 'viem';

interface UseOrderSubmissionProps {
  handlePlaceLimitOrder: (
    pool: any,
    price: bigint,
    quantity: bigint,
    side: number
  ) => Promise<void>;
  handlePlaceMarketOrder: (
    pool: any,
    quantity: bigint,
    side: number,
    slippageBps: number
  ) => Promise<void>;
  selectedPool?:
    | {
        baseDecimals: number;
        quoteDecimals: number;
      }
    | undefined;
  pool?: any;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useOrderSubmission({
  handlePlaceLimitOrder,
  handlePlaceMarketOrder,
  selectedPool,
  pool,
  onSuccess,
  onError,
}: UseOrderSubmissionProps) {
  const submitOrder = useCallback(
    async (
      orderType: 'limit' | 'market',
      side: number,
      price: string,
      quantity: string,
      slippageValue: string
    ) => {
      if (!selectedPool || !pool) {
        throw new Error('Pool data not available');
      }

      try {
        let quantityBigInt: bigint;
        const priceBigInt = parseUnits(price, selectedPool.quoteDecimals);

        if (orderType === 'market' && side === 0) {
          // Market BUY: quantity is USDC amount
          quantityBigInt = parseUnits(quantity, selectedPool.quoteDecimals);
        } else {
          // Limit orders and SELL market orders
          quantityBigInt = parseUnits(quantity, selectedPool.baseDecimals);
        }

        if (quantityBigInt <= 0n) {
          throw new Error('Quantity must be positive');
        }

        if (orderType === 'limit' && priceBigInt <= 0n) {
          throw new Error('Price must be positive');
        }

        if (orderType === 'limit') {
          await handlePlaceLimitOrder(pool, priceBigInt, quantityBigInt, side);
        } else {
          const slippageBps = Math.round(parseFloat(slippageValue) * 100);
          await handlePlaceMarketOrder(pool, quantityBigInt, side, slippageBps);
        }

        onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
      }
    },
    [
      handlePlaceLimitOrder,
      handlePlaceMarketOrder,
      selectedPool,
      pool,
      onSuccess,
      onError,
    ]
  );

  return { submitOrder };
}
