import FaucetABI from '@/abis/faucet/FaucetABI';
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { HexAddress, UseFaucetCooldownResponse } from '../types/faucet.types';

export const useFaucetCooldown = (
  faucetAddress: HexAddress | undefined
): UseFaucetCooldownResponse => {
  const {
    data: faucetCooldown,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: faucetAddress as Address,
    abi: FaucetABI,
    functionName: 'getCooldown',
    args: [],
    query: {
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  return {
    faucetCooldown,
    loading: isLoading,
    hasError: isError,
    error: error,
    refetch,
  };
};
