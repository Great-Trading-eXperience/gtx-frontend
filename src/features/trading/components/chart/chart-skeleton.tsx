import { memo } from 'react';

interface ChartSkeletonProps {
  height?: number;
  showHeader?: boolean;
}

function ChartSkeleton({ height = 450, showHeader = true }: ChartSkeletonProps) {
  return (
    <div
      className="w-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden min-h-[450px"
      style={{ height }}
    >
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between p-3 border-b border-gray-700 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-8 w-32 bg-gray-700 rounded" />
            <div className="h-6 w-20 bg-gray-700 rounded" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-12 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      )}

      {/* Chart area skeleton */}
      <div className="p-4 space-y-4 animate-pulse">
        {/* Price axis */}
        <div className="flex justify-between">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 w-16 bg-gray-700 rounded" />
            ))}
          </div>

          {/* Candlestick simulation */}
          <div className="flex-1 flex items-end justify-around gap-1 px-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-2 bg-gray-700 rounded"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
        </div>

        {/* Time axis */}
        <div className="flex justify-around">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-4 w-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ChartSkeleton);
