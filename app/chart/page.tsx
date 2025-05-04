'use client';

import dynamic from 'next/dynamic';

// Dynamically import the TradingView widget component with no SSR
const TVChartContainer = dynamic(
  () => import('@/components/trading-view-chart/trading-view-chart'),
  { ssr: false }
);

export default function ChartPage() {
  return (
    <div className="w-full h-screen bg-black">
      <TVChartContainer />
    </div>
  );
} 