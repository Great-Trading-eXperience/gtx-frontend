import TokenABI from '@/abis/tokens/TokenABI';
import { useReadContracts } from 'wagmi';
import { HexAddress, UseUserAndFaucetBalancesResponse } from '../types/faucet.types';

export const useUserAndFaucetBalances = (
  userAddress: HexAddress | undefined,
  faucetAddress: HexAddress | undefined,
  tokenAddress: HexAddress | undefined
): UseUserAndFaucetBalancesResponse => {
  const { data, isLoading, isError, error, refetch } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'balanceOf',
        args: [faucetAddress],
      },
    ],
  });

  const isBigInt = (value: unknown): value is bigint => {
    return typeof value === 'bigint';
  };

  const userBalance =
    data?.[0]?.result && isBigInt(data[0].result) ? data[0].result : undefined;

  const faucetBalance =
    data?.[1]?.result && isBigInt(data[1].result) ? data[1].result : undefined;

  return {
    userBalance,
    faucetBalance,
    loading: isLoading,
    hasError: isError,
    error: error,
    refetch,
  };
};
