import { useQuery } from '@tanstack/react-query';
import { getIndexerUrl } from '@/constants/urls/urls-config';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { MarketData } from '../types/market-data';
import { getIconInfo } from '../services/get-icon-info';
import { formatUnits } from 'viem';
import { formatNumber } from '@/lib/utils';

interface UseMarketDataResult {
  marketData: MarketData[] | undefined;
  marketDataLoading: boolean;
  marketDataHasError: boolean;
  marketDataError: Error | null;
}

interface MarketApiResponse {
  poolId: string;
  baseAsset: string;
  quoteAsset: string;
  latestPrice: bigint;
  volume: bigint;
  quoteDecimals: number;
  baseDecimals: number;
}

export function useMarkets(chainId?: number): UseMarketDataResult {
  const currentChainId = chainId ?? Number(DEFAULT_CHAIN);

  const {
    data,
    isLoading,
    isError,
    error,
  }: {
    data: MarketApiResponse[] | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  } = useQuery({
    queryKey: ['markets', String(currentChainId)],
    queryFn: async () => {
      const url = getIndexerUrl(currentChainId);
      if (!url) throw new Error('Indexer URL not found');

      const response = await fetch(`${url}/api/markets`);
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      return response.json();
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const marketData: MarketData[] | undefined = data?.map(market => {
    const iconInfo = getIconInfo(market.baseAsset);
    const formattedPrice = formatNumber(
      Number(formatUnits(BigInt(market.latestPrice), market.quoteDecimals)),
      { decimals: 2, compact: true }
    );
    const formattedVolume = formatNumber(
      Number(formatUnits(BigInt(market.volume), market.quoteDecimals)),
      { decimals: 2, compact: true }
    );

    return {
      id: market.poolId,
      name: market.baseAsset,
      pair: market.quoteAsset,
      starred: false,
      iconInfo,
      age: '', //calculateAge(pool.timestamp),
      timestamp: 0, //pool.timestamp,
      price: formattedPrice,
      volume: formattedVolume,
      liquidity: '', //formatNumber(pool.maxOrderAmount),
    };
  });

  return {
    marketData: marketData,
    marketDataLoading: isLoading,
    marketDataHasError: isError,
    marketDataError: error,
  };
}
