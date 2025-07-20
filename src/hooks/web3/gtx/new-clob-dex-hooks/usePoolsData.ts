import { useQuery } from '@tanstack/react-query';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { poolsQuery, poolsPonderQuery, PoolsPonderResponse, PoolsResponse } from '@/graphql/gtx/clob';
import { getUseSubgraph } from '@/utils/env';
import request from 'graphql-request';

export const usePoolsData = (chainId: number | undefined, defaultChainId: number) => {
  const {
    data: poolsData,
    isLoading: poolsLoading, 
    error: poolsError
  } = useQuery({
    queryKey: ['pools', String(chainId ?? defaultChainId)],
    queryFn: async (): Promise<PoolsResponse | PoolsPonderResponse | undefined> => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });

  return {
    poolsData,
    poolsLoading,
    poolsError
  }
};