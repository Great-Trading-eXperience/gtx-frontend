export default function MarketWidgetSkeleton() {
  return (
    <div className="w-full bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 text-white rounded-t-lg shadow-md">
      <div className="flex items-center h-16 px-4 animate-pulse">
        {/* Pair selector skeleton */}
        <div className="flex items-center space-x-2 w-72">
          <div className="h-9 w-40 bg-gray-800/50 rounded"></div>
          <div className="h-6 w-12 bg-gray-800/50 rounded"></div>
        </div>

        {/* Market data skeletons */}
        <div className="flex-1 flex gap-4 justify-between pl-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-12 bg-gray-800/50 rounded mb-1"></div>
              <div className="h-5 w-14 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}