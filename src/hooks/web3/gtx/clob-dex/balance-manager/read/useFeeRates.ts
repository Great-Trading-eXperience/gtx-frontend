import { readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';

// Get fee rates hook
interface UseFeeRatesReturn {
    getFeeMaker: () => Promise<bigint>;
    getFeeTaker: () => Promise<bigint>;
    isLoading: boolean;
    error: Error | null;
  }
  
  export const useFeeRates = (): UseFeeRatesReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const getFeeMaker = useCallback(async (): Promise<bigint> => {
      setIsLoading(true);
      setError(null);
  
      try {
        const feeMaker = await readContract(wagmiConfig, {
          address: BALANCE_MANAGER_ADDRESS,
          abi: BalanceManagerABI,
          functionName: 'feeMaker',
        });
  
        return feeMaker;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to get maker fee');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);
  
    const getFeeTaker = useCallback(async (): Promise<bigint> => {
      setIsLoading(true);
      setError(null);
  
      try {
        const feeTaker = await readContract(wagmiConfig, {
          address: BALANCE_MANAGER_ADDRESS,
          abi: BalanceManagerABI,
          functionName: 'feeTaker',
        });
  
        return feeTaker;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to get taker fee');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);
  
    return {
      getFeeMaker,
      getFeeTaker,
      isLoading,
      error,
    };
  };