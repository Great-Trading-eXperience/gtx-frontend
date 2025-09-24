export default function PlaceOrderSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-lg p-3 max-w-md mx-auto border border-gray-700/30 backdrop-blur-sm animate-pulse">
      {/* Order Type and Side Row */}
      <div className="grid gap-3 mb-3">
        {/* Order Type Selection Skeleton */}
        <div className="flex w-full gap-6 bg-transparent">
          <div className="flex-1 h-8 bg-gray-800/50 rounded-lg"></div>
          <div className="flex-1 h-8 bg-gray-800/50 rounded-lg"></div>
        </div>

        {/* Buy/Sell Selection Skeleton */}
        <div className="h-9 bg-gray-800/50 rounded-lg"></div>
      </div>

      {/* Price Field Skeleton */}
      <div className="space-y-1 mb-3">
        <div className="h-4 w-16 bg-gray-800/50 rounded ml-1"></div>
        <div className="h-10 bg-gray-800/50 rounded-lg"></div>
      </div>

      {/* Quantity Field Skeleton */}
      <div className="space-y-1 mb-3">
        <div className="h-4 w-20 bg-gray-800/50 rounded ml-1"></div>
        <div className="h-10 bg-gray-800/50 rounded-lg"></div>
        {/* Slider skeleton */}
        <div className="h-2 bg-gray-800/50 rounded-full mt-2"></div>
      </div>

      {/* Order Value Field Skeleton */}
      <div className="space-y-1 mb-6">
        <div className="h-4 w-24 bg-gray-800/50 rounded ml-1"></div>
        <div className="h-10 bg-gray-800/50 rounded-lg"></div>
      </div>

      {/* Submit Button Skeleton */}
      <div className="h-10 bg-gray-800/50 rounded-lg mb-3"></div>

      {/* Divider */}
      <div className="w-full border-t-2 border-gray-600 mt-3"></div>

      {/* Fees Section Skeleton */}
      <div className="flex flex-col w-full gap-3 text-xs text-gray-400 mt-3">
        <div className="flex flex-row justify-between">
          <div className="h-3 w-8 bg-gray-800/50 rounded"></div>
          <div className="h-3 w-16 bg-gray-800/50 rounded"></div>
        </div>
      </div>
    </div>
  );
}