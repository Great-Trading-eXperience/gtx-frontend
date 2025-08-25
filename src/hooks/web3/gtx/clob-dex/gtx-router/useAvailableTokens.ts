import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { isFeatureEnabled } from '@/constants/features/features-config';
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
    'gsWETH': 'eth.png',
    'ETH': 'eth.png',
    'BTC': 'bitcoin.png',
    'WBTC': 'bitcoin.png',
    'gsWBTC': 'bitcoin.png',
    'DOGE': 'doge.png',
    'LINK': 'link.png',
    'PEPE': 'pepe.png',
    'TRUMP': 'trump.png',
    'USDC': 'usdc.png',
    'USDT': 'usdc.png',
    'gsUSDT': 'usdc.png',
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
      const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
      
      // Define preferred token addresses for crosschain mode
      const preferredCrosschainTokens: Record<string, string> = {
        "gsUSDT": "0xf2dc96d3e25f06e7458fF670Cf1c9218bBb71D9d",
        "gsWBTC": "0xd99813A6152dBB2026b2Cd4298CF88fAC1bCf748", 
        "gsWETH": "0x3ffE82D34548b9561530AFB0593d52b9E9446fC8"
      };

      // Create a map to track tokens for each symbol
      const symbolToTokens = new Map<string, Array<AvailableToken & { timestamp: number }>>();

      // Extract tokens from each pool
      processedPools.forEach(pool => {
        const poolTimestamp = pool.timestamp || 0;

        // Add base token with actual decimals from pool data
        if (pool.baseToken && pool.baseSymbol) {
          const baseSymbol = typeof pool.baseSymbol === 'string' ? pool.baseSymbol : String(pool.baseSymbol);
          const baseDecimals = pool.baseCurrency?.decimals || pool.baseDecimals || 18;
          
          const baseToken = {
            address: pool.baseToken,
            symbol: baseSymbol,
            name: pool.baseCurrency?.name || getTokenName(baseSymbol),
            decimals: baseDecimals,
            icon: getTokenIcon(baseSymbol),
            timestamp: poolTimestamp,
          };

          if (!symbolToTokens.has(baseSymbol)) {
            symbolToTokens.set(baseSymbol, []);
          }
          symbolToTokens.get(baseSymbol)!.push(baseToken);
        }

        // Add quote token with actual decimals from pool data
        if (pool.quoteToken && pool.quoteSymbol) {
          const quoteSymbol = typeof pool.quoteSymbol === 'string' ? pool.quoteSymbol : String(pool.quoteSymbol);
          const quoteDecimals = pool.quoteCurrency?.decimals || pool.quoteDecimals || 18;
          
          const quoteToken = {
            address: pool.quoteToken,
            symbol: quoteSymbol,
            name: pool.quoteCurrency?.name || getTokenName(quoteSymbol),
            decimals: quoteDecimals,
            icon: getTokenIcon(quoteSymbol),
            timestamp: poolTimestamp,
          };

          if (!symbolToTokens.has(quoteSymbol)) {
            symbolToTokens.set(quoteSymbol, []);
          }
          symbolToTokens.get(quoteSymbol)!.push(quoteToken);
        }
      });

      // Select the best token for each symbol
      const finalTokens: AvailableToken[] = [];
      
      symbolToTokens.forEach((tokensList, symbol) => {
        let selectedToken: AvailableToken;

        if (crosschainEnabled && preferredCrosschainTokens[symbol]) {
          // When crosschain is enabled, prefer the specific address if available
          const preferredAddress = preferredCrosschainTokens[symbol].toLowerCase();
          const preferredToken = tokensList.find(t => t.address.toLowerCase() === preferredAddress);
          
          if (preferredToken) {
            console.log(`[TOKENS] ✅ Using preferred crosschain token: ${symbol} -> ${preferredAddress}`);
            selectedToken = { ...preferredToken };
          } else {
            console.log(`[TOKENS] ⚠️ Preferred crosschain token not found for ${symbol}, using latest`);
            selectedToken = tokensList.sort((a, b) => b.timestamp - a.timestamp)[0];
          }
        } else {
          // When crosschain is disabled, or for non-crosschain symbols, use the latest
          selectedToken = tokensList.sort((a, b) => b.timestamp - a.timestamp)[0];
        }

        finalTokens.push(selectedToken);
      });

      const tokens = finalTokens;
      
      // Sort tokens with gsWETH first, then gsUSDT, then alphabetically  
      return tokens.sort((a, b) => {
        if (a.symbol === 'gsWETH') return -1;
        if (b.symbol === 'gsWETH') return 1;
        if (a.symbol === 'gsUSDT') return -1;
        if (b.symbol === 'gsUSDT') return 1;
        if (a.symbol === 'gsWBTC') return -1;
        if (b.symbol === 'gsWBTC') return 1;
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