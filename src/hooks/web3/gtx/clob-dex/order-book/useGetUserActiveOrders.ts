import { readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { ORDERBOOK_ADDRESS } from '@/constants/contract-address';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import { HexAddress } from '@/types/web3/general/address';

// Match the exact types from the ABI
interface Order {
    id: number;        // uint48
    user: HexAddress;
    next: number;      // uint48
    prev: number;      // uint48
    timestamp: number; // uint48
    expiry: number;    // uint48
    price: bigint;     // uint64
    status: number;    // uint8
    quantity: bigint;  // uint128
    filled: bigint;    // uint128
}

// useGetUserActiveOrders hook
interface UseGetUserActiveOrdersReturn {
    getUserActiveOrders: (user: HexAddress) => Promise<Order[]>;
    isLoading: boolean;
    error: Error | null;
    refetch: (user: HexAddress) => Promise<Order[]>;
}

export const useGetUserActiveOrders = (): UseGetUserActiveOrdersReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getUserActiveOrders = useCallback(async (user: HexAddress): Promise<Order[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const orders = await readContract(wagmiConfig, {
                address: ORDERBOOK_ADDRESS,
                abi: OrderBookABI,
                functionName: 'getUserActiveOrders',
                args: [user] as const,
            }) as readonly Order[];

            return [...orders]; // Convert readonly array to mutable array
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get user active orders');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getUserActiveOrders,
        isLoading,
        error,
        refetch: getUserActiveOrders,
    };
};