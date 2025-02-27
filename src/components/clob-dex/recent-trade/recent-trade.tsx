import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { formatUnits } from 'viem';
import { tradesQuery } from '@/graphql/gtx/gtx.query';

// Define interface for the trades response based on the example data
interface TradeItem {
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
  transactionId: string;
  pool: {
    baseCurrency: string;
    coin: string;
    id: string;
    lotSize: string;
    maxOrderAmount: string;
    orderBook: string;
    quoteCurrency: string;
    timestamp: number;
  };
}

interface TradesResponse {
  tradess: {
    items: TradeItem[];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  };
}

interface Trade {
  price: number;
  time: string;
  size: number;
  side: 'Buy' | 'Sell'; // We'll use heuristics to determine side
  total?: number;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
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

  // Query for trade events
  const {
    data,
    isLoading,
    error
  } = useQuery<TradesResponse>({
    queryKey: ['trades'],
    queryFn: async () => {
      return await request(
        GTX_GRAPHQL_URL,
        tradesQuery
      );
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const processTrades = (items: TradeItem[]): Trade[] => {
    // Sort trades by timestamp (newest first)
    const sortedTrades = [...items].sort((a, b) => b.timestamp - a.timestamp);

    // Process each trade
    return sortedTrades.slice(0, 25).map((trade, index, array) => {
      // Convert price from string to number (assuming price is in wei)
      const priceNum = Number(formatUnits(BigInt(trade.price), 12)); // Adjust decimal places as needed

      // Determine the side of the trade using a simple heuristic:
      // If the price is higher than the previous trade, it's a buy, otherwise it's a sell
      // For the first trade, we'll default to 'Buy'
      let side: 'Buy' | 'Sell' = 'Buy';
      if (index > 0) {
        const prevPrice = Number(formatUnits(BigInt(array[index - 1].price), 12));
        side = priceNum >= prevPrice ? 'Buy' : 'Sell';
      }

      return {
        price: priceNum,
        size: Number(formatUnits(BigInt(trade.quantity), 18)), // Assuming quantity is in wei (18 decimals)
        side: side,
        time: formatTime(trade.timestamp),
      };
    });
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

  const trades = calculateTotal(processTrades(data?.tradess.items || []));

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white shadow-lg">
      <div className="flex flex-col h-[520px] rounded-lg overflow-hidden">
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
                    {formatPrice(trade.size)}
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