import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  poolsPonderQuery,
  PoolsPonderResponse,
  poolsQuery,
  PoolsResponse,
} from '@/graphql/gtx/clob';
import { processPools } from '@/lib/market-data';
import { getUseSubgraph } from '@/utils/env';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { useMemo } from 'react';
import { useChainId } from 'wagmi';

export interface AvailableToken {
  address: string;
  symbol: string;
  name?: string;
  decimals: number;
  icon: string;
}

// Map token symbols to icon filenames
const getTokenIcon = (symbol: string): string => {
  const iconMap: Record<string, string> = {
    'WETH': 'eth.png',
    'ETH': 'eth.png',
    'BTC': 'bitcoin.png',
    'WBTC': 'bitcoin.png',
    'DOGE': 'doge.png',
    'LINK': 'link.png',
    'PEPE': 'pepe.png',
    'TRUMP': 'trump.png',
    'USDC': 'usdc.png',
    'SHIB': 'shiba.png',
    'FLOKI': 'floki.png',
    'MATIC': 'matic.png',
    'AAVE': 'aave.png',
  };
  return iconMap[symbol] || 'eth.png'; // Default to ETH icon
};

// Get full token name
const getTokenName = (symbol: string): string => {
  const nameMap: Record<string, string> = {
    'WETH': 'Wrapped Ethereum',
    'ETH': 'Ethereum',
    'USDC': 'USD Coin',
    'WBTC': 'Wrapped Bitcoin',
    'TRUMP': 'Trump Token',
    'PEPE': 'Pepe Token',
    'LINK': 'Chainlink',
    'DOGE': 'Dogecoin',
    'SHIB': 'Shiba Inu',
    'FLOKI': 'Floki Inu',
    'MATIC': 'Polygon',
    'AAVE': 'Aave',
  };
  return nameMap[symbol] || symbol;
};

export const useAvailableTokens = () => {
  const chainId = useChainId();
  const defaultChain = Number(DEFAULT_CHAIN);

  // Fetch pools data from GraphQL
  const { data: poolsData, isLoading, error } = useQuery<
    PoolsPonderResponse | PoolsResponse
  >({
    queryKey: ['pools-for-tokens', String(chainId ?? defaultChain)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });

  // Process pools and extract unique tokens
  const availableTokens = useMemo(async (): Promise<AvailableToken[]> => {
    if (!poolsData) return [];

    try {
      const processedPools = await processPools(poolsData);
      const tokenMap = new Map<string, AvailableToken>();

      // Extract tokens from each pool
      processedPools.forEach(pool => {
        // Add base token with actual decimals from pool data
        if (pool.baseToken && pool.baseSymbol) {
          const baseSymbol = typeof pool.baseSymbol === 'string' ? pool.baseSymbol : String(pool.baseSymbol);
          const baseDecimals = pool.baseCurrency?.decimals || pool.baseDecimals || 18;
          
          tokenMap.set(pool.baseToken.toLowerCase(), {
            address: pool.baseToken,
            symbol: baseSymbol,
            name: pool.baseCurrency?.name || getTokenName(baseSymbol),
            decimals: baseDecimals,
            icon: getTokenIcon(baseSymbol),
          });
        }

        // Add quote token with actual decimals from pool data
        if (pool.quoteToken && pool.quoteSymbol) {
          const quoteSymbol = typeof pool.quoteSymbol === 'string' ? pool.quoteSymbol : String(pool.quoteSymbol);
          const quoteDecimals = pool.quoteCurrency?.decimals || pool.quoteDecimals || 18;
          
          tokenMap.set(pool.quoteToken.toLowerCase(), {
            address: pool.quoteToken,
            symbol: quoteSymbol,
            name: pool.quoteCurrency?.name || getTokenName(quoteSymbol),
            decimals: quoteDecimals,
            icon: getTokenIcon(quoteSymbol),
          });
        }
      });

      const tokens = Array.from(tokenMap.values());
      
      // Sort tokens with WETH first, then USDC, then alphabetically
      return tokens.sort((a, b) => {
        if (a.symbol === 'WETH') return -1;
        if (b.symbol === 'WETH') return 1;
        if (a.symbol === 'USDC') return -1;
        if (b.symbol === 'USDC') return 1;
        return a.symbol.localeCompare(b.symbol);
      });
    } catch (error) {
      console.error('Error processing pools for tokens:', error);
      return [];
    }
  }, [poolsData]);

  // Use a separate query to resolve the async memoized value
  const { data: resolvedTokens = [], isLoading: isProcessing } = useQuery({
    queryKey: ['available-tokens-processed', poolsData],
    queryFn: () => availableTokens,
    enabled: !!poolsData,
  });

  return {
    tokens: resolvedTokens,
    isLoading: isLoading || isProcessing,
    error,
  };
};