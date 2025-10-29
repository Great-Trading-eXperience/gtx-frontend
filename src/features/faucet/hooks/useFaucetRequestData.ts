import { getIndexerUrl } from '@/constants/urls/urls-config';
import { queryRequestTokenss } from '@/graphql/faucet/faucet.query';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { FaucetRequestsData, UseFaucetRequestDataResponse } from '../types/faucet.types';

export const useFaucetRequestData = (
  actualChainId: number
): UseFaucetRequestDataResponse => {
  const { data, isLoading, isError, error, refetch } = useQuery<FaucetRequestsData>({
    queryKey: ['faucetRequestsData', actualChainId],
    queryFn: async () => {
      const url = getIndexerUrl(actualChainId);
      if (!url) throw new Error('Indexer URL not found');
      return await request(url, queryRequestTokenss, { chainId: Number(actualChainId) });
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const refetchAll = async (): Promise<void> => {
    await refetch();
  };

  return {
    faucetRequestsData: data,
    loading: isLoading,
    hasErrors: isError,
    error: error,
    refetchAll,
  };
};
