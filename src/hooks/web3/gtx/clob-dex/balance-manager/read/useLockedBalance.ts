import { readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';
import { HexAddress } from '@/types/general/address';

// Get locked balance hook
interface LockedBalanceParams {
    user: HexAddress;
    operator: HexAddress;
    currency: HexAddress;
  }
  
  interface UseLockedBalanceReturn {
    getLockedBalance: (params: LockedBalanceParams) => Promise<bigint>;
    isLoading: boolean;
    error: Error | null;
    refetch: (params: LockedBalanceParams) => Promise<bigint>;
  }
  
  export const useLockedBalance = (): UseLockedBalanceReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const getLockedBalance = useCallback(
      async ({ user, operator, currency }: LockedBalanceParams): Promise<bigint> => {
        setIsLoading(true);
        setError(null);
  
        try {
          const balance = await readContract(wagmiConfig, {
            address: BALANCE_MANAGER_ADDRESS,
            abi: BalanceManagerABI,
            functionName: 'getLockedBalance',
            args: [user, operator, currency] as const,
          });
  
          return balance;
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error('Failed to get locked balance');
          setError(error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      },
      []
    );
  
    return {
      getLockedBalance,
      isLoading,
      error,
      refetch: getLockedBalance,
    };
  };