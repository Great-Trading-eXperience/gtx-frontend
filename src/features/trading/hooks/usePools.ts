import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { poolsQuery, poolsPonderQuery, PoolsResponse, PoolsPonderResponse } from '@/graphql/gtx/clob';
import { getUseSubgraph } from '@/utils/env';

export const usePools = (chainId: number, defaultChainId: number) => {
  return useQuery<PoolsResponse | PoolsPonderResponse>({
    queryKey: ['pools', String(chainId ?? defaultChainId)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });
};