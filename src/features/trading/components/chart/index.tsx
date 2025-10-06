
import { useTradingPairs } from '../../hooks/chart/useTradingPairs';
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
  // Transform pools to trading pairs
  const availablePairs = useTradingPairs(poolsData);

  // Determine symbol for chart
  const symbol =
    selectedPool?.coin ||
    (selectedPool ? `${selectedPool.baseSymbol}/${selectedPool.quoteSymbol}` : '');

  // Loading state
  if (poolsLoading) {
    return <ChartSkeleton height={height} showHeader={!selectedPool?.coin} />;
  }

  // Error state
  if (poolsError) {
    return (
      <ChartError
        error={poolsError || 'Unknown error'}
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
