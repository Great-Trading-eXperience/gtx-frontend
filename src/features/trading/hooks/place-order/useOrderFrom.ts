import { useState, useCallback, useEffect } from 'react';
import { formatUnits } from 'viem';
import { toast } from 'sonner';

enum OrderSideEnum {
  BUY = 0,
  SELL = 1,
}

interface OrderFormState {
  orderType: 'limit' | 'market';
  side: OrderSideEnum;
  price: string;
  quantity: string;
  total: string;
  slippageValue: string;
  autoSlippage: boolean;
}

interface UseOrderFormProps {
  selectedPool?: {
    baseDecimals: number;
    quoteDecimals: number;
    baseSymbol: string;
    quoteSymbol: string;
  };
  bestBidPrice?: string;
  bestAskPrice?: string;
  lastPrice?: string;
  slippageInfo?: any;
}

export function useOrderForm({
  selectedPool,
  bestBidPrice,
  bestAskPrice,
  lastPrice,
  slippageInfo,
}: UseOrderFormProps) {
  const [state, setState] = useState<OrderFormState>({
    orderType: 'market',
    side: OrderSideEnum.BUY,
    price: '',
    quantity: '',
    total: '0',
    slippageValue: '0.3',
    autoSlippage: true,
  });

  // Update price based on market data
  useEffect(() => {
    if (!selectedPool?.quoteDecimals) return;

    if (state.orderType === 'limit') {
      if (state.side === OrderSideEnum.BUY && bestAskPrice) {
        const normalizedPrice = formatUnits(
          BigInt(bestAskPrice),
          selectedPool.quoteDecimals
        );
        setState(prev => ({ ...prev, price: normalizedPrice }));
      } else if (state.side === OrderSideEnum.SELL && bestBidPrice) {
        const normalizedPrice = formatUnits(
          BigInt(bestBidPrice),
          selectedPool.quoteDecimals
        );
        setState(prev => ({ ...prev, price: normalizedPrice }));
      }
    } else if (lastPrice) {
      const normalizedPrice = formatUnits(BigInt(lastPrice), selectedPool.quoteDecimals);
      setState(prev => ({ ...prev, price: normalizedPrice }));
    }
  }, [
    bestBidPrice,
    bestAskPrice,
    state.side,
    state.orderType,
    selectedPool?.quoteDecimals,
    lastPrice,
  ]);

  // Calculate total
  useEffect(() => {
    if (state.orderType === 'limit') {
      if (state.price && state.quantity) {
        try {
          const priceValue = parseFloat(state.price);
          const quantityValue = parseFloat(state.quantity);
          setState(prev => ({
            ...prev,
            total: (priceValue * quantityValue).toFixed(6),
          }));
        } catch {
          setState(prev => ({ ...prev, total: '0' }));
        }
      } else {
        setState(prev => ({ ...prev, total: '0' }));
      }
    } else if (state.orderType === 'market' && state.quantity && slippageInfo) {
      try {
        const decimals = state.side === OrderSideEnum.BUY ? 18 : 6;
        const conservativeMinOut = formatUnits(slippageInfo.conservativeMinOut, decimals);
        setState(prev => ({
          ...prev,
          total: parseFloat(conservativeMinOut).toFixed(decimals === 18 ? 6 : 2),
        }));
      } catch {
        setState(prev => ({ ...prev, total: '0' }));
      }
    }
  }, [state.price, state.quantity, state.orderType, state.side, slippageInfo]);

  const setOrderType = useCallback((orderType: 'limit' | 'market') => {
    setState(prev => ({ ...prev, orderType }));
  }, []);

  const setSide = useCallback((side: OrderSideEnum) => {
    setState(prev => ({ ...prev, side, quantity: '', total: '0' }));
  }, []);

  const setPrice = useCallback((price: string) => {
    setState(prev => ({ ...prev, price }));
  }, []);

  const setQuantity = useCallback(
    (quantity: string) => {
      const numValue = parseFloat(quantity);

      if (
        state.side === OrderSideEnum.BUY &&
        state.orderType === 'market' &&
        numValue > 1000000
      ) {
        toast.warning('Amount exceeds reasonable limit of 1M USDC for market orders');
        return;
      }

      if (numValue > 1000000) {
        toast.warning('Amount seems unusually large');
      }

      setState(prev => ({ ...prev, quantity }));
    },
    [state.side, state.orderType]
  );

  const setSlippageValue = useCallback((slippageValue: string) => {
    setState(prev => ({ ...prev, slippageValue }));
  }, []);

  const setAutoSlippage = useCallback((autoSlippage: boolean) => {
    setState(prev => ({ ...prev, autoSlippage }));
  }, []);

  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      price: '',
      quantity: '',
      total: '0',
    }));
  }, []);

  const validate = useCallback(() => {
    if (!state.quantity || parseFloat(state.quantity) <= 0) {
      return { valid: false, error: 'Quantity must be positive' };
    }

    if (state.orderType === 'limit' && (!state.price || parseFloat(state.price) <= 0)) {
      return { valid: false, error: 'Price must be positive' };
    }

    return { valid: true };
  }, [state.quantity, state.price, state.orderType]);

  return {
    ...state,
    setOrderType,
    setSide,
    setPrice,
    setQuantity,
    setSlippageValue,
    setAutoSlippage,
    resetForm,
    validate,
    OrderSideEnum,
  };
}
