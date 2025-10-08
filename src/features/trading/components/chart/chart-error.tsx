import { memo, useState } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ChartErrorProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  height?: number;
}

function ChartError({ error, onRetry, onDismiss, height = 450 }: ChartErrorProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const errorMessage =
    typeof error === 'string' ? error : error?.message || 'An unknown error occurred';

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div
      className="w-full bg-gray-900 border border-red-500/20 rounded-lg flex items-center justify-center relative"
      style={{ height }}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}

      <div className="text-center px-6 max-w-md">
        {/* Error icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Error message */}
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Chart</h3>
        <p className="text-sm text-gray-400 mb-6">{errorMessage}</p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}

        {/* Additional help text */}
        <p className="text-xs text-gray-500 mt-4">
          If the problem persists, please contact support
        </p>
      </div>
    </div>
  );
}

export default memo(ChartError);
