import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { waitForTransaction } from '@wagmi/core';
import { BaseOptions } from './useBalanceManager';
import { HexAddress } from '@/types/web3/general/address';

// Transfer hook
interface TransferParams {
  sender: HexAddress;
  receiver: HexAddress;
  currency: HexAddress;
  amount: bigint;
}

interface UseTransferReturn {
  transfer: (params: TransferParams) => Promise<boolean>;
  isTransferring: boolean;
  error: Error | null;
}

export const useTransfer = (options: BaseOptions = {}): UseTransferReturn => {
  const { onSuccess, onError } = options;
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transfer = useCallback(
    async ({ sender, receiver, currency, amount }: TransferParams): Promise<boolean> => {
      setIsTransferring(true);
      setError(null);

      try {
        const hash = await writeContract(wagmiConfig, {
          address: BALANCE_MANAGER_ADDRESS,
          abi: BalanceManagerABI,
          functionName: 'transferFrom',
          args: [sender, receiver, currency, amount] as const,
        });

        const receipt = await waitForTransaction(wagmiConfig, {
          hash,
        });

        onSuccess?.(receipt);
        return true;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to transfer tokens');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsTransferring(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    transfer,
    isTransferring,
    error,
  };
};

// Transfer locked tokens hook
interface TransferLockedParams extends TransferParams { }

interface UseTransferLockedReturn {
  transferLocked: (params: TransferLockedParams) => Promise<boolean>;
  isTransferring: boolean;
  error: Error | null;
}

export const useTransferLocked = (options: BaseOptions = {}): UseTransferLockedReturn => {
  const { onSuccess, onError } = options;
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transferLocked = useCallback(
    async ({ sender, receiver, currency, amount }: TransferLockedParams): Promise<boolean> => {
      setIsTransferring(true);
      setError(null);

      try {
        const hash = await writeContract(wagmiConfig, {
          address: BALANCE_MANAGER_ADDRESS,
          abi: BalanceManagerABI,
          functionName: 'transferLockedFrom',
          args: [sender, receiver, currency, amount] as const,
        });

        const receipt = await waitForTransaction(wagmiConfig, {
          hash,
        });

        onSuccess?.(receipt);
        return true;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to transfer locked tokens');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsTransferring(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    transferLocked,
    isTransferring,
    error,
  };
};