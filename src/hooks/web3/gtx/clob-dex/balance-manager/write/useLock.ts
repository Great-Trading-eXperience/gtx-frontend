import { writeContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { HexAddress } from '@/types/web3/general/address';
import { BalanceOperationParams } from './useDeposit';
import { BaseOptions } from '../read/useBalanceManager';

// Lock tokens hook
interface LockParams extends BalanceOperationParams {
    user: HexAddress;
  }
  
  interface UseLockReturn {
    lock: (params: LockParams) => Promise<boolean>;
    isLocking: boolean;
    error: Error | null;
  }
  
  export const useLock = (options: BaseOptions = {}): UseLockReturn => {
    const { onSuccess, onError } = options;
    const [isLocking, setIsLocking] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const lock = useCallback(
      async ({ user, currency, amount }: LockParams): Promise<boolean> => {
        setIsLocking(true);
        setError(null);
  
        try {
          const hash = await writeContract(wagmiConfig, {
            address: BALANCE_MANAGER_ADDRESS,
            abi: BalanceManagerABI,
            functionName: 'lock',
            args: [user, currency, amount] as const,
          });
  
          const receipt = await waitForTransaction(wagmiConfig, {
            hash,
          });
  
          onSuccess?.(receipt);
          return true;
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error('Failed to lock tokens');
          setError(error);
          onError?.(error);
          throw error;
        } finally {
          setIsLocking(false);
        }
      },
      [onSuccess, onError]
    );
  
    return {
      lock,
      isLocking,
      error,
    };
  };
  
  // Unlock tokens hook
  interface UnlockParams extends LockParams {}
  
  interface UseUnlockReturn {
    unlock: (params: UnlockParams) => Promise<boolean>;
    isUnlocking: boolean;
    error: Error | null;
  }
  
  export const useUnlock = (options: BaseOptions = {}): UseUnlockReturn => {
    const { onSuccess, onError } = options;
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const unlock = useCallback(
      async ({ user, currency, amount }: UnlockParams): Promise<boolean> => {
        setIsUnlocking(true);
        setError(null);
  
        try {
          const hash = await writeContract(wagmiConfig, {
            address: BALANCE_MANAGER_ADDRESS,
            abi: BalanceManagerABI,
            functionName: 'unlock',
            args: [user, currency, amount] as const,
          });
  
          const receipt = await waitForTransaction(wagmiConfig, {
            hash,
          });
  
          onSuccess?.(receipt);
          return true;
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error('Failed to unlock tokens');
          setError(error);
          onError?.(error);
          throw error;
        } finally {
          setIsUnlocking(false);
        }
      },
      [onSuccess, onError]
    );
  
    return {
      unlock,
      isUnlocking,
      error,
    };
  };