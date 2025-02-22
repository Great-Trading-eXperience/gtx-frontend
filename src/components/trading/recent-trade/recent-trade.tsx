import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { LIQUIDBOOK_GRAPHQL_URL } from '@/constants/subgraph-url';
import { matchOrderEvents } from '@/graphql/liquidbook/liquidbook.query';
import { MatchOrderEvent, MatchOrderEventResponse } from '@/types/web3/liquidbook/matchOrderEvents';
import { formatUnits } from 'viem';

interface Trade {
  price: number;
  time: string;
  size: number;
  side: 'Buy' | 'Sell';
  total?: number;
}

// Helper function to calculate price from tick
const calculatePrice = (tick: string): number => {
  return Math.pow(1.0001, parseInt(tick));
};

const formatTime = (timestamp: string): string => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toTimeString().split(' ')[0];
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const RecentTradesComponent = () => {
  const [mounted, setMounted] = useState(false);

  // Query for match order events
  const {
    data,
    isLoading,
    error
  } = useQuery<MatchOrderEventResponse>({
    queryKey: ['matchOrders'],
    queryFn: async () => {
      return await request(
        LIQUIDBOOK_GRAPHQL_URL,
        matchOrderEvents
      );
    },
    refetchInterval: 1000,
    staleTime: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const processTrades = (events: MatchOrderEvent[]): Trade[] => {
    return events
      .map(event => {
        const trade: Trade = {
          price: calculatePrice(event.tick),
          size: Number(event.volume),
          side: event.is_buy ? 'Buy' : 'Sell' as const,
          time: formatTime(String(event.timestamp)),
        };
        return trade;
      })
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 25);
  };

  const calculateTotal = (trades: Trade[]): Trade[] => {
    let runningTotal = 0;
    return trades.map(trade => {
      runningTotal += trade.size;
      return { ...trade, total: runningTotal };
    });
  };

  if (!mounted || isLoading) {
    return <RecentTradesSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-b-lg p-4">
        Error loading trades: {error.toString()}
      </div>
    );
  }

  const trades = calculateTotal(processTrades(data?.matchOrderEvents.items || []));

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white shadow-lg">
      <div className="flex flex-col h-[360px] rounded-lg overflow-hidden">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-3 mb-2 text-gray-500 dark:text-gray-400 text-sm px-4 mt-2">
            <div>Price</div>
            <div className="text-center">Time</div>
            <div className="text-right">Size</div>
          </div>
        </div>
        <div className="overflow-auto [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-900">
          <div className="flex flex-col space-y-[5px]">
            {trades.map((trade, i) => (
              <div key={i} className="relative group">
                <div
                  className={`absolute left-0 top-0 bottom-0 ${trade.side === 'Buy'
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-red-100 dark:bg-[#FF6978] dark:bg-opacity-20'
                    }`}
                  style={{
                    width: `${(trade.total || 0) / Math.max(...trades.map(t => t.total || 0)) * 100}%`
                  }}
                />
                <div className="relative grid grid-cols-3 py-1 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 text-xs font-light px-4">
                  <div className={`${trade.side === 'Buy'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-[#FF6978]'
                    }`}>
                    {formatPrice(trade.price)}
                  </div>
                  <div className="text-center text-gray-600 dark:text-gray-300">{trade.time}</div>
                  <div className="text-right text-gray-600 dark:text-gray-300">
                    {formatPrice(Number(formatUnits(BigInt(trade.size), 6)))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentTradesSkeleton = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-b-lg text-gray-900 dark:text-white h-[618px] p-4">
      <div className="grid grid-cols-3 mb-2 text-gray-400 text-sm">
        <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded justify-self-center" />
        <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded justify-self-end" />
      </div>

      <div className="space-y-[5px] mt-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid grid-cols-3 py-1">
            <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/50 rounded" />
            <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/50 rounded justify-self-center" />
            <div className="w-16 h-3 bg-gray-100 dark:bg-gray-800/50 rounded justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTradesComponent;

