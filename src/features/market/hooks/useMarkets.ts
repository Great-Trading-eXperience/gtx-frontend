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
  latestPrice: string;
  volume: string;
  volumeInQuote: string;
  quoteDecimals: number;
  baseDecimals: number;
  age: number;
  totalLiquidityInQuote: string;
  createdAt: number;
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
    
    // Format price
    const formattedPrice = formatNumber(
      Number(formatUnits(BigInt(market.latestPrice || '0'), market.quoteDecimals)),
      { decimals: 2, compact: true }
    );
    
    // Format volume using volumeInQuote
    const formattedVolume = formatNumber(
      Number(formatUnits(BigInt(market.volumeInQuote || '0'), market.quoteDecimals)),
      { decimals: 2, compact: true }
    );
    
    // Calculate age display from the age field (in seconds)
    const ageInSeconds = market.age;
    const ageInDays = Math.floor(ageInSeconds / (24 * 60 * 60));
    const ageInHours = Math.floor(ageInSeconds / (60 * 60));
    const ageInMinutes = Math.floor(ageInSeconds / 60);
    
    let ageDisplay;
    if (ageInDays > 0) {
      ageDisplay = `${ageInDays}D`;
    } else if (ageInHours > 0) {
      ageDisplay = `${ageInHours}H`;
    } else {
      ageDisplay = `${ageInMinutes}M`;
    }
    
    // Format liquidity with K/M/B notation
    let liquidityDisplay = '0';
    if (market.totalLiquidityInQuote && market.totalLiquidityInQuote !== '0') {
      const liquidityValue = parseFloat(market.totalLiquidityInQuote);
      if (!isNaN(liquidityValue) && isFinite(liquidityValue)) {
        const adjustedLiquidity = Math.abs(liquidityValue) / Math.pow(10, market.quoteDecimals);
        
        if (adjustedLiquidity >= 1000000000) {
          liquidityDisplay = `${(adjustedLiquidity / 1000000000).toFixed(1)}B`;
        } else if (adjustedLiquidity >= 1000000) {
          liquidityDisplay = `${(adjustedLiquidity / 1000000).toFixed(1)}M`;
        } else if (adjustedLiquidity >= 1000) {
          liquidityDisplay = `${(adjustedLiquidity / 1000).toFixed(1)}K`;
        } else {
          liquidityDisplay = adjustedLiquidity.toFixed(0);
        }
      }
    }

    return {
      id: market.poolId,
      name: market.baseAsset,
      pair: market.quoteAsset,
      starred: false,
      iconInfo,
      age: ageDisplay,
      timestamp: market.createdAt,
      price: formattedPrice,
      volume: formattedVolume,
      liquidity: liquidityDisplay,
    };
  });

  return {
    marketData: marketData,
    marketDataLoading: isLoading,
    marketDataHasError: isError,
    marketDataError: error,
  };
}
