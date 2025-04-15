import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import GTXRouterABI from "@/abis/gtx/clob-dex/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { GTX_ROUTER_ADDRESS } from "@/constants/contract-address";

// Define types
export type HexAddress = `0x${string}`;
export type PoolKey = {
  baseCurrency: HexAddress;
  quoteCurrency: HexAddress;
};
export type Side = 0 | 1; // 0 = BUY/BID, 1 = SELL/ASK

export const usePlaceOrder = () => {
  const { address } = useAccount();
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(undefined);

  const chainId = useChainId()
  
  // Mutation for limit orders
  const {
    mutateAsync: placeLimitOrder,
    isPending: isLimitOrderPending,
    isError: isLimitOrderError,
    error: limitSimulateError,
  } = useMutation({
    mutationFn: async ({
      baseCurrency,
      quoteCurrency,
      price,
      quantity,
      side,
      withDeposit = false
    }: {
      baseCurrency: HexAddress;
      quoteCurrency: HexAddress;
      price: bigint;
      quantity: bigint;
      side: Side;
      withDeposit?: boolean;
    }) => {
      try {
        let hash: HexAddress;
        
        if (withDeposit) {
          hash = await writeContract(wagmiConfig, {
            address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
            abi: GTXRouterABI,
            functionName: 'placeOrderWithDeposit',
            args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, price, quantity, side, address as `0x${string}` ] as const,
          });
        } else {
          hash = await writeContract(wagmiConfig, {
            address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
            abi: GTXRouterABI,
            functionName: 'placeOrder',
            args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, price, quantity, side, address as `0x${string}` ] as const,
          });
        }

        setLimitOrderHash(hash);
        toast.success('Limit order submitted. Waiting for confirmation...');
        
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
        
        if (receipt.status === 'success') {
          toast.success('Limit order confirmed successfully!');
        } else {
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }
        
        return receipt;
      } catch (error) {
        console.error('Limit order error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to place limit order');
        throw error;
      }
    },
  });

  // Mutation for market orders
  const {
    mutateAsync: placeMarketOrder,
    isPending: isMarketOrderPending,
    isError: isMarketOrderError,
    error: marketSimulateError,
  } = useMutation({
    mutationFn: async ({
      baseCurrency,
      quoteCurrency,
      quantity,
      side,
      price,
      withDeposit = false
    }: {
      baseCurrency: HexAddress;
      quoteCurrency: HexAddress;
      quantity: bigint;
      side: Side;
      price?: bigint;
      withDeposit?: boolean;
    }) => {
      try {
        let hash: HexAddress;
        
        if (withDeposit) {
          if (!price) {
            throw new Error("Price is required for market orders with deposit");
          }
          
          hash = await writeContract(wagmiConfig, {
            address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
            abi: GTXRouterABI,
            functionName: 'placeMarketOrderWithDeposit',
            args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, BigInt(quantity), side, address as `0x${string}` ] as const,
          });
        } else {
          hash = await writeContract(wagmiConfig, {
            address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
            abi: GTXRouterABI,
            functionName: 'placeMarketOrder',
            args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, quantity, side, address as `0x${string}` ] as const,
          });
        }

        setMarketOrderHash(hash);
        toast.success('Market order submitted. Waiting for confirmation...');
        
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
        
        if (receipt.status === 'success') {
          toast.success('Market order confirmed successfully!');
        } else {
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }
        
        return receipt;
      } catch (error) {
        console.error('Market order error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to place market order');
        throw error;
      }
    },
  });

  // Transaction confirmation states
const {
    data: limitOrderReceipt,
    isLoading: isLimitOrderConfirming,
    isSuccess: isLimitOrderConfirmed,
  } = useWaitForTransactionReceipt({
    hash: limitOrderHash, // Only pass the hash, no enabled option
  });
  
  const {
    data: marketOrderReceipt,
    isLoading: isMarketOrderConfirming,
    isSuccess: isMarketOrderConfirmed,
  } = useWaitForTransactionReceipt({
    hash: marketOrderHash, // Only pass the hash, no enabled option
  });

  // Wrapper functions with validation
  const handlePlaceLimitOrder = async (
    poolKey: { baseCurrency: HexAddress; quoteCurrency: HexAddress },
    price: bigint,
    quantity: bigint,
    side: Side,
    withDeposit: boolean = false
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    if (price <= 0n) {
      toast.error('Price must be greater than zero');
      return;
    }

    if (quantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    return placeLimitOrder({ 
      baseCurrency: poolKey.baseCurrency, 
      quoteCurrency: poolKey.quoteCurrency, 
      price, 
      quantity, 
      side, 
      withDeposit 
    });
  };

  const handlePlaceMarketOrder = async (
    poolKey: { baseCurrency: HexAddress; quoteCurrency: HexAddress },
    quantity: bigint,
    side: Side,
    price?: bigint,
    withDeposit: boolean = false
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    if (quantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    return placeMarketOrder({ 
      baseCurrency: poolKey.baseCurrency, 
      quoteCurrency: poolKey.quoteCurrency, 
      quantity, 
      side, 
      price, 
      withDeposit 
    });
  };

  return {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
    isLimitOrderPending,
    isLimitOrderConfirming,
    isLimitOrderConfirmed,
    isMarketOrderPending,
    isMarketOrderConfirming,
    isMarketOrderConfirmed,
    limitOrderHash,
    marketOrderHash,
    limitSimulateError,
    marketSimulateError,
  };
};