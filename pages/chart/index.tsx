'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { formatUnits } from 'viem';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { matchOrderEvents } from '@/graphql/liquidbook/liquidbook.query';
import { calculatePrice } from '../../helper';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';

interface MatchOrderEvent {
  timestamp: number;
  tick: string;
  volume: string;
}

interface ProcessedVolumeData {
  timestamp: string;
  upVolume: number;
  downVolume: number;
  total: number;
  fiftyPercent: number;
}

interface MatchOrderEventResponse {
  matchOrderEvents: {
    items: MatchOrderEvent[];
  };
}

const formatVolume = (value: bigint, decimals = 6) => {
  const formatted = formatUnits(value, decimals);
  const num = Number.parseFloat(formatted);

  const config = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  if (num >= 1e9) {
    return (num / 1e9).toLocaleString('en-US', config) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toLocaleString('en-US', config) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toLocaleString('en-US', config) + 'K';
  } else {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }
};

const SplitVolumeIndicator = ({ height = 300 }: { height?: number }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [queryClient] = React.useState(() => new QueryClient());

  const { data, isLoading, error } = useQuery<MatchOrderEventResponse>({
    queryKey: ['tickEvents'],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL, matchOrderEvents);
    },
    refetchInterval: 500,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const processedData = useMemo(() => {
    if (!data?.matchOrderEvents?.items) return [];

    const sortedItems = [...data.matchOrderEvents.items]
      .sort((a, b) => a.timestamp - b.timestamp);

    return sortedItems.map((event, idx) => {
      const currentPrice = Number(calculatePrice(event.tick));
      let open: number, close: number;

      if (idx === 0) {
        open = currentPrice;
        close = currentPrice;
      } else {
        const previousPrice = Number(calculatePrice(sortedItems[idx - 1].tick));
        open = previousPrice;
        close = currentPrice;
      }

      const volumeValue = Number.parseFloat(formatUnits(BigInt(event.volume), 6));
      const isUpMove = close >= open;

      return {
        timestamp: new Date(event.timestamp * 1000).toLocaleTimeString(),
        upVolume: isUpMove ? volumeValue : 0,
        downVolume: isUpMove ? 0 : volumeValue,
        total: volumeValue,
        fiftyPercent: volumeValue / 2
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] rounded-b-lg text-gray-900 dark:text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] text-gray-900 dark:text-white flex items-center justify-center">
        Error: {error.toString()}
      </div>
    );
  }

  if (!data?.matchOrderEvents?.items || data.matchOrderEvents.items.length === 0) {
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center bg-white dark:bg-[#151924] rounded-lg">
        <svg 
          className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">No Volume Data</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for trading activity...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full p-2 bg-white dark:bg-[#151924] text-gray-900 dark:text-white rounded-b-lg">
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              stackOffset="none"
            >
              <XAxis 
                dataKey="timestamp"
                tick={{ 
                  fill: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                  fontSize: 12 
                }}
                interval="preserveStartEnd"
              />
              <YAxis 
                orientation="right"
                tick={{ 
                  fill: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                  fontSize: 12 
                }}
                tickFormatter={(value) => formatVolume(BigInt(Math.floor(value * 1e6)))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#151924' : '#ffffff',
                  border: `1px solid ${isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)'}`,
                  borderRadius: '4px',
                }}
                labelStyle={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                }}
                formatter={(value: number) => [
                  formatVolume(BigInt(Math.floor(value * 1e6))),
                  'Volume'
                ]}
              />
              <Bar
                dataKey="downVolume"
                stackId="volume"
                fill="#ef5350"
                opacity={0.5}
                isAnimationActive={false}
              />
              <Bar
                dataKey="upVolume"
                stackId="volume"
                fill="#26a69a"
                opacity={0.5}
                isAnimationActive={false}
              />
              {processedData.map((entry, index) => (
                <ReferenceLine
                  key={`fifty-${index}`}
                  y={entry.fiftyPercent}
                  segment={[
                    { x: index - 0.45, y: entry.fiftyPercent },
                    { x: index + 0.45, y: entry.fiftyPercent }
                  ]}
                  stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  strokeDasharray="3 3"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default SplitVolumeIndicator;