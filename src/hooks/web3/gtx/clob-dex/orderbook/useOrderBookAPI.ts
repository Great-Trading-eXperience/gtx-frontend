import { useState } from 'react';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import { HexAddress } from '@/types/web3/general/address';
import { useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/configs/wagmi';

// Define types
type Side = 0 | 1; // 0 = BUY, 1 = SELL
type Price = bigint; // uint64
type PriceVolume = {
  price: Price;
  volume: bigint;
};

type Order = {
  id: bigint;       // OrderId (uint48)
  user: string;     // address
  next: bigint;     // OrderId (uint48)
  prev: bigint;     // OrderId (uint48)
  timestamp: bigint; // uint48
  expiry: bigint;   // uint48
  price: bigint;    // Price (uint64)
  status: number;   // Status enum
  quantity: bigint; // Quantity (uint128)
  filled: bigint;   // Quantity (uint128)
};

/**
 * Custom hook for querying order book data from the OrderBook contract
 */
export const useOrderBookAPI = (orderBookAddress: HexAddress) => {
  const [error, setError] = useState<Error | null>(null);
  const isValidAddress = orderBookAddress && orderBookAddress !== '0x0000000000000000000000000000000000000000';

  // Get best price for a side
  const {
    data: bestPriceBuy,
    isLoading: isLoadingBestPriceBuy,
    refetch: refetchBestPriceBuy,
  } = useReadContract({
    address: isValidAddress ? orderBookAddress : undefined,
    abi: OrderBookABI,
    functionName: 'getBestPrice',
    args: [0], // BUY side
  });

  const {
    data: bestPriceSell,
    isLoading: isLoadingBestPriceSell,
    refetch: refetchBestPriceSell,
  } = useReadContract({
    address: isValidAddress ? orderBookAddress : undefined,
    abi: OrderBookABI,
    functionName: 'getBestPrice',
    args: [1], // SELL side
  });

  // Function to get next best prices
  const getNextBestPrices = async (side: Side, price: bigint, count: number) => {
    if (!isValidAddress) return [];
    
    try {
      const result = await readContract(wagmiConfig, {
        address: orderBookAddress,
        abi: OrderBookABI,
        functionName: 'getNextBestPrices',
        args: [side, price, count],
      });
      return result as PriceVolume[];
    } catch (err) {
      console.error('Error fetching next best prices:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch next best prices'));
      throw err;
    }
  };

  // Function to get user's active orders
  const getUserActiveOrders = async (userAddress: HexAddress) => {
    if (!isValidAddress) return [];
    
    try {
      const result = await readContract(wagmiConfig, {
        address: orderBookAddress,
        abi: OrderBookABI,
        functionName: 'getUserActiveOrders',
        args: [userAddress],
      });
      return result as unknown as Order[];
    } catch (err) {
      console.error('Error fetching user active orders:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user active orders'));
      throw err;
    }
  };

  // Function to get order queue at a specific price level
  const getOrderQueue = async (side: Side, price: bigint) => {
    if (!isValidAddress) return { orderCount: BigInt(0), totalVolume: BigInt(0) };
    
    try {
      const result = await readContract(wagmiConfig, {
        address: orderBookAddress,
        abi: OrderBookABI,
        functionName: 'getOrderQueue',
        args: [side, price],
      });
      return {
        orderCount: result[0],
        totalVolume: result[1],
      };
    } catch (err) {
      console.error('Error fetching order queue:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch order queue'));
      throw err;
    }
  };

  // Function to refresh all data
  const refreshOrderBook = () => {
    refetchBestPriceBuy();
    refetchBestPriceSell();
  };

  return {
    // Best prices
    bestPriceBuy: bestPriceBuy as PriceVolume | undefined,
    bestPriceSell: bestPriceSell as PriceVolume | undefined,
    isLoadingBestPrices: isLoadingBestPriceBuy || isLoadingBestPriceSell,
    
    // Functions
    getNextBestPrices,
    getUserActiveOrders,
    getOrderQueue,
    refreshOrderBook,
    
    // Error handling
    error,
  };
};