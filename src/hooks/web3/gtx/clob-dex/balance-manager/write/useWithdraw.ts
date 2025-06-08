import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { HexAddress } from '@/types/general/address';
import { waitForTransaction, writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { TransactionReceipt } from 'viem';
import { useChainId } from 'wagmi';

// Withdraw hook
interface WithdrawParams {
  user?: HexAddress;
  currency: HexAddress;
  amount: bigint;
}

interface UseWithdrawReturn {
  withdraw: (params: WithdrawParams) => Promise<TransactionReceipt>;
  isWithdrawing: boolean;
  error: Error | null;
}

export interface BaseOptions {
  onSuccess?: (receipt: TransactionReceipt) => void;
  onError?: (error: Error) => void;
}

export const useWithdraw = (options: BaseOptions = {}): UseWithdrawReturn => {
  const { onSuccess, onError } = options;
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const chainId = useChainId()

  const withdraw = useCallback(
    async ({ currency, amount, user }: WithdrawParams): Promise<TransactionReceipt> => {
      setIsWithdrawing(true);
      setError(null);

      try {
        if (user) {
          const hash = await writeContract(wagmiConfig, {
            address: getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress,
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
            address: getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress,
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