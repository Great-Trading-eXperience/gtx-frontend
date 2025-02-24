import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { ORDERBOOK_ADDRESS } from '@/constants/contract-address';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import { waitForTransaction } from '@wagmi/core';
import { HexAddress } from '@/types/web3/general/address';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// Types for Order-related operations
type Side = 0 | 1; // Assuming 0 = Buy, 1 = Sell

// usePlaceMarketOrder hook
interface PlaceMarketOrderParams {
    quantity: bigint;
    side: Side;
    user: HexAddress;
}

interface UsePlaceMarketOrderReturn {
    placeMarketOrder: (params: PlaceMarketOrderParams) => Promise<TransactionReceipt>;
    isPlacing: boolean;
    error: Error | null;
}

export const usePlaceMarketOrder = (options: BaseOptions = {}): UsePlaceMarketOrderReturn => {
    const { onSuccess, onError } = options;
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeMarketOrder = useCallback(
        async ({ quantity, side, user }: PlaceMarketOrderParams): Promise<TransactionReceipt> => {
            setIsPlacing(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'placeMarketOrder',
                    args: [quantity, side, user] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place market order');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsPlacing(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        placeMarketOrder,
        isPlacing,
        error,
    };
};