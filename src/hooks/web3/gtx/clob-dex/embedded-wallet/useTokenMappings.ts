'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

export interface TokenMapping {
  id: string;
  sourceChainId: number;
  sourceToken: string;
  targetChainId: number;
  syntheticToken: string;
  symbol: string;
  sourceDecimals: number;
  syntheticDecimals: number;
  isActive: boolean;
  registeredAt: number;
  transactionId: string;
  blockNumber: string;
  timestamp: number;
}

export interface TokenMappingsResponse {
  items: TokenMapping[];
}

export interface ProcessedTokenMapping {
  address: string; // syntheticToken (destination address)
  symbol: string;
  decimals: number;
  isQuote: boolean;
  chainId: number;
  sourceAddresses: Record<number, string>; // sourceChainId -> sourceToken
}

export const useTokenMappings = (
  userAddress?: string,
  enabled: boolean = true
) => {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery<TokenMappingsResponse>({
    queryKey: ['token-mappings', userAddress],
    queryFn: async () => {
      if (!userAddress) {
        throw new Error('User address is required');
      }
      
      console.log('[TOKEN-MAPPINGS] Fetching token mappings for user:', userAddress);
      
      const response = await fetch(
        `https://core-indexer-devnet.gtxdex.xyz/api/token-mappings?user=${userAddress}`,
        {
          headers: {
            'accept': '*/*',
            'origin': window.location.origin,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token mappings: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[TOKEN-MAPPINGS] Raw API response:', data);
      
      return data;
    },
    enabled: enabled && !!userAddress,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: (failureCount, error) => {
      console.log(`[TOKEN-MAPPINGS] Query retry ${failureCount + 1}:`, error?.message);
      
      // Don't retry on 404 or timeout errors
      if (error?.message?.includes('404') || error?.message?.includes('timeout')) {
        console.log('[TOKEN-MAPPINGS] Not retrying due to 404/timeout');
        return false;
      }
      
      return failureCount < 2; // Maximum 2 retries
    },
    retryDelay: 2000,
  });

  // Process the raw data into the format expected by the embedded panel
  const processedTokenMappings: ProcessedTokenMapping[] = React.useMemo(() => {
    if (!rawData?.items) return [];

    console.log('[TOKEN-MAPPINGS] Processing token mappings...');

    // Group mappings by synthetic token (destination address)
    const tokenMap = new Map<string, ProcessedTokenMapping>();

    rawData.items
      .filter(mapping => mapping.isActive) // Only include active mappings
      .forEach(mapping => {
        const destinationAddress = mapping.syntheticToken.toLowerCase();
        
        if (tokenMap.has(destinationAddress)) {
          // Add source address to existing mapping
          const existing = tokenMap.get(destinationAddress)!;
          existing.sourceAddresses[mapping.sourceChainId] = mapping.sourceToken;
        } else {
          // Create new mapping
          const cleanSymbol = mapping.symbol.replace(/^gs/, ''); // Remove 'gs' prefix for display
          
          // Determine if this is a quote token (typically stablecoins)
          const isQuote = ['USDC', 'USDT', 'DAI'].includes(cleanSymbol);
          
          // Use synthetic decimals, fallback to common decimals
          let decimals = mapping.syntheticDecimals;
          if (decimals === 0) {
            // Fallback based on token type
            if (cleanSymbol === 'USDC' || cleanSymbol === 'USDT') {
              decimals = 6;
            } else if (cleanSymbol === 'WBTC') {
              decimals = 8;
            } else {
              decimals = 18; // Default for most tokens
            }
          }

          tokenMap.set(destinationAddress, {
            address: mapping.syntheticToken,
            symbol: cleanSymbol,
            decimals,
            isQuote,
            chainId: mapping.targetChainId,
            sourceAddresses: {
              [mapping.sourceChainId]: mapping.sourceToken,
            },
          });
        }
      });

    const result = Array.from(tokenMap.values());
    console.log('[TOKEN-MAPPINGS] Processed mappings:', result);
    
    return result;
  }, [rawData]);

  return {
    data: processedTokenMappings,
    rawData,
    isLoading,
    error,
    refetch,
  };
};