import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { parseUnits, formatUnits, encodeFunctionData, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

// Import ABI as default import
import RouterABI from "@/abis/gtx/perpetual/RouterABI";

// Types
import type { HexAddress } from '@/types/general/address';

/**
 * Market types enum matching OrderHandler.OrderType from the contract
 */
export enum OrderType {
  MarketIncrease = 0,
  LimitIncrease = 1, 
  MarketDecrease = 2,
  LimitDecrease = 3,
  StopLossDecrease = 4,
  Liquidation = 5
}

/**
 * Parameters for creating a perpetual position order
 */
export type CreatePerpOrderParams = {
  marketAddress: HexAddress;
  collateralToken: HexAddress;
  collateralAmount: string | number;
  sizeDeltaUsd: string | number;
  triggerPrice?: string | number; // Optional for market orders
  acceptablePrice?: string | number; // Optional, defaults to max for longs, 0 for shorts
  isLong: boolean;
  orderType?: OrderType; // Optional, defaults to MarketIncrease
  callbackContract?: HexAddress; // Optional callback contract
  uiFeeReceiver?: HexAddress; // Optional UI fee receiver
};

/**
 * Hook for trading perpetuals using the Router and OrderHandler contracts
 */
export const usePerpTrading = (
  routerAddress: HexAddress,
  orderVaultAddress: HexAddress
) => {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<HexAddress | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Creates a perpetual position order
   */
  const createOrder = useCallback(async ({
    marketAddress,
    collateralToken,
    collateralAmount,
    sizeDeltaUsd,
    triggerPrice = 0,
    acceptablePrice,
    isLong,
    orderType = OrderType.MarketIncrease,
    callbackContract = '0x0000000000000000000000000000000000000000' as HexAddress,
    uiFeeReceiver = '0x0000000000000000000000000000000000000000' as HexAddress
  }: CreatePerpOrderParams) => {
    if (!address) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Parse inputs to appropriate formats
      const collateralAmountBigInt = parseUnits(collateralAmount.toString(), 18);
      const sizeDeltaUsdBigInt = parseUnits(sizeDeltaUsd.toString(), 18);
      const triggerPriceBigInt = parseUnits(triggerPrice?.toString() || '0', 0);
      
      // Set acceptable price based on position direction if not provided
      let acceptablePriceBigInt;
      if (acceptablePrice !== undefined) {
        acceptablePriceBigInt = parseUnits(acceptablePrice.toString(), 0);
      } else {
        // For longs, max price. For shorts, min price
        acceptablePriceBigInt = isLong 
          ? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') // max uint256
          : 0n;
      }

      // Execution fee (taken from your CreateOrderScript)
      const executionFee = parseUnits('1', 9); // 1 * 10^9 (1 GWEI)

      // Create OrderHandler.CreateOrderParams struct
      const orderParams = {
        receiver: address,
        cancellationReceiver: address,
        callbackContract: callbackContract,
        uiFeeReceiver: uiFeeReceiver,
        market: marketAddress,
        initialCollateralToken: collateralToken,
        orderType: orderType,
        sizeDeltaUsd: sizeDeltaUsdBigInt,
        initialCollateralDeltaAmount: collateralAmountBigInt,
        triggerPrice: triggerPriceBigInt,
        acceptablePrice: acceptablePriceBigInt,
        executionFee: executionFee,
        validFromTime: 0n,
        isLong: isLong,
        autoCancel: false
      };

      // Toast notification for approval process
      toast.info('Checking token approvals...');

      // Check token allowance and approve if necessary
      const allowance = await readContract(wagmiConfig, {
        address: collateralToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, routerAddress],
      });

      if (BigInt(allowance) < collateralAmountBigInt) {
        toast.info('Approving tokens...');
        const approvalHash = await writeContract(wagmiConfig, {
          account: address,
          address: collateralToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [routerAddress, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')], // approve max
        });

        toast.info('Waiting for approval confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash });
        toast.success('Token approval confirmed');
      }

      // Prepare multicall data array
      // Similar to your CreateOrderScript.createMarketOrder function
      const multicallData = [
        // 1. Send execution fee in native token
        encodeFunctionData({
          abi: RouterABI,
          functionName: 'sendWnt',
          args: [orderVaultAddress, executionFee]
        }),
        
        // 2. Send collateral tokens
        encodeFunctionData({
          abi: RouterABI,
          functionName: 'sendTokens',
          args: [collateralToken, orderVaultAddress, collateralAmountBigInt]
        }),
        
        // 3. Create the actual order
        encodeFunctionData({
          abi: RouterABI,
          functionName: 'createOrder',
          args: [orderParams]
        })
      ];

      // Execute the multicall
      toast.info('Submitting order...');
      
      // Fix: Fix value issue by properly specifying the object without the value property
      // if the transaction doesn't require sending ETH
      const txHash = await writeContract(wagmiConfig, {
        account: address,
        address: routerAddress,
        abi: RouterABI,
        functionName: 'multicall',
        args: [multicallData],
        // Only include value if needed - commenting out to avoid type error
        // value: ... 
      }) as HexAddress;

      // If you need to send ETH with the transaction, use this approach instead:
      /*
      const txHash = await writeContract(wagmiConfig, {
        account: address,
        address: routerAddress,
        abi: RouterABI,
        functionName: 'multicall',
        args: [multicallData],
        // Use type assertion to make TypeScript happy
        ...(executionFee > 0n ? { value: executionFee.toString() } : {})
      }) as HexAddress;
      */

      setTxHash(txHash);
      toast.info('Transaction submitted, waiting for confirmation...');

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      
      if (receipt.status === 'success') {
        toast.success(`${isLong ? 'Long' : 'Short'} position created successfully!`);
        return { success: true, txHash };
      } else {
        toast.error('Transaction failed on-chain');
        setError(new Error('Transaction failed on-chain'));
        return { success: false, txHash };
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err : new Error('Failed to create order'));
      toast.error(err instanceof Error ? err.message : 'Failed to create order');
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  }, [address, routerAddress, orderVaultAddress]);

  /**
   * Cancels an existing order by key
   */
  const cancelOrder = useCallback(async (orderKey: bigint) => {
    if (!address) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Call cancelOrder function directly
      const txHash = await writeContract(wagmiConfig, {
        account: address,
        address: routerAddress,
        abi: RouterABI,
        functionName: 'cancelOrder',
        args: [orderKey],
      }) as HexAddress;

      setTxHash(txHash);
      toast.info('Cancel request submitted, waiting for confirmation...');

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      
      if (receipt.status === 'success') {
        toast.success('Order cancelled successfully');
        return { success: true, txHash };
      } else {
        toast.error('Cancel transaction failed on-chain');
        setError(new Error('Cancel transaction failed on-chain'));
        return { success: false, txHash };
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err instanceof Error ? err : new Error('Failed to cancel order'));
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order');
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  }, [address, routerAddress]);

  /**
   * Helper function to create common market increase positions
   * with simplified interface (10x leverage by default)
   */
  const createLeveragedPosition = useCallback(async ({
    marketAddress,
    collateralToken,
    collateralAmount,
    leverage = 10, // Default 10x leverage
    isLong
  }: {
    marketAddress: HexAddress,
    collateralToken: HexAddress,
    collateralAmount: string | number,
    leverage?: number,
    isLong: boolean
  }) => {
    // Calculate position size based on collateral and leverage
    const positionSizeUsd = Number(collateralAmount) * leverage;
    
    return createOrder({
      marketAddress,
      collateralToken,
      collateralAmount,
      sizeDeltaUsd: positionSizeUsd,
      isLong,
      orderType: OrderType.MarketIncrease,
      triggerPrice: 0, // Immediate execution
    });
  }, [createOrder]);

  return {
    createOrder,
    cancelOrder,
    createLeveragedPosition,
    txHash,
    isProcessing,
    error
  };
};