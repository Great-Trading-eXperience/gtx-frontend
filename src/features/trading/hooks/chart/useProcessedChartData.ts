import { useMemo, useRef } from 'react';
import { BucketData } from './useCandlestickData';
import {
  processCandleStickData,
  sortCandleData,
  getLatestPrice,
  ProcessedChartData,
} from '../../utils/chartDataUtils';

interface UseProcessedChartDataParams {
  data: BucketData[] | undefined;
  quoteDecimals: number;
}

// Deep equality check for data array
const areDataArraysEqual = (
  a: BucketData[] | undefined,
  b: BucketData[] | undefined
): boolean => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.id !== itemB.id ||
      itemA.openTime !== itemB.openTime ||
      itemA.open !== itemB.open ||
      itemA.high !== itemB.high ||
      itemA.low !== itemB.low ||
      itemA.close !== itemB.close ||
      itemA.volume !== itemB.volume
    ) {
      return false;
    }
  }
  return true;
};

export const useProcessedChartData = ({
  data,
  quoteDecimals,
}: UseProcessedChartDataParams) => {
  const previousDataRef = useRef<BucketData[] | undefined>();
  const previousProcessedRef = useRef<ProcessedChartData>({
    candlesticks: [],
    volumes: [],
  });

  const processedData = useMemo<ProcessedChartData>(() => {
    if (!data || data.length === 0) {
      return { candlesticks: [], volumes: [] };
    }

    // Use deep equality check to avoid unnecessary processing
    if (areDataArraysEqual(data, previousDataRef.current)) {
      return previousProcessedRef.current;
    }

    const sortedData = sortCandleData(data);
    const result = processCandleStickData(sortedData, quoteDecimals);

    previousDataRef.current = data;
    previousProcessedRef.current = result;

    return result;
  }, [data, quoteDecimals]);

  const currentPrice = useMemo(() => {
    return getLatestPrice(processedData.candlesticks, quoteDecimals);
  }, [processedData.candlesticks, quoteDecimals]);

  return {
    processedData,
    currentPrice,
  };
};
