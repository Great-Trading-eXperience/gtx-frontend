import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { HexAddress } from '@/types/web3/general/address';

// Common types
export interface BaseOptions {
  onSuccess?: (receipt: TransactionReceipt) => void;
  onError?: (error: Error) => void;
}

// Balance checking hook
interface BalanceParams {
  user: HexAddress;
  currency: HexAddress;
}

interface UseBalanceReturn {
  getBalance: (params: BalanceParams) => Promise<bigint>;
  isLoading: boolean;
  error: Error | null;
  refetch: (params: BalanceParams) => Promise<bigint>;
}

export const useBalance = (): UseBalanceReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getBalance = useCallback(
    async ({ user, currency }: BalanceParams): Promise<bigint> => {
      setIsLoading(true);
      setError(null);

      try {
        const balance = await readContract(wagmiConfig, {
          address: BALANCE_MANAGER_ADDRESS,
          abi: BalanceManagerABI,
          functionName: 'getBalance',
          args: [user, currency] as const,
        });

        return balance;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to get balance');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getBalance,
    isLoading,
    error,
    refetch: getBalance,
  };
};

// Deposit hook
interface BalanceOperationParams {
  currency: HexAddress;
  amount: bigint;
}

interface DepositParams extends BalanceOperationParams {
  user?: HexAddress;
}

interface UseDepositReturn {
  deposit: (params: DepositParams) => Promise<TransactionReceipt>;
  isDepositing: boolean;
  error: Error | null;
}

export const useDeposit = (options: BaseOptions = {}): UseDepositReturn => {
  const { onSuccess, onError } = options;
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deposit = useCallback(
    async ({ currency, amount, user }: DepositParams): Promise<TransactionReceipt> => {
      setIsDepositing(true);
      setError(null);

      try {
        if (user) {
          const hash = await writeContract(wagmiConfig, {
            address: BALANCE_MANAGER_ADDRESS,
            abi: BalanceManagerABI,
            functionName: 'deposit',
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
            functionName: 'deposit',
            args: [currency, amount] as const,
          });

          const receipt = await waitForTransaction(wagmiConfig, {
            hash,
          });

          onSuccess?.(receipt);
          return receipt;
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to deposit');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsDepositing(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    deposit,
    isDepositing,
    error,
  };
};

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
interface TransferLockedParams extends TransferParams {}

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