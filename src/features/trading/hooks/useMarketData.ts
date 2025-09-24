import { useQuery } from '@tanstack/react-query';
import {
  fetchDepth,
  fetchTrades,
  fetchTickerPrice,
  fetchTicker24hr,
  DepthData,
  TickerPriceData,
  Ticker24hrData,
} from '@/lib/market-api';
import { transformApiTradeToTradeItem } from '@/lib/transform-data';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { TradeItem } from '@/graphql/gtx/clob'

export const useDepthData = (selectedPool: ProcessedPoolItem | undefined) => {
  return useQuery<DepthData | null>({
    queryKey: ['depth', selectedPool?.coin],
    queryFn: () => (selectedPool ? fetchDepth(selectedPool.coin) : null),
    enabled: !!selectedPool,
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useTickerPrice = (symbol: string) => {
  return useQuery<TickerPriceData | null>({
    queryKey: ['tickerPrice', symbol],
    queryFn: () => (symbol ? fetchTickerPrice(symbol) : null),
    enabled: !!symbol,
    staleTime: 5000,
    refetchInterval: 5000,
  });
};

export const useTicker24hr = (symbol: string) => {
  return useQuery<Ticker24hrData | undefined>({
    queryKey: ['ticker24hr', symbol],
    queryFn: () => (symbol ? fetchTicker24hr(symbol) : undefined),
    enabled: !!symbol,
    staleTime: 10000,
    refetchInterval: 30000,
  });
};

export const useTradesData = (selectedPool: ProcessedPoolItem | undefined) => {
  return useQuery<TradeItem[]>({
    queryKey: ['trades', selectedPool?.coin],
    queryFn: async () => {
      if (!selectedPool) return [];
      const data = await fetchTrades(selectedPool.coin);
      return data
        ? transformApiTradeToTradeItem(data, selectedPool.id, selectedPool.coin)
        : [];
    },
    enabled: !!selectedPool,
    staleTime: 10000,
    refetchInterval: 15000,
  });
};

export const useUserTrades = (
  selectedPool: ProcessedPoolItem | undefined,
  address: string | undefined
) => {
  return useQuery<TradeItem[]>({
    queryKey: ['userTrades', selectedPool?.coin, address],
    queryFn: async () => {
      if (!selectedPool || !address) return [];
      const userData = await fetchTrades(selectedPool.coin, 500, address);
      if (!userData) return [];

      const transformedUserData = transformApiTradeToTradeItem(
        userData,
        selectedPool.id,
        selectedPool.coin
      );
      const uniqueTradesMap = new Map();
      transformedUserData.forEach(trade => {
        uniqueTradesMap.set(trade.id, trade);
      });

      return Array.from(uniqueTradesMap.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );
    },
    enabled: !!(selectedPool && address),
    staleTime: 10000,
    refetchInterval: 20000,
  });
};
