// useCrossChainOrder.ts
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, readContract, getBytecode } from '@wagmi/core';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

import HyperlaneABI from '@/abis/espresso/HyperlaneABI';
import type { HexAddress } from '@/types/general/address';
import OrderEncoder from '@/types/espresso/OrderEncoder';
import { ContractName, 
  DESTINATION_DOMAIN, 
  getContractAddress, 
  TARGET_DOMAIN,
  NETWORK as CONFIG_NETWORK,
  MAILBOX_ADDRESS
} from '@/constants/contract/contract-address';

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
  action?: number; // Changed from orderAction to action
  fillDeadline?: number;
};

// Helper function to get token addresses from contract-address.json
function getTokenAddress(chainId: string, tokenName: ContractName): HexAddress {
  try {
    return getContractAddress(chainId, tokenName) as HexAddress;
  } catch (error) {
    console.warn(`Failed to get address for ${tokenName} on chain ${chainId}:`, error);
    return '0x0000000000000000000000000000000000000000' as HexAddress;
  }
}


const DEFAULT_DESTINATION_DOMAIN = parseInt(DESTINATION_DOMAIN || '421614');
const DEFAULT_TARGET_DOMAIN = parseInt(TARGET_DOMAIN || '1020201');

/**
 * Network and domain configuration
 */
export const NETWORK = {
  NAME: CONFIG_NETWORK || 'arbitrum-sepolia',
};

/**
 * Hyperlane configuration with router addresses
 */
export const HYPERLANE = {
  MAILBOX: MAILBOX_ADDRESS as HexAddress,
  ROUTER: {
    ARBITRUM_SEPOLIA: getContractAddress('421614', ContractName.router) as HexAddress,
    GTXPRESSO: getContractAddress('1020201', ContractName.router) as HexAddress,
  },
  DOMAIN: {
    ARBITRUM_SEPOLIA: DEFAULT_DESTINATION_DOMAIN,
    GTXPRESSO: DEFAULT_TARGET_DOMAIN,
  },
};

/**
 * Token addresses
 */
export const TOKENS = {
  ARBITRUM_SEPOLIA: {
    WETH: getTokenAddress('421614', ContractName.weth),
    WBTC: getTokenAddress('421614', ContractName.wbtc),
    USDC: getTokenAddress('421614', ContractName.usdc),
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  },
  GTXPRESSO: {
    WETH: getTokenAddress('1020201', ContractName.weth),
    WBTC: getTokenAddress('1020201', ContractName.wbtc),
    USDC: getTokenAddress('1020201', ContractName.usdc),
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  }
};

// Get current domain ID
const getCurrentDomainId = async (router: HexAddress): Promise<number> => {
  try {
    const domain = await readContract(
      wagmiConfig,
      {
        address: router,
        abi: HyperlaneABI,
        functionName: 'localDomain',
      }
    );
    return Number(domain);
  } catch (err) {
    console.warn('Failed to read localDomain from contract:', err);
    // Fallback based on router address
    const isGtx = router.toLowerCase() === HYPERLANE.ROUTER.GTXPRESSO.toLowerCase();
    return isGtx ? HYPERLANE.DOMAIN.GTXPRESSO : HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

// Get domain ID for network
const getDomainId = (network: string): number => {
  switch (network) {
    case 'arbitrum-sepolia':
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return HYPERLANE.DOMAIN.GTXPRESSO;
    default:
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

// Get router address for network
const getRouterAddressForNetwork = (network: string): HexAddress => {
  switch (network) {
    case 'arbitrum-sepolia':
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return HYPERLANE.ROUTER.GTXPRESSO;
    default:
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
  }
};

// Get current router address
const getCurrentRouterAddress = (): HexAddress => {
  return getRouterAddressForNetwork(NETWORK.NAME);
};

// Get network tokens
const getNetworkTokens = (network: string): Record<string, HexAddress> => {
  switch (network) {
    case 'arbitrum-sepolia':
      return TOKENS.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return TOKENS.GTXPRESSO;
    default:
      return TOKENS.ARBITRUM_SEPOLIA;
  }
};

// Get remote network based on current network
const getRemoteNetwork = (currentNetwork: string = NETWORK.NAME): string => {
  switch (currentNetwork) {
    case 'arbitrum-sepolia':
      return 'gtxpresso';
    case 'gtxpresso':
      return 'arbitrum-sepolia';
    default:
      return 'gtxpresso';
  }
};

// Get remote router address based on current network
const getRemoteRouterAddress = (currentNetwork: string = NETWORK.NAME): HexAddress => {
  return getRouterAddressForNetwork(getRemoteNetwork(currentNetwork));
};

// Get remote domain ID based on current network
const getRemoteDomainId = (currentNetwork: string = NETWORK.NAME): number => {
  return getDomainId(getRemoteNetwork(currentNetwork));
};

// Check if a token is supported on a network
const isTokenSupportedOnNetwork = (token: HexAddress, network: string): boolean => {
  const networkTokens = getNetworkTokens(network);
  return Object.values(networkTokens).some(addr => addr.toLowerCase() === token.toLowerCase());
};

// Get equivalent token on remote network
const getEquivalentTokenOnNetwork = (
  token: HexAddress,
  sourceNetwork: string,
  targetNetwork: string
): HexAddress | null => {
  // Find the token symbol in source network
  const sourceTokens = getNetworkTokens(sourceNetwork);
  const tokenSymbol = Object.keys(sourceTokens).find(
    symbol => sourceTokens[symbol].toLowerCase() === token.toLowerCase()
  );

  if (!tokenSymbol) return null;

  // Get the equivalent token on target network
  const targetTokens = getNetworkTokens(targetNetwork);
  return targetTokens[tokenSymbol] || null;
};

// Helper function to convert address to bytes32
export const addressToBytes32 = (addr: HexAddress): HexAddress => {
  return `0x${addr.slice(2).padStart(64, '0')}` as HexAddress;
};

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
      console.warn('Failed to read localDomain, using fallback:', err);
      const isGtx = localRouterAddress.toLowerCase() === getContractAddress('1020201', ContractName.router)?.toLowerCase();
      return isGtx ? 1020201 : 421614;
    }
  }, [localRouterAddress]);

  const getOrderStatus = useCallback(async (orderIdOrTxHash: string): Promise<string> => {
    try {
      // Determine if we have an orderId or txHash
      let orderId = orderIdOrTxHash;

      // If this looks like a transaction hash, try to extract the orderId from events
      if (orderIdOrTxHash.startsWith('0x') && orderIdOrTxHash.length === 66) {
        try {
          console.log(`Looking up transaction receipt for ${orderIdOrTxHash}`);
          // This would typically involve parsing the transaction logs
          // For now, we'll just use the hash as the orderId
        } catch (err) {
          console.warn('Failed to get transaction receipt:', err);
        }
      }

      console.log(`Checking order status for ID ${orderId} on contract ${localRouterAddress}`);

      // Get status constants from the contract
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

      // Get the actual status of this order
      let status;
      try {
        status = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'orderStatus',
          args: [orderId],
        });
        console.log(`Order status for ${orderId}:`, status);

        // Compare with constants
        if (status && OPENED_STATUS && status === OPENED_STATUS) return 'OPENED';
        if (status && FILLED_STATUS && status === FILLED_STATUS) return 'FILLED';
        if (status && SETTLED_STATUS && status === SETTLED_STATUS) return 'SETTLED';
        if (status && REFUNDED_STATUS && status === REFUNDED_STATUS) return 'REFUNDED';
        if (status && UNKNOWN_STATUS && status === UNKNOWN_STATUS) return 'UNKNOWN';

        return 'PROCESSING';
      } catch (statusErr) {
        console.warn('Failed to read order status directly, trying alternative methods:', statusErr);
      }

      // Fallback: Check openOrders mapping
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

      // Check filledOrders mapping
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

      // If all else fails, return PROCESSING as a default
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
      action = 0, // Default to Transfer (0), changed from orderAction 
      fillDeadline = Math.floor(2 ** 32 - 1),
    } = params;

    console.log("createOrder")
    console.log({
      sender,
      recipient,
      inputToken,
      outputToken,
      targetInputToken,
      targetOutputToken,
      amountIn,
      amountOut,
      destinationDomain,
      targetDomain,
      destinationRouter,
      action, // Default to Transfer (0), changed from orderAction 
      fillDeadline,
    })

    if (!address) {
      toast.error('Wallet not connected');
      return { success: false, error: new Error('Wallet not connected') };
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('Creating order with parameters:', {
        ...params
      });

      // Ensure targetInputToken and targetOutputToken are set
      if (!targetInputToken) targetInputToken = inputToken;
      if (!targetOutputToken) targetOutputToken = outputToken;

      // Check if inputToken is a contract (ERC20) or native token
      const bytecode = await getBytecode(wagmiConfig, { address: inputToken });
      const isNativeToken = !bytecode || bytecode === '0x';

      // if (isNativeToken) {
      //   console.log('Using native token as input');
      //   inputToken = '0x0000000000000000000000000000000000000000';
      // }

      // Get the local domain
      const originDomain = await getLocalDomain();

      // Convert amounts to BigInt
      const amountInBigInt = parseUnits(amountIn.toString(), 18);
      const amountOutBigInt = parseUnits(amountOut.toString(), 18);

      // For ERC20 tokens, check and approve if needed
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

          console.log('Current allowance:', allowance);

          if (BigInt(allowance) < amountInBigInt) {
            toast.info('Approving tokens...');
            console.log(`Approving ${formatUnits(amountInBigInt, 18)} tokens from ${address} to ${localRouterAddress}`);

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
          } else {
            console.log('Sufficient allowance already exists');
          }
        } catch (approvalError) {
          console.error('Token approval error:', approvalError);
          toast.error('Token approval failed. Please check the token contract.');
          throw approvalError;
        }
      }

      // Get the next nonce
      let nonce;
      try {
        const lastNonce = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'lastNonce',
        });
        nonce = Number(lastNonce) + 1;
        console.log('Using nonce:', nonce);
      } catch (nonceError) {
        console.warn('Failed to read lastNonce, using 1:', nonceError);
        nonce = 1; // Default nonce if we can't read from contract
      }

      // No special handling needed for token encoding - use the actual WETH address

      // Create the order data structure
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
        destinationSettler: addressToBytes32(destinationRouter),
        sourceSettler: addressToBytes32(localRouterAddress),
        fillDeadline,
        action, // Always 1 for cross-chain operations
        nonce: BigInt(nonce),
        data: '0x' as HexAddress
      };

      console.log('Order Parameters Comparison:');
      console.log('==========================');
      console.log(`Order Type : ${OrderEncoder.orderDataType()}`);
      console.log(`Sender : ${orderData.sender}`);
      console.log(`Recipient : ${orderData.recipient}`);
      console.log(`Input Token : ${orderData.inputToken}`);
      console.log(`Output Token : ${orderData.outputToken}`);
      console.log(`Target Input Token : ${orderData.targetInputToken}`);
      console.log(`Target Output Token : ${orderData.targetOutputToken}`);
      console.log(`Amount In : ${formatUnits(orderData.amountIn, 18)}`);
      console.log(`Amount Out : ${formatUnits(orderData.amountOut, 18)}`);
      console.log(`Origin Domain : ${orderData.originDomain}`);
      console.log(`Destination Domain : ${orderData.destinationDomain}`);
      console.log(`Target Domain : ${orderData.targetDomain}`);
      console.log(`Destination Router : ${orderData.destinationSettler}`);
      console.log(`Local Router : ${orderData.sourceSettler}`);
      console.log(`Fill Deadline : ${orderData.fillDeadline}`);
      console.log(`Nonce : ${orderData.nonce}`);
      console.log('==========================');

      console.log('Order data structure:', orderData);

      // return;

      // Encode the order data
      const encodedOrderData = OrderEncoder.encode(orderData);
      console.log('Encoded order data:', encodedOrderData);

      // Create the onchain order structure
      const onchainOrder = {
        fillDeadline,
        orderDataType: OrderEncoder.orderDataType(),
        orderData: encodedOrderData
      };

      console.log('Final onchain order structure:', onchainOrder);

      // Calculate gas payment for cross-chain message
      let gasPayment: bigint = BigInt(0);
      try {
        gasPayment = await readContract(wagmiConfig, {
          address: localRouterAddress,
          abi: HyperlaneABI,
          functionName: 'quoteGasPayment',
          args: [destinationDomain],
        }) as bigint;
        console.log('Gas payment for destination domain:', gasPayment.toString());
      } catch (gasError) {
        console.warn('⚠️ quoteGasPayment failed. Using fallback value.', gasError);
        try {
          gasPayment = await readContract(wagmiConfig, {
            address: localRouterAddress,
            abi: HyperlaneABI,
            functionName: 'destinationGas',
            args: [destinationDomain],
          }) as bigint;
          console.log('Fallback gas from destinationGas:', gasPayment.toString());
        } catch (fallbackError) {
          console.warn('⚠️ destinationGas also failed. Using hardcoded fallback.');
          gasPayment = parseUnits('0.0005', 18);
          console.log('Using hardcoded gas payment:', gasPayment.toString());
        }
      }

      // Submit the transaction - always using ERC20 tokens (no native ETH case)
      console.log('Sending transaction with ERC20 token. Gas payment:', formatUnits(gasPayment, 18));

      console.log('onChainOrder', onchainOrder)

      const txHash = await writeContract(wagmiConfig, {
        account: address,
        address: localRouterAddress,
        abi: HyperlaneABI,
        functionName: 'open',
        args: [onchainOrder],
        value: gasPayment
      }) as HexAddress;

      setTxHash(txHash);
      toast.info('Transaction submitted, awaiting confirmation...');
      console.log('Transaction hash:', txHash);

      // Wait for transaction confirmation
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

      // Format error message for user
      const errorObj = err instanceof Error ? err : new Error('Order creation failed');

      // Try to extract more specific error information
      if (typeof err === 'object' && err !== null) {
        // Check for common contract errors
        const errorMessage = (err as any).message || '';
        if (errorMessage.includes('InvalidOrderDomain')) {
          errorObj.message = 'Invalid order domain. Please check network selection.';
        } else if (errorMessage.includes('InvalidNativeAmount')) {
          errorObj.message = 'Invalid native token amount. Please check your inputs.';
        } else if (errorMessage.includes('user rejected transaction')) {
          errorObj.message = 'Transaction was rejected by the wallet.';
        } else if (errorMessage.includes('InvalidOrderType')) {
          errorObj.message = 'Invalid order type. There may be a contract configuration issue.';
        }
      }

      setError(errorObj);
      toast.error(errorObj.message);
      return { success: false, error: errorObj };
    } finally {
      setIsProcessing(false);
    }
  }, [address, localRouterAddress, getLocalDomain]);

  // Get gas payment estimate for cross-chain transfer
  const estimateGasPayment = async (sourceNetwork: string, destinationNetwork: string): Promise<string> => {
    try {
      const sourceRouter = getRouterAddressForNetwork(sourceNetwork);
      const destinationDomain = getDomainId(destinationNetwork);

      const gasPayment = await readContract(
        wagmiConfig,
        {
          address: sourceRouter,
          abi: HyperlaneABI,
          functionName: 'quoteGasPayment',
          args: [destinationDomain],
        }
      );

      return (Number(gasPayment) / 10**18).toFixed(6);
    } catch (error) {
      console.warn('Failed to estimate gas payment:', error);
      return '0.0005';
    }
  };

  return {
    txHash,
    isProcessing,
    error,
    NETWORK,
    HYPERLANE,
    TOKENS,
    createOrder,
    getOrderStatus,
    getLocalDomain,
    getCurrentDomainId,
    getDomainId,
    getCurrentRouterAddress,
    getNetworkTokens,
    getRemoteNetwork,
    getRemoteRouterAddress,
    getRemoteDomainId,
    getRouterAddressForNetwork,
    isTokenSupportedOnNetwork,
    getEquivalentTokenOnNetwork,
    estimateGasPayment,
    currentNetwork: NETWORK.NAME,
    currentRouter: localRouterAddress,
    getTokens: (network?: string) => getNetworkTokens(network || NETWORK.NAME)
  };
};

export default useCrossChainOrder;