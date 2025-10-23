import { useState, useEffect, useCallback } from 'react';
import { parseUnits } from 'viem';

type HexAddress = `0x${string}`;

interface UseSlippageCalculationProps {
  orderType: 'limit' | 'market';
  quantity: string;
  side: number;
  slippageValue: string;
  selectedPool?: {
    baseDecimals: number;
    quoteDecimals: number;
  };
  pool?: {
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
    orderBook: HexAddress;
  };
  getMarketOrderSlippageInfo?: (
    pool: any,
    quantity: bigint,
    side: number,
    slippageBps: number
  ) => Promise<any>;
  enabled?: boolean;
}

export function useSlippageCalculation({
  orderType,
  quantity,
  side,
  slippageValue,
  selectedPool,
  pool,
  getMarketOrderSlippageInfo,
  enabled = true,
}: UseSlippageCalculationProps) {
  const [slippageInfo, setSlippageInfo] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setSlippageInfo(null);
  }, [side, orderType]);

  const calculateSlippage = useCallback(async () => {
    if (
      !enabled ||
      orderType !== 'market' ||
      !quantity ||
      !selectedPool ||
      !pool ||
      !getMarketOrderSlippageInfo
    ) {
      setSlippageInfo(null);
      setIsCalculating(false);
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (quantityNum <= 0) {
      setSlippageInfo(null);
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);

    try {
      const decimals =
        side === 0 ? selectedPool.quoteDecimals : selectedPool.baseDecimals;
      const quantityBigInt = parseUnits(quantity, decimals);
      const slippageBps = Math.round(parseFloat(slippageValue) * 100);

      const info = await getMarketOrderSlippageInfo(
        pool,
        quantityBigInt,
        side,
        slippageBps
      );
      setSlippageInfo(info);
    } catch (error) {
      console.error('Failed to calculate slippage:', error);
      setSlippageInfo(null);
    } finally {
      setIsCalculating(false);
    }
  }, [
    enabled,
    orderType,
    quantity,
    selectedPool,
    pool,
    side,
    slippageValue,
    getMarketOrderSlippageInfo,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(calculateSlippage, 500);
    return () => clearTimeout(timeoutId);
  }, [calculateSlippage]);

  return {
    slippageInfo,
    isCalculating,
    recalculate: calculateSlippage,
  };
}
