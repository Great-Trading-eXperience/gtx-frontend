// Full revised hook: useCrossChainOrder.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, readContract, getBytecode } from '@wagmi/core';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

import HyperlaneABI from '@/abis/espresso/HyperlaneABI';

import type { HexAddress } from '@/types/web3/general/address';

export enum OrderAction {
  Transfer = 0,
  Swap = 1,
}

interface OrderResult {
  success: boolean;
  txHash?: HexAddress;
  error?: Error;
}

export type CreateCrossChainOrderParams = {
  sender?: HexAddress;
  recipient: HexAddress;
  inputToken: HexAddress;
  outputToken: HexAddress;
  targetInputToken: HexAddress;
  targetOutputToken: HexAddress;
  amountIn: string | number;
  amountOut: string | number;
  destinationDomain?: number;
  targetDomain?: number;
  destinationRouter: HexAddress;
  orderAction?: OrderAction;
  fillDeadline?: number;
};

const DEFAULT_DESTINATION_DOMAIN = parseInt(process.env.NEXT_PUBLIC_DESTINATION_DOMAIN || '421614');
const DEFAULT_TARGET_DOMAIN = parseInt(process.env.NEXT_PUBLIC_TARGET_DOMAIN || '1020201');

export const useCrossChainOrder = (
  localRouterAddress: HexAddress,
) => {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<HexAddress | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getLocalDomain = useCallback(async (): Promise<number> => {
    try {
      const localDomain = await readContract(wagmiConfig, {
        address: localRouterAddress,
        abi: HyperlaneABI,
        functionName: 'localDomain',
      });
      return Number(localDomain);
    } catch (err) {
      console.warn('Failed to read localDomain, fallback used:', err);
      const isGtx = localRouterAddress.toLowerCase() === process.env.NEXT_PUBLIC_ROUTER_GTX_ADDRESS?.toLowerCase();
      return isGtx ? 1020201 : 421614;
    }
  }, [localRouterAddress]);

  // Fixed getOrderStatus function for useCrossChainOrder.ts
  const getOrderStatus = useCallback(async (orderId: string): Promise<string> => {
    try {
      // Get contract address for debug logging
      console.log(`Checking order status for ID ${orderId} on contract ${localRouterAddress}`);

      // First get status constants from the contract - each in a separate try/catch
      // This way if one fails, the others can still be tried
      let OPENED_STATUS, FILLED_STATUS, SETTLED_STATUS, REFUNDED_STATUS, UNKNOWN_STATUS;

      try {
        OPENED_STATUS = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'OPENED',
        });
        console.log('OPENED constant:', OPENED_STATUS);
      } catch (err) {
        console.warn('Failed to read OPENED constant');
      }

      try {
        FILLED_STATUS = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'FILLED',
        });
        console.log('FILLED constant:', FILLED_STATUS);
      } catch (err) {
        console.warn('Failed to read FILLED constant');
      }

      try {
        SETTLED_STATUS = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'SETTLED',
        });
        console.log('SETTLED constant:', SETTLED_STATUS);
      } catch (err) {
        console.warn('Failed to read SETTLED constant');
      }

      try {
        REFUNDED_STATUS = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'REFUNDED',
        });
        console.log('REFUNDED constant:', REFUNDED_STATUS);
      } catch (err) {
        console.warn('Failed to read REFUNDED constant');
      }

      try {
        UNKNOWN_STATUS = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'UNKNOWN',
        });
        console.log('UNKNOWN constant:', UNKNOWN_STATUS);
      } catch (err) {
        console.warn('Failed to read UNKNOWN constant');
      }

      // Then try to get the status of this specific order
      let status;
      try {
        status = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'orderStatus',
          args: [orderId],
        });
        console.log(`Order status for ${orderId}:`, status);

        // Compare with constants if we were able to get them
        if (status && OPENED_STATUS && status === OPENED_STATUS) return 'OPENED';
        if (status && FILLED_STATUS && status === FILLED_STATUS) return 'FILLED';
        if (status && SETTLED_STATUS && status === SETTLED_STATUS) return 'SETTLED';
        if (status && REFUNDED_STATUS && status === REFUNDED_STATUS) return 'REFUNDED';
        if (status && UNKNOWN_STATUS && status === UNKNOWN_STATUS) return 'UNKNOWN';

        // If we got a status but couldn't match it to a constant
        return 'PROCESSING';
      } catch (statusErr) {
        console.warn('Failed to read order status directly, trying alternative methods:', statusErr);
      }

      // Fallback: Check other mappings to infer status
      try {
        const orderData = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'openOrders',
          args: [orderId],
        });

        console.log(`openOrders data for ${orderId}:`, orderData);
        if (orderData && orderData !== '0x') {
          return 'OPENED';
        }
      } catch (openOrderErr) {
        console.warn('Could not get openOrders data:', openOrderErr);
      }

      try {
        const filledOrderData = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'filledOrders',
          args: [orderId],
        });

        console.log(`filledOrders data for ${orderId}:`, filledOrderData);
        if (filledOrderData && typeof filledOrderData === 'object' && filledOrderData !== null) {
          // Check if we have originData or fillerData
          const originData = (filledOrderData as any)[0] || '0x';
          const fillerData = (filledOrderData as any)[1] || '0x';

          if ((originData && originData !== '0x') || (fillerData && fillerData !== '0x')) {
            return 'FILLED';
          }
        }
      } catch (filledOrderErr) {
        console.warn('Could not get filledOrders data:', filledOrderErr);
      }

      // If no status determined by direct checks, try to look for events
      // Since this is client-side code and we don't want to scan the blockchain here,
      // we'll return a generic status
      return 'PROCESSING';
    } catch (err) {
      console.error('Error in getOrderStatus:', err);
      return 'UNKNOWN';
    }
  }, [localRouterAddress]);

  const createOrder = useCallback(async (params: CreateCrossChainOrderParams): Promise<OrderResult> => {
    let {
      sender,
      recipient,
      inputToken,
      outputToken,
      targetInputToken,
      targetOutputToken,
      amountIn,
      amountOut,
      destinationDomain = DEFAULT_DESTINATION_DOMAIN,
      targetDomain = DEFAULT_TARGET_DOMAIN,
      destinationRouter,
      orderAction = OrderAction.Transfer,
      fillDeadline = Math.floor(2 ** 32 - 1),
    } = params;

    if (!address) {
      toast.error('Wallet not connected');
      return { success: false, error: new Error('Wallet not connected') };
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('Creating order with tokens:', {
        inputToken,
        outputToken,
        targetInputToken,
        targetOutputToken,
        destinationDomain,
        targetDomain,
      });

      const bytecode = await getBytecode(wagmiConfig, { address: inputToken });
      if (!bytecode || bytecode === '0x') {
        console.warn('⚠️ inputToken is not a contract. Attempting to switch with outputToken.');
        const temp = inputToken;
        inputToken = outputToken;
        outputToken = temp;
        targetInputToken = outputToken;
        targetOutputToken = inputToken;
        console.log('🔁 Tokens switched:', { inputToken, outputToken });
      }

      const originDomain = await getLocalDomain();
      const amountInBigInt = parseUnits(amountIn.toString(), 18);
      const amountOutBigInt = parseUnits(amountOut.toString(), 18);

      const isNativeToken = inputToken === '0x0000000000000000000000000000000000000000';
      if (!isNativeToken) {
        try {
          toast.info('Checking token approvals...');
          console.log(`Calling allowance on token: ${inputToken}`);

          const allowance = await readContract(wagmiConfig, {
            address: inputToken,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, localRouterAddress],
          });

          console.log('Allowance:', allowance);

          if (BigInt(allowance) < amountInBigInt) {
            toast.info('Approving tokens...');
            const approvalHash = await writeContract(wagmiConfig, {
              account: address,
              address: inputToken,
              abi: erc20Abi,
              functionName: 'approve',
              args: [localRouterAddress, amountInBigInt],
            });
            console.log('Approval tx hash:', approvalHash);
            toast.info('Waiting for approval confirmation...');
            await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash });
            toast.success('Token approval confirmed');
          }
        } catch (approvalError) {
          console.error('Token approval error:', approvalError);
          toast.error('Token approval failed. Ensure the token is ERC-20.');
          throw approvalError;
        }
      }

      const addressToBytes32 = (addr: HexAddress): `0x${string}` => {
        return `0x${addr.slice(2).padStart(64, '0')}` as `0x${string}`;
      };

      const orderData = {
        sender: addressToBytes32(sender || address),
        recipient: addressToBytes32(recipient),
        inputToken: addressToBytes32(inputToken),
        outputToken: addressToBytes32(outputToken),
        targetInputToken: addressToBytes32(targetInputToken),
        targetOutputToken: addressToBytes32(targetOutputToken),
        amountIn: amountInBigInt,
        amountOut: amountOutBigInt,
        originDomain,
        destinationDomain,
        targetDomain,
        destinationRouter: addressToBytes32(destinationRouter),
        originRouter: addressToBytes32(localRouterAddress),
        fillDeadline,
        orderAction,
        data: '0x' as `0x${string}`
      };

      console.log('Order data:', orderData);

      let gasPayment: bigint = BigInt(0);
      try {
        gasPayment = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'quoteGasPayment',
          args: [destinationDomain],
        }) as bigint;
      } catch (gasError) {
        console.warn('⚠️ quoteGasPayment failed. Falling back to destinationGas or default.', gasError);
        try {
          gasPayment = await readContract(wagmiConfig, {
            address: localRouterAddress,
            abi: HyperlaneABI,
            functionName: 'destinationGas',
            args: [destinationDomain],
          }) as bigint;
        } catch (fallbackError) {
          console.warn('⚠️ destinationGas fallback also failed. Using hardcoded fallback.');
          gasPayment = parseUnits('0.0005', 18);
        }
      }

      const orderDataType = '0x9c7aab7f49a111c0872e9dbbd8df4ee0cb5b02d0e6b4b8d01f3e78fe8da9416e';
      const encodedOrderData = '0x';

      const onchainOrder = {
        fillDeadline,
        orderDataType,
        orderData: encodedOrderData,
      };

      console.log('Submitting onchain order:', onchainOrder);

      let txHash;
      if (isNativeToken) {
        const totalValue = amountInBigInt + gasPayment;
        txHash = await writeContract(wagmiConfig, {
          account: address,
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'open',
          args: [onchainOrder],
          value: totalValue
        }) as HexAddress;
      } else {
        txHash = await writeContract(wagmiConfig, {
          account: address,
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'open',
          args: [onchainOrder],
          value: gasPayment
        }) as HexAddress;
      }

      setTxHash(txHash);
      toast.info('Transaction submitted, awaiting confirmation...');

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      console.log('Transaction receipt:', receipt);

      if (receipt.status === 'success') {
        toast.success('Cross-chain order created successfully!');
        return { success: true, txHash };
      } else {
        toast.error('Transaction failed on-chain');
        const error = new Error('Transaction failed on-chain');
        setError(error);
        return { success: false, error };
      }
    } catch (err) {
      console.error('Error creating cross-chain order:', err);
      const errorObj = err instanceof Error ? err : new Error('Order creation failed');
      setError(errorObj);
      toast.error(errorObj.message);
      return { success: false, error: errorObj };
    } finally {
      setIsProcessing(false);
    }
  }, [address, localRouterAddress, getLocalDomain]);

  return {
    createOrder,
    getOrderStatus,
    getLocalDomain,
    txHash,
    isProcessing,
    error,
  };
};

export default useCrossChainOrder;