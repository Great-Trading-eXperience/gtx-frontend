import { HexAddress } from '@/types/general/address';
import { TransactionReceipt } from 'viem';

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

// // Hook for creating a new pool
// interface CreatePoolParams {
//     poolKey: PoolKey;
//     lotSize: bigint;
//     maxOrderAmount: bigint;
// }

// interface UseCreatePoolReturn {
//     createPool: (params: CreatePoolParams) => Promise<TransactionReceipt>;
//     isCreating: boolean;
//     error: Error | null;
// }

// export const useCreatePool = (options: BaseOptions = {}): UseCreatePoolReturn => {
//     const { onSuccess, onError } = options;
//     const [isCreating, setIsCreating] = useState(false);
//     const [error, setError] = useState<Error | null>(null);

//     const chainId = useChainId();

//     const createPool = useCallback(
//         async ({ poolKey, lotSize, maxOrderAmount }: CreatePoolParams): Promise<TransactionReceipt> => {
//             setIsCreating(true);
//             setError(null);

//             try {
//                 const hash = await writeContract(wagmiConfig, {
//                     address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
//                     abi: PoolManagerABI,
//                     functionName: 'createPool',
//                     args: [poolKey.baseCurrency, lotSize, maxOrderAmount] as const,
//                 });

//                 const receipt = await waitForTransaction(wagmiConfig, {
//                     hash,
//                 });

//                 onSuccess?.(receipt);
//                 return receipt;
//             } catch (err: unknown) {
//                 const error = err instanceof Error ? err : new Error('Failed to create pool');
//                 setError(error);
//                 onError?.(error);
//                 throw error;
//             } finally {
//                 setIsCreating(false);
//             }
//         },
//         [onSuccess, onError]
//     );

//     return {
//         createPool,
//         isCreating,
//         error,
//     };
// };

// // Hook for getting pool details
// interface GetPoolParams {
//     poolKey: PoolKey;
// }

// interface UseGetPoolReturn {
//     getPool: (params: GetPoolParams) => Promise<Pool>;
//     isLoading: boolean;
//     error: Error | null;
// }

// export const useGetPool = (): UseGetPoolReturn => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<Error | null>(null);

//         const chainId = useChainId();


//     const getPool = useCallback(async ({ poolKey }: GetPoolParams): Promise<Pool> => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const pool = await readContract(wagmiConfig, {
//                 address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
//                 abi: PoolManagerABI,
//                 functionName: 'getPool',
//                 args: [{
//                     baseCurrency: poolKey.baseCurrency,
//                     quoteCurrency: poolKey.quoteCurrency
//                 }]
//             });

//             return pool;
//         } catch (err: unknown) {
//             const error = err instanceof Error ? err : new Error('Failed to get pool details');
//             setError(error);
//             throw error;
//         } finally {
//             setIsLoading(false);
//         }
//     }, []);

//     return {
//         getPool,
//         isLoading,
//         error,
//     };
// // };

// // Hook for getting pool ID
// interface GetPoolIdParams {
//     poolKey: PoolKey;
// }

// interface UseGetPoolIdReturn {
//     getPoolId: (params: GetPoolIdParams) => Promise<string>;
//     isLoading: boolean;
//     error: Error | null;
// }

// export const useGetPoolId = (): UseGetPoolIdReturn => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<Error | null>(null);

//     const getPoolId = useCallback(async ({ poolKey }: GetPoolIdParams): Promise<string> => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const poolId = await readContract(wagmiConfig, {
//                 address: POOL_MANAGER_ADDRESS,
//                 abi: PoolManagerABI,
//                 functionName: 'getPoolId',
//                 args: [{
//                     baseCurrency: poolKey.baseCurrency,
//                     quoteCurrency: poolKey.quoteCurrency
//                 }] as const,
//             });

//             return poolId;
//         } catch (err: unknown) {
//             const error = err instanceof Error ? err : new Error('Failed to get pool ID');
//             setError(error);
//             throw error;
//         } finally {
//             setIsLoading(false);
//         }
//     }, []);

//     return {
//         getPoolId,
//         isLoading,
//         error,
//     };
// };

// // Hook for getting pool details by ID
// interface GetPoolByIdParams {
//     poolId: HexAddress; // bytes32
// }

// interface UseGetPoolByIdReturn {
//     getPoolById: (params: GetPoolByIdParams) => Promise<Pool>;
//     isLoading: boolean;
//     error: Error | null;
// }

// export const useGetPoolById = (): UseGetPoolByIdReturn => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<Error | null>(null);

//     const getPoolById = useCallback(async ({ poolId }: GetPoolByIdParams): Promise<Pool> => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const poolData = await readContract(wagmiConfig, {
//                 address: POOL_MANAGER_ADDRESS,
//                 abi: PoolManagerABI,
//                 functionName: 'pools',
//                 args: [poolId] as const,
//             });

//             // The returned data is a tuple array, convert it to our Pool type
//             return {
//                 maxOrderAmount: poolData[0],
//                 lotSize: poolData[1],
//                 baseCurrency: poolData[2],
//                 quoteCurrency: poolData[3],
//                 orderBook: poolData[4],
//             };
//         } catch (err: unknown) {
//             const error = err instanceof Error ? err : new Error('Failed to get pool by ID');
//             setError(error);
//             throw error;
//         } finally {
//             setIsLoading(false);
//         }
//     }, []);

//     return {
//         getPoolById,
//         isLoading,
//         error,
//     };
// };

// // Hook for transferring ownership
// interface TransferOwnershipParams {
//     newOwner: HexAddress;
// }

// interface UseTransferOwnershipReturn {
//     transferOwnership: (params: TransferOwnershipParams) => Promise<TransactionReceipt>;
//     isTransferring: boolean;
//     error: Error | null;
// }

// export const useTransferOwnership = (options: BaseOptions = {}): UseTransferOwnershipReturn => {
//     const { onSuccess, onError } = options;
//     const [isTransferring, setIsTransferring] = useState(false);
//     const [error, setError] = useState<Error | null>(null);

//     const transferOwnership = useCallback(
//         async ({ newOwner }: TransferOwnershipParams): Promise<TransactionReceipt> => {
//             setIsTransferring(true);
//             setError(null);

//             try {
//                 const hash = await writeContract(wagmiConfig, {
//                     address: POOL_MANAGER_ADDRESS,
//                     abi: PoolManagerABI,
//                     functionName: 'transferOwnership',
//                     args: [newOwner] as const,
//                 });

//                 const receipt = await waitForTransaction(wagmiConfig, {
//                     hash,
//                 });

//                 onSuccess?.(receipt);
//                 return receipt;
//             } catch (err: unknown) {
//                 const error = err instanceof Error ? err : new Error('Failed to transfer ownership');
//                 setError(error);
//                 onError?.(error);
//                 throw error;
//             } finally {
//                 setIsTransferring(false);
//             }
//         },
//         [onSuccess, onError]
//     );

//     return {
//         transferOwnership,
//         isTransferring,
//         error,
//     };
// };

// // Hook for renouncing ownership
// interface UseRenounceOwnershipReturn {
//     renounceOwnership: () => Promise<TransactionReceipt>;
//     isRenouncing: boolean;
//     error: Error | null;
// }

// export const useRenounceOwnership = (options: BaseOptions = {}): UseRenounceOwnershipReturn => {
//     const { onSuccess, onError } = options;
//     const [isRenouncing, setIsRenouncing] = useState(false);
//     const [error, setError] = useState<Error | null>(null);

//     const renounceOwnership = useCallback(async (): Promise<TransactionReceipt> => {
//         setIsRenouncing(true);
//         setError(null);

//         try {
//             const hash = await writeContract(wagmiConfig, {
//                 address: POOL_MANAGER_ADDRESS,
//                 abi: PoolManagerABI,
//                 functionName: 'renounceOwnership',
//             });

//             const receipt = await waitForTransaction(wagmiConfig, {
//                 hash,
//             });

//             onSuccess?.(receipt);
//             return receipt;
//         } catch (err: unknown) {
//             const error = err instanceof Error ? err : new Error('Failed to renounce ownership');
//             setError(error);
//             onError?.(error);
//             throw error;
//         } finally {
//             setIsRenouncing(false);
//         }
//     }, [onSuccess, onError]);

//     return {
//         renounceOwnership,
//         isRenouncing,
//         error,
//     };
// };