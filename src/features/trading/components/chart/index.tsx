// features/trading/components/chart/index.tsx

import { useState, useCallback } from 'react';
import { TimeFrame } from '../../types/chart.types';
import { useMarketStore } from '@/store/market-store';
import { useTradingPairs } from '../../hooks/chart/useTradingPairs';
import { useChartData } from '../../hooks/chart/useChartData';
import TradingViewChart from './trading-view-chart';
import ChartHeader from './chart-header';
import ChartSkeleton from './chart-skeleton';
import ChartError from './chart-error';
import { ChartComponentProps } from '../../types/chart.types';

export default function ChartComponent({
  chainId,
  defaultChainId,
  selectedPool,
  poolsData,
  poolsLoading,
  poolsError,
  height = 450,
}: ChartComponentProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(TimeFrame.HOURLY);
  const { quoteDecimals } = useMarketStore();

  // Transform pools to trading pairs
  const availablePairs = useTradingPairs(poolsData);

  // Fetch chart data
  const { processedData, currentPrice, isLoading, error, refetch } = useChartData({
    chainId,
    defaultChainId,
    selectedTimeFrame,
    poolId: selectedPool?.orderBook,
    quoteDecimals,
  });

  // Determine symbol for chart
  const symbol =
    selectedPool?.coin ||
    (selectedPool ? `${selectedPool.baseSymbol}/${selectedPool.quoteSymbol}` : '');

  // Handle timeframe changes
  const handleTimeFrameChange = useCallback((timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
  }, []);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    refetch?.();
  }, [refetch]);

  // Loading state
  if (poolsLoading || isLoading) {
    return <ChartSkeleton height={height} showHeader={!selectedPool?.coin} />;
  }

  // Error state
  if (poolsError || error) {
    return (
      <ChartError
        error={poolsError || error || 'Unknown error'}
        onRetry={handleRetry}
        height={height}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-[450px] bg-black border border-white/20 rounded-lg overflow-hidden">
      {/* Show header only for non-coin pools */}
      {/* {!selectedPool?.coin && (
      <ChartHeader
        currentPrice={currentPrice || undefined}
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={handleTimeFrameChange}
      />
      )} */}

      {/* Chart container */}
      <div className="p-2" style={{ height: selectedPool?.coin ? '100%' : height }}>
        <TradingViewChart
          chainId={chainId}
          symbol={symbol}
          availablePairs={availablePairs}
          height="100%"
        />
      </div>
    </div>
  );
}
