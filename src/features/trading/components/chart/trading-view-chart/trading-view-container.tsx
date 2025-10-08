import { memo } from 'react';
import { WifiOff } from 'lucide-react';
import Image from 'next/image';

interface TradingViewContainerProps {
  height: number | string;
  isReady: boolean;
  isConnected: boolean;
  error: Error | null;
}

function TradingViewContainer({
  height,
  isReady,
  isConnected,
  error,
}: TradingViewContainerProps) {
  return (
    <div className="w-full h-full relative" style={{ height }}>
      {/* Loading overlay */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="text-center">
            <Image src={'/logo/gtx.png'} alt='logo' width={100} height={100} />
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {isReady && !isConnected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <WifiOff className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-500">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 z-10">
          <div className="text-center px-6">
            <p className="text-red-500 mb-2">Failed to load chart</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        </div>
      )}

      {/* TradingView container */}
      <div id="tv_chart_container" className="w-full h-full" />
    </div>
  );
}

export default memo(TradingViewContainer);
