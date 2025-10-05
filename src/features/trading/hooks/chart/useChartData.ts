
import { TimeFrame } from '../../types/chart.types';
import { useCandlestickData } from './useCandlestickData';
import { useProcessedChartData } from './useProcessedChartData';

interface UseChartDataParams {
  chainId: number;
  defaultChainId: number;
  selectedTimeFrame: TimeFrame;
  poolId?: string;
  quoteDecimals: number;
}

export function useChartData(params: UseChartDataParams) {
  const { chainId, defaultChainId, selectedTimeFrame, poolId, quoteDecimals } = params;

  const { data, isLoading, error, refetch } = useCandlestickData({
    chainId,
    defaultChainId,
    selectedTimeFrame,
    poolId,
  });

  const { processedData, currentPrice } = useProcessedChartData({
    data,
    quoteDecimals,
  });

  return {
    processedData,
    currentPrice,
    isLoading,
    error,
    refetch,
  };
}
