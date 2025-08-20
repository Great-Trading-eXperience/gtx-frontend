import { Card } from '@/components/ui/card';

export default function TradingHistorySkeleton() {
  return (
    <div className="relative mt-1">
      <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />
      <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />

      <Card className="overflow-hidden rounded-lg border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 shadow-lg backdrop-blur-sm animate-pulse">
        <div className="space-y-3 p-3">
          {/* Tab headers skeleton */}
          <div className="relative">
            <div className="flex w-full justify-start gap-6 bg-transparent">
              <div className="h-9 w-28 bg-gray-800/50 rounded-lg"></div>
              <div className="h-9 w-32 bg-gray-800/50 rounded-lg"></div>
              <div className="h-9 w-24 bg-gray-800/50 rounded-lg"></div>
            </div>
          </div>

          {/* Content area skeleton */}
          <div className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-4">
            {/* Table header skeleton */}
            <div className="flex justify-between mb-4">
              <div className="h-4 w-16 bg-gray-800/50 rounded"></div>
              <div className="h-4 w-20 bg-gray-800/50 rounded"></div>
              <div className="h-4 w-16 bg-gray-800/50 rounded"></div>
              <div className="h-4 w-16 bg-gray-800/50 rounded"></div>
            </div>

            {/* Table rows skeleton */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-800/20 last:border-0">
                <div className="h-4 w-14 bg-gray-700/50 rounded"></div>
                <div className="h-4 w-20 bg-gray-700/50 rounded"></div>
                <div className="h-4 w-16 bg-gray-700/50 rounded"></div>
                <div className="h-4 w-18 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/50 to-transparent" />
    </div>
  );
}