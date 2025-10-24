'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUseSubgraph, getGraphQLUrl } from '@/utils/env';
import { CORE_CHAIN } from '@/constants/features/features-config';

// GraphQL query for balances
const GET_BALANCES_QUERY = `
  query GetBalances($user: String!) {
    balancess(where: { user: $user }) {
      items {
        amount
        chainId
        id
        lockedAmount
        user
        currency {
          address
          chainId
          id
          decimals
          name
          symbol
        }
      }
    }
  }
`;

export interface BalanceFromIndexer {
  amount: string;
  chainId: number;
  id: string;
  lockedAmount: string;
  user: string;
  currency: {
    address: string;
    chainId: number;
    id: string;
    decimals: number;
    name: string;
    symbol: string;
  };
}

export interface BalanceResponse {
  balancess: {
    items: BalanceFromIndexer[];
  };
}

export interface ProcessedBalance {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: string;
  chainId: number;
  currencyName: string;
}

export const useBalancesFromIndexer = (
  userAddress?: string,
  enabled: boolean = true,
  activeTab?: string
) => {
  // For GTX wallet balances, always use the core chain 
  const currentChainId = CORE_CHAIN;

  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery<BalanceResponse>({
    queryKey: ['balances-from-indexer', userAddress, currentChainId],
    queryFn: async () => {
      if (!userAddress) {
        throw new Error('User address is required');
      }
      
      console.log('[BALANCES-INDEXER] Fetching GTX wallet balances for user:', userAddress, 'from core chain:', currentChainId);
      
      const url = getGraphQLUrl(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_BALANCES_QUERY,
          variables: {
            user: userAddress.toLowerCase(),
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balances: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[BALANCES-INDEXER] Raw API response:', data);
      
      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors[0].message}`);
      }
      
      return data.data;
    },
    enabled: enabled && !!userAddress && activeTab === 'Asset',
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 8000, // Consider data stale after 8 seconds
    retry: (failureCount, error) => {
      console.log(`[BALANCES-INDEXER] Query retry ${failureCount + 1}:`, error?.message);
      
      // Don't retry on 404 or timeout errors
      if (error?.message?.includes('404') || error?.message?.includes('timeout')) {
        console.log('[BALANCES-INDEXER] Not retrying due to 404/timeout');
        return false;
      }
      
      return failureCount < 2; // Maximum 2 retries
    },
    retryDelay: 2000,
  });

  // Process the raw data into a simpler format
  const processedBalances: ProcessedBalance[] = React.useMemo(() => {
    if (!rawData?.balancess?.items) return [];

    console.log('[BALANCES-INDEXER] Processing balances...');

    const balances = rawData.balancess.items.map(item => {
      // Format the raw amount using the currency decimals
      const rawAmount = item.amount;
      const decimals = item.currency.decimals;
      const formattedBalance = Number(rawAmount) / Math.pow(10, decimals);
      
      console.log(`[BALANCES-INDEXER] Transforming ${item.currency.symbol}:`, {
        rawAmount,
        decimals,
        formattedBalance: formattedBalance.toString(),
      });
      
      return {
        tokenAddress: item.currency.address.toLowerCase(),
        symbol: item.currency.symbol,
        decimals: item.currency.decimals,
        balance: formattedBalance.toString(),
        chainId: item.currency.chainId,
        currencyName: item.currency.name,
      };
    });

    console.log('[BALANCES-INDEXER] Processed balances:', balances);
    return balances;
  }, [rawData]);

  return {
    data: processedBalances,
    rawData,
    isLoading,
    error,
    refetch,
  };
};