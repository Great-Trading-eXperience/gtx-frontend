"use client"

interface MarketListSkeletonProps {
  rowCount?: number
}

export function MarketListSkeleton({ rowCount = 5 }: MarketListSkeletonProps) {
  return (
    <div className="w-full min-w-[800px]">
      <div className="flex border-b border-white/10 pb-4 mb-2">
        <div className="text-left p-3 w-1/4">
          <div className="h-5 w-20 bg-white/70 rounded-md animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/4">
          <div className="h-5 w-16 bg-white/70 rounded-md animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/4">
          <div className="h-5 w-16 bg-white/70 rounded-md animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/4">
          <div className="h-5 w-20 bg-white/70 rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Generate the requested number of skeleton rows */}
      {[...Array(rowCount)].map((_, i) => (
        <div key={i} className="flex items-center border-b border-white/5 py-2 hover:bg-white/70">
          <div className="p-4 w-1/4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/70 rounded-md animate-pulse"></div>
              <div className="w-8 h-8 bg-white/70 rounded-full animate-pulse"></div>
              <div className="w-28 h-6 bg-white/70 rounded-md animate-pulse"></div>
            </div>
          </div>
          <div className="p-4 w-1/4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white/70 rounded-full animate-pulse"></div>
              <div className="w-16 h-5 bg-white/70 rounded-md animate-pulse"></div>
            </div>
          </div>
          <div className="p-4 w-1/4">
            <div className="w-20 h-6 bg-white/70 rounded-md animate-pulse"></div>
          </div>
          <div className="p-4 w-1/4">
            <div className="w-24 h-6 bg-white/70 rounded-md animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
