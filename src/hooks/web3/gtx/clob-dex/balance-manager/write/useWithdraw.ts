import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { waitForTransaction } from '@wagmi/core';
import { HexAddress } from '@/types/web3/general/address';
import { BaseOptions } from '../read/useBalanceManager';
import { BalanceOperationParams } from './useDeposit';

// Withdraw hook
interface WithdrawParams extends BalanceOperationParams {
    user?: HexAddress;
  }
  
  interface UseWithdrawReturn {
    withdraw: (params: WithdrawParams) => Promise<TransactionReceipt>;
    isWithdrawing: boolean;
    error: Error | null;
  }
  
  export const useWithdraw = (options: BaseOptions = {}): UseWithdrawReturn => {
    const { onSuccess, onError } = options;
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const withdraw = useCallback(
      async ({ currency, amount, user }: WithdrawParams): Promise<TransactionReceipt> => {
        setIsWithdrawing(true);
        setError(null);
  
        try {
          if (user) {
            const hash = await writeContract(wagmiConfig, {
              address: BALANCE_MANAGER_ADDRESS,
              abi: BalanceManagerABI,
              functionName: 'withdraw',
              args: [currency, amount, user] as const,
            });
  
            const receipt = await waitForTransaction(wagmiConfig, {
              hash,
            });
  
            onSuccess?.(receipt);
            return receipt;
          } else {
            const hash = await writeContract(wagmiConfig, {
              address: BALANCE_MANAGER_ADDRESS,
              abi: BalanceManagerABI,
              functionName: 'withdraw',
              args: [currency, amount] as const,
            });
  
            const receipt = await waitForTransaction(wagmiConfig, {
              hash,
            });
  
            onSuccess?.(receipt);
            return receipt;
          }
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error('Failed to withdraw');
          setError(error);
          onError?.(error);
          throw error;
        } finally {
          setIsWithdrawing(false);
        }
      },
      [onSuccess, onError]
    );
  
    return {
      withdraw,
      isWithdrawing,
      error,
    };
  };