import { getIndexerUrl } from '@/constants/urls/urls-config';
import { queryFaucetTokenss } from '@/graphql/faucet/faucet.query';
import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { FaucetTokensData, UseFaucetTokensDataResponse } from '../types/faucet.types';

export const useFaucetTokensData = (
  actualChainId: number
): UseFaucetTokensDataResponse => {
  const { data, isLoading, isError, error, refetch } = useQuery<FaucetTokensData>({
    queryKey: ['faucetTokensData', actualChainId],
    queryFn: async () => {
      const url = getIndexerUrl(actualChainId);
      if (!url) throw new Error('Indexer URL not found');
      return await request(url, queryFaucetTokenss, { chainId: Number(actualChainId) });
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
    faucetTokensData: data,
    loading: isLoading,
    hasErrors: isError,
    error: error,
    refetchAll,
  };
};
