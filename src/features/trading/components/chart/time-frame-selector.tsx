import React from 'react';
import { TimeFrame, TimeFrameSelectorProps } from '../../types/chart.types';

const timeFrameButtons = [
  { label: '1M', value: TimeFrame.MINUTE },
  { label: '5M', value: TimeFrame.FIVE_MINUTE },
  { label: '1H', value: TimeFrame.HOURLY },
  { label: '1D', value: TimeFrame.DAILY },
] as const;

const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  selectedTimeFrame,
  onTimeFrameChange,
}) => {
  return (
    <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
      {timeFrameButtons.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onTimeFrameChange(value)}
          className={`px-3 py-1 text-xs ${
            selectedTimeFrame === value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default TimeFrameSelector;