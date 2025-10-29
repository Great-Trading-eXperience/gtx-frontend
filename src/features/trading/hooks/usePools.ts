import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  poolsPonderQuery,
  PoolsResponse,
  PoolsPonderResponse,
} from '@/graphql/gtx/clob';

export const usePools = (chainId: number) => {
  return useQuery<PoolsResponse | PoolsPonderResponse>({
    queryKey: ['pools', String(chainId)],
    queryFn: async () => {
      const currentChainId = Number(chainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, poolsPonderQuery);
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });
};
