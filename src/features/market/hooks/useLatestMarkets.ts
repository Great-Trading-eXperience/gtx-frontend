import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { fetchAndProcessMarketData } from './latestHook';
import { MarketData } from '../types/market-data';

interface UseMarketDataResult {
  marketData: MarketData[] | undefined;
  marketDataLoading: boolean;
  marketDataHasError: boolean;
  marketDataError: Error | null;
}

export function useMarketData(
  chainId: number = Number(DEFAULT_CHAIN)
): UseMarketDataResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['marketData', chainId],
    queryFn: () => fetchAndProcessMarketData(chainId),
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 60000,
  });

  return {
    marketData: data,
    marketDataLoading: isLoading,
    marketDataHasError: isError,
    marketDataError: error,
  };
}
