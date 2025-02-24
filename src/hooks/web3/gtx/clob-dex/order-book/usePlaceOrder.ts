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

// usePlaceOrder hook
interface PlaceOrderParams {
    price: bigint;    // uint64
    quantity: bigint; // uint128
    side: Side;
    user: HexAddress;
}

interface UsePlaceOrderReturn {
    placeOrder: (params: PlaceOrderParams) => Promise<TransactionReceipt>;
    isPlacing: boolean;
    error: Error | null;
}

export const usePlaceOrder = (options: BaseOptions = {}): UsePlaceOrderReturn => {
    const { onSuccess, onError } = options;
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeOrder = useCallback(
        async ({ price, quantity, side, user }: PlaceOrderParams): Promise<TransactionReceipt> => {
            setIsPlacing(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'placeOrder',
                    args: [price, quantity, side, user] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place order');
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
        placeOrder,
        isPlacing,
        error,
    };
};
