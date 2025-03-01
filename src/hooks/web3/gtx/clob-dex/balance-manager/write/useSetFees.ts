import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { waitForTransaction } from '@wagmi/core';
import { BaseOptions } from '../read/useBalanceManager';

// Set fees hook
interface SetFeesParams {
    feeMaker: bigint;
    feeTaker: bigint;
  }
  
  interface UseSetFeesReturn {
    setFees: (params: SetFeesParams) => Promise<TransactionReceipt>;
    isSettingFees: boolean;
    error: Error | null;
  }
  
  export const useSetFees = (options: BaseOptions = {}): UseSetFeesReturn => {
    const { onSuccess, onError } = options;
    const [isSettingFees, setIsSettingFees] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const setFees = useCallback(
      async ({ feeMaker, feeTaker }: SetFeesParams): Promise<TransactionReceipt> => {
        setIsSettingFees(true);
        setError(null);
  
        try {
          const hash = await writeContract(wagmiConfig, {
            address: BALANCE_MANAGER_ADDRESS,
            abi: BalanceManagerABI,
            functionName: 'setFees',
            args: [feeMaker, feeTaker] as const,
          });
  
          const receipt = await waitForTransaction(wagmiConfig, {
            hash,
          });
  
          onSuccess?.(receipt);
          return receipt;
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error('Failed to set fees');
          setError(error);
          onError?.(error);
          throw error;
        } finally {
          setIsSettingFees(false);
        }
      },
      [onSuccess, onError]
    );
  
    return {
      setFees,
      isSettingFees,
      error,
    };
  };