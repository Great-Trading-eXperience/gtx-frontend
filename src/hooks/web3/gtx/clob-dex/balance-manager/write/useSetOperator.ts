import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { waitForTransaction } from '@wagmi/core';
import { BaseOptions } from '../read/useBalanceManager';
import { HexAddress } from '@/types/web3/general/address';

// Set authorized operator hook
interface SetOperatorParams {
    operator: HexAddress;
    approved: boolean;
  }
  
  interface UseSetOperatorReturn {
    setOperator: (params: SetOperatorParams) => Promise<TransactionReceipt>;
    isSettingOperator: boolean;
    error: Error | null;
  }
  
  export const useSetOperator = (options: BaseOptions = {}): UseSetOperatorReturn => {
    const { onSuccess, onError } = options;
    const [isSettingOperator, setIsSettingOperator] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const setOperator = useCallback(
      async ({ operator, approved }: SetOperatorParams): Promise<TransactionReceipt> => {
        setIsSettingOperator(true);
        setError(null);
  
        try {
          const hash = await writeContract(wagmiConfig, {
            address: BALANCE_MANAGER_ADDRESS,
            abi: BalanceManagerABI,
            functionName: 'setAuthorizedOperator',
            args: [operator, approved] as const,
          });
  
          const receipt = await waitForTransaction(wagmiConfig, {
            hash,
          });
  
          onSuccess?.(receipt);
          return receipt;
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error('Failed to set operator');
          setError(error);
          onError?.(error);
          throw error;
        } finally {
          setIsSettingOperator(false);
        }
      },
      [onSuccess, onError]
    );
  
    return {
      setOperator,
      isSettingOperator,
      error,
    };
  };