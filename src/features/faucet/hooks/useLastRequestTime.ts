import FaucetABI from '@/abis/faucet/FaucetABI';
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { HexAddress, UseLastRequestTimeResponse } from '../types/faucet.types';

export const useLastRequestTime = (
  userAddress?: HexAddress,
  faucetAddress?: HexAddress
): UseLastRequestTimeResponse => {
  const {
    data: lastRequestTime,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: faucetAddress,
    abi: FaucetABI,
    functionName: 'getLastRequestTime',
    args: [],
    account: userAddress as Address,
    query: {
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  return {
    lastRequestTime,
    loading: isLoading,
    hasError: isError,
    error: error,
    refetch,
  };
};
