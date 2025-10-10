export default function MarketDataTabsSkeleton() {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 shadow-lg backdrop-blur-sm animate-pulse">
      {/* Tab headers skeleton */}
      <div className="relative border-b border-gray-800/30 backdrop-blur-sm">
        <div className="flex w-full justify-start gap-1 bg-transparent px-4 py-1">
          <div className="w-1/2 h-12 bg-gray-800/40 rounded-lg"></div>
          <div className="w-1/2 h-12 bg-gray-800/30 rounded-lg"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-20 bg-gray-800/50 rounded"></div>
          <div className="h-4 w-16 bg-gray-800/50 rounded"></div>
        </div>
        
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 w-12 bg-gray-700/50 rounded"></div>
            <div className="h-4 w-16 bg-gray-700/50 rounded"></div>
          </div>
        ))}
      </div>

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/50 to-transparent" />
    </div>
  );
}