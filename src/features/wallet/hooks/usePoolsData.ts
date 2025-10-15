import { useQuery } from '@tanstack/react-query';
import { PoolItem } from '../types/wallet.types';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { poolsPonderQuery } from '@/graphql/gtx/clob';
import request from 'graphql-request';

interface PoolsResponse {
  items: PoolItem[];
}

interface PoolsDataResponse {
  poolss: PoolsResponse;
}

export function usePoolsData(displayChainId: number) {
  const { data }: { data: PoolsDataResponse | undefined } = useQuery({
    queryKey: ['pools', displayChainId],
    queryFn: async () => {
      const url = GTX_GRAPHQL_URL(displayChainId);
      if (!url) throw new Error('GraphQL URL not found');

      const query = poolsPonderQuery;

      return await request(url, query);
    },
    enabled: !!displayChainId,
  });

  return {
    pools: data?.poolss.items || [],
  };
}
