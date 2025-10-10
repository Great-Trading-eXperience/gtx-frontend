import { memo } from 'react';
import { TimeFrame } from '../../types/chart.types';
import TimeFrameSelector from './time-frame-selector';

interface ChartHeaderProps {
  currentPrice?: string;
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  priceChange?: number;
  priceChangePercent?: number;
}

function ChartHeader({
  currentPrice,
  selectedTimeFrame,
  onTimeFrameChange,
  priceChange,
  priceChangePercent,
}: ChartHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
      <div className="flex items-center gap-4">
        {currentPrice && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{currentPrice}</span>
            {priceChange !== undefined && (
              <span
                className={`text-sm ${
                  priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}
                {priceChangePercent && ` (${priceChangePercent.toFixed(2)}%)`}
              </span>
            )}
          </div>
        )}
      </div>

      <TimeFrameSelector
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={onTimeFrameChange}
      />
    </div>
  );
}

export default memo(ChartHeader);
