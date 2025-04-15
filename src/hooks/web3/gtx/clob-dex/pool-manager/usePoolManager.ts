import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { POOL_MANAGER_ADDRESS } from '@/constants/contract-address';
import PoolManagerABI from '@/abis/gtx/clob-dex/PoolManagerABI';
import { HexAddress } from '@/types/web3/general/address';
import { useChainId } from 'wagmi';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// PoolKey type (used in many functions)
interface PoolKey {
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
}

// Pool type
interface Pool {
    maxOrderAmount: bigint;
    lotSize: bigint;
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
    orderBook: HexAddress;
}

// Hook for retrieving contract owner
interface UsePoolManagerOwnerReturn {
    getOwner: () => Promise<HexAddress>;
    isLoading: boolean;
    error: Error | null;
}

export const usePoolManagerOwner = (): UsePoolManagerOwnerReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const getOwner = useCallback(async (): Promise<HexAddress> => {
        setIsLoading(true);
        setError(null);

        try {
            const owner = await readContract(wagmiConfig, {
                address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                abi: PoolManagerABI,
                functionName: 'owner',
            });

            return owner;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get pool manager owner');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getOwner,
        isLoading,
        error,
    };
};

// Hook for setting router address
interface SetRouterParams {
    router: HexAddress;
}

interface UseSetRouterReturn {
    setRouter: (params: SetRouterParams) => Promise<TransactionReceipt>;
    isSettingRouter: boolean;
    error: Error | null;
}

export const useSetRouter = (options: BaseOptions = {}): UseSetRouterReturn => {
    const { onSuccess, onError } = options;
    const [isSettingRouter, setIsSettingRouter] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const setRouter = useCallback(
        async ({ router }: SetRouterParams): Promise<TransactionReceipt> => {
            setIsSettingRouter(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                    abi: PoolManagerABI,
                    functionName: 'setRouter',
                    args: [router] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to set router');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsSettingRouter(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        setRouter,
        isSettingRouter,
        error,
    };
};

// Hook for creating a new pool
interface CreatePoolParams {
    poolKey: PoolKey;
    lotSize: bigint;
    maxOrderAmount: bigint;
}

interface UseCreatePoolReturn {
    createPool: (params: CreatePoolParams) => Promise<TransactionReceipt>;
    isCreating: boolean;
    error: Error | null;
}

export const useCreatePool = (options: BaseOptions = {}): UseCreatePoolReturn => {
    const { onSuccess, onError } = options;
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const createPool = useCallback(
        async ({ poolKey, lotSize, maxOrderAmount }: CreatePoolParams): Promise<TransactionReceipt> => {
            setIsCreating(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                    abi: PoolManagerABI,
                    functionName: 'createPool',
                    args: [{
                        baseCurrency: poolKey.baseCurrency,
                        quoteCurrency: poolKey.quoteCurrency
                    }, lotSize, maxOrderAmount] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to create pool');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsCreating(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        createPool,
        isCreating,
        error,
    };
};

// Hook for getting pool details
interface GetPoolParams {
    poolKey: PoolKey;
}

interface UseGetPoolReturn {
    getPool: (params: GetPoolParams) => Promise<Pool>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetPool = (): UseGetPoolReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const getPool = useCallback(async ({ poolKey }: GetPoolParams): Promise<Pool> => {
        setIsLoading(true);
        setError(null);

        try {
            const pool = await readContract(wagmiConfig, {
                address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                abi: PoolManagerABI,
                functionName: 'getPool',
                args: [{
                    baseCurrency: poolKey.baseCurrency,
                    quoteCurrency: poolKey.quoteCurrency
                }]
            });

            return pool;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get pool details');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getPool,
        isLoading,
        error,
    };
};

// Hook for getting pool ID
interface GetPoolIdParams {
    poolKey: PoolKey;
}

interface UseGetPoolIdReturn {
    getPoolId: (params: GetPoolIdParams) => Promise<string>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetPoolId = (): UseGetPoolIdReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const getPoolId = useCallback(async ({ poolKey }: GetPoolIdParams): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const poolId = await readContract(wagmiConfig, {
                address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                abi: PoolManagerABI,
                functionName: 'getPoolId',
                args: [{
                    baseCurrency: poolKey.baseCurrency,
                    quoteCurrency: poolKey.quoteCurrency
                }] as const,
            });

            return poolId;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get pool ID');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getPoolId,
        isLoading,
        error,
    };
};

// Hook for getting pool details by ID
interface GetPoolByIdParams {
    poolId: HexAddress; // bytes32
}

interface UseGetPoolByIdReturn {
    getPoolById: (params: GetPoolByIdParams) => Promise<Pool>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetPoolById = (): UseGetPoolByIdReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const getPoolById = useCallback(async ({ poolId }: GetPoolByIdParams): Promise<Pool> => {
        setIsLoading(true);
        setError(null);

        try {
            const poolData = await readContract(wagmiConfig, {
                address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                abi: PoolManagerABI,
                functionName: 'pools',
                args: [poolId] as const,
            });

            // The returned data is a tuple array, convert it to our Pool type
            return {
                maxOrderAmount: poolData[0],
                lotSize: poolData[1],
                baseCurrency: poolData[2],
                quoteCurrency: poolData[3],
                orderBook: poolData[4],
            };
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get pool by ID');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getPoolById,
        isLoading,
        error,
    };
};

// Hook for transferring ownership
interface TransferOwnershipParams {
    newOwner: HexAddress;
}

interface UseTransferOwnershipReturn {
    transferOwnership: (params: TransferOwnershipParams) => Promise<TransactionReceipt>;
    isTransferring: boolean;
    error: Error | null;
}

export const useTransferOwnership = (options: BaseOptions = {}): UseTransferOwnershipReturn => {
    const { onSuccess, onError } = options;
    const [isTransferring, setIsTransferring] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const transferOwnership = useCallback(
        async ({ newOwner }: TransferOwnershipParams): Promise<TransactionReceipt> => {
            setIsTransferring(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                    abi: PoolManagerABI,
                    functionName: 'transferOwnership',
                    args: [newOwner] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to transfer ownership');
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
        transferOwnership,
        isTransferring,
        error,
    };
};

// Hook for renouncing ownership
interface UseRenounceOwnershipReturn {
    renounceOwnership: () => Promise<TransactionReceipt>;
    isRenouncing: boolean;
    error: Error | null;
}

export const useRenounceOwnership = (options: BaseOptions = {}): UseRenounceOwnershipReturn => {
    const { onSuccess, onError } = options;
    const [isRenouncing, setIsRenouncing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const chainId = useChainId()

    const renounceOwnership = useCallback(async (): Promise<TransactionReceipt> => {
        setIsRenouncing(true);
        setError(null);

        try {
            const hash = await writeContract(wagmiConfig, {
                address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
                abi: PoolManagerABI,
                functionName: 'renounceOwnership',
            });

            const receipt = await waitForTransaction(wagmiConfig, {
                hash,
            });

            onSuccess?.(receipt);
            return receipt;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to renounce ownership');
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsRenouncing(false);
        }
    }, [onSuccess, onError]);

    return {
        renounceOwnership,
        isRenouncing,
        error,
    };
};