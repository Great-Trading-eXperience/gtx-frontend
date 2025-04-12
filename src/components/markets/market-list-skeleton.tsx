"use client"

interface MarketListSkeletonProps {
  rowCount?: number
}

export function MarketListSkeleton({ rowCount = 5 }: MarketListSkeletonProps) {
  return (
    <div className="w-full min-w-[800px]">
      <div className="flex border-b border-white/5 pb-2">
        <div className="text-left p-3 w-1/5">
          <div className="h-5 w-16 bg-[#1A1A1A] rounded animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/5">
          <div className="h-5 w-12 bg-[#1A1A1A] rounded animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/5">
          <div className="h-5 w-14 bg-[#1A1A1A] rounded animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/5">
          <div className="h-5 w-16 bg-[#1A1A1A] rounded animate-pulse"></div>
        </div>
        <div className="text-left p-3 w-1/5">
          <div className="h-5 w-20 bg-[#1A1A1A] rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Generate the requested number of skeleton rows */}
      {[...Array(rowCount)].map((_, i) => (
        <div key={i} className="flex items-center border-b border-white/5 hover:bg-[#1A1A1A]/20">
          <div className="p-3 w-1/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#1A1A1A] rounded-sm animate-pulse"></div>
              <div className="w-6 h-6 bg-[#1A1A1A] rounded-full animate-pulse"></div>
              <div className="w-24 h-5 bg-[#1A1A1A] rounded animate-pulse"></div>
            </div>
          </div>
          <div className="p-2 w-1/5">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-[#1A1A1A] rounded animate-pulse"></div>
              <div className="w-10 h-5 bg-[#1A1A1A] rounded animate-pulse"></div>
            </div>
          </div>
          <div className="p-2 w-1/5">
            <div className="w-16 h-5 bg-[#1A1A1A] rounded animate-pulse"></div>
          </div>
          <div className="p-2 w-1/5">
            <div className="w-16 h-5 bg-[#1A1A1A] rounded animate-pulse"></div>
          </div>
          <div className="p-2 w-1/5">
            <div className="w-20 h-5 bg-[#1A1A1A] rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}