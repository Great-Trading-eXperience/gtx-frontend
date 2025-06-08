// useCrossChainOrder.ts - Improved Pharos version
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

import HyperlaneABI from '@/abis/pharos/HyperlaneABI';
import type { HexAddress } from '@/types/general/address';
import OrderEncoder from '@/types/espresso/OrderEncoder';
import { useCrossChainPharos } from './useCrossChain';
import type { Token } from '@/components/pharos/swap/token-network-selector';

export enum OrderAction {
    Transfer = 0,
    Swap = 1,
}

interface OrderResult {
    success: boolean;
    txHash?: HexAddress;
    error?: Error;
    orderId?: string;
}

export type CreateCrossChainOrderParams = {
    sender?: HexAddress;
    recipient: HexAddress;
    inputToken: HexAddress;
    outputToken: HexAddress;
    targetInputToken?: HexAddress;
    targetOutputToken?: HexAddress;
    amountIn: string | number;
    amountOut: string | number;
    destinationDomain?: number;
    targetDomain?: number;
    destinationRouter: HexAddress;
    action?: number;
    fillDeadline?: number;
};

// Helper function to convert address to bytes32
export const addressToBytes32 = (addr: HexAddress): HexAddress => {
    if (!addr || typeof addr !== 'string' || !addr.startsWith('0x')) {
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    return `0x000000000000000000000000${addr.slice(2)}` as HexAddress;
};

// Helper to check if address is native token (address(0) in Solidity)
export const isNativeToken = (addr: HexAddress): boolean => {
    return !addr || addr === '0x0000000000000000000000000000000000000000';
};

// Helper function to extract readable error messages from blockchain errors
function getReadableErrorMessage(error: any): string {
    if (!error) return 'Unknown error';

    // Check for smart contract specific errors from the ABI
    if (error.message) {
        if (error.message.includes('InvalidOrderDomain')) {
            return 'Invalid order domain. Please check that your networks are configured correctly.';
        }
        if (error.message.includes('InvalidNativeAmount')) {
            return 'Invalid amount for native token. Make sure you have enough balance including gas fees.';
        }
        if (error.message.includes('InvalidOrderType')) {
            return 'Invalid order type. The contract doesn\'t support this order data format.';
        }
        if (error.message.includes('OrderFillExpired')) {
            return 'The order fill deadline has expired. Please create a new order.';
        }
        if (error.message.includes('InvalidNonce')) {
            return 'Invalid nonce value. This might be due to a conflict with another transaction.';
        }
        if (error.message.includes('InvalidOrderOrigin')) {
            return 'Invalid order origin. The sender is not authorized to create this order.';
        }
    }

    // General error types
    if (error.message && error.message.includes('HTTP request failed')) {
        const urlMatch = error.message.match(/URL: ([^\s]+)/);
        const url = urlMatch ? urlMatch[1] : 'unknown RPC endpoint';
        return `Network connection issue with ${url}. Please check your network connection.`;
    }

    if (error.message && error.message.includes('user rejected transaction')) {
        return 'Transaction was rejected in your wallet.';
    }

    if (error.message && error.message.includes('execution reverted')) {
        return 'Contract error: Transaction would fail on chain. Please check your inputs.';
    }

    if (error.message && (error.message.includes('insufficient funds') || error.message.includes('gas required exceeds allowance'))) {
        return 'Insufficient funds for transaction. Please check your balance.';
    }

    // Default case: return the actual error message or a generic one
    return error.message || 'An unexpected error occurred';
}

const formatAddressShort = (address?: string) => {
    if (typeof address === 'string' && address.length >= 10) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return 'N/A';
};

const formatTokenDisplay = (token: Token | null) =>
    token && token.address
        ? `${token.name} (${token.symbol}) ${formatAddressShort(token.address)}`
        : '';

export const useCrossChainOrderPharos = (
    localRouterAddress: HexAddress,
) => {
    const { address } = useAccount();
    const {
        currentNetwork,
        currentDomain,
        remoteDomain,
        gtxHostChainId,
        estimateGasPayment,
        getContractStatus
    } = useCrossChainPharos();

    const [txHash, setTxHash] = useState<HexAddress | undefined>(undefined);
    const [orderId, setOrderId] = useState<string | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Get local domain, with GTX host chain ID handling
    const getLocalDomain = useCallback(async (): Promise<number> => {
        // First try to use GTX host chain ID if available
        if (gtxHostChainId) {
            return gtxHostChainId;
        }

        // Then use domain from context if available
        if (currentDomain) {
            return currentDomain;
        }

        // Otherwise read from contract directly
        try {
            // Try GTX_HOST_CHAIN_ID first
            try {
                const gtxChainId = await readContract(wagmiConfig, {
                    address: localRouterAddress,
                    abi: HyperlaneABI,
                    functionName: 'GTX_HOST_CHAIN_ID',
                });
                return Number(gtxChainId);
            } catch (gtxError) {
                console.warn('Failed to read GTX_HOST_CHAIN_ID, trying localDomain:', gtxError);
            }

            // Fallback to localDomain
            const localDomain = await readContract(wagmiConfig, {
                address: localRouterAddress,
                abi: HyperlaneABI,
                functionName: 'localDomain',
            });
            return Number(localDomain);
        } catch (err) {
            console.warn('Failed to read domain from contract, using fallback based on network:', err);
            // Get domain based on network name or chain ID
            const chainId = currentNetwork === 'arbitrum-sepolia' ? 421614 : 11155931;
            return chainId;
        }
    }, [localRouterAddress, currentDomain, gtxHostChainId, currentNetwork]);

    // Get order status using contract-provided status constants
    const getOrderStatus = useCallback(async (orderIdOrTxHash: string): Promise<string> => {
        try {
            // If context provides a direct contract status check, use it
            if (getContractStatus) {
                return getContractStatus(orderIdOrTxHash);
            }

            // Otherwise implement our own status check
            let orderId = orderIdOrTxHash;

            // If this looks like a transaction hash, just use it as the orderId for now
            if (orderIdOrTxHash.startsWith('0x') && orderIdOrTxHash.length === 66) {
                console.log(`Using transaction hash as orderId: ${orderIdOrTxHash}`);
                orderId = orderIdOrTxHash;
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
            } catch (err) {
                console.warn('Failed to read OPENED constant');
            }

            try {
                FILLED_STATUS = await readContract(wagmiConfig, {
                    address: localRouterAddress,
                    abi: HyperlaneABI,
                    functionName: 'FILLED',
                });
            } catch (err) {
                console.warn('Failed to read FILLED constant');
            }

            try {
                SETTLED_STATUS = await readContract(wagmiConfig, {
                    address: localRouterAddress,
                    abi: HyperlaneABI,
                    functionName: 'SETTLED',
                });
            } catch (err) {
                console.warn('Failed to read SETTLED constant');
            }

            try {
                REFUNDED_STATUS = await readContract(wagmiConfig, {
                    address: localRouterAddress,
                    abi: HyperlaneABI,
                    functionName: 'REFUNDED',
                });
            } catch (err) {
                console.warn('Failed to read REFUNDED constant');
            }

            try {
                UNKNOWN_STATUS = await readContract(wagmiConfig, {
                    address: localRouterAddress,
                    abi: HyperlaneABI,
                    functionName: 'UNKNOWN',
                });
            } catch (err) {
                console.warn('Failed to read UNKNOWN constant');
            }

            // Get the actual status of this order
            try {
                const status = await readContract(wagmiConfig, {
                    address: localRouterAddress,
                    abi: HyperlaneABI,
                    functionName: 'orderStatus',
                    args: [orderId],
                });

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
    }, [localRouterAddress, getContractStatus]);

    // Calculate order ID based on parameters
    const calculateOrderId = useCallback((
        sender: HexAddress,
        originDomain: number,
        nonce: number
    ): string => {
        try {
            // This is a simplified version - actual implementation would use keccak256 hash
            // For a real implementation, you would need to match the contract's order ID calculation
            // This typically involves hashing the order parameters

            // For demonstration purposes only:
            const senderHex = sender.slice(2).padStart(64, '0');
            const domainHex = originDomain.toString(16).padStart(8, '0');
            const nonceHex = nonce.toString(16).padStart(64, '0');

            // This is NOT the actual contract implementation, just a placeholder
            return `0x${senderHex}${domainHex}${nonceHex}`.slice(0, 66);
        } catch (error) {
            console.warn('Failed to calculate order ID:', error);
            return '0x0000000000000000000000000000000000000000000000000000000000000000';
        }
    }, []);

    // Create order function - enhanced to use GTX features when available
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
            destinationDomain = remoteDomain || 11155931,
            targetDomain = 0, // Default to 0 which means no target domain
            destinationRouter,
            action = OrderAction.Transfer,
            fillDeadline = Math.floor(2 ** 32 - 1),
        } = params;

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

            // Set sender to current address if not provided
            if (!sender) {
                sender = address;
            }

            // Handle target domain and token logic to match smart contract behavior
            if (targetDomain === 0) {
                // If targetDomain is 0, set target tokens to address(0) as in the contract
                targetInputToken = '0x0000000000000000000000000000000000000000';
                targetOutputToken = '0x0000000000000000000000000000000000000000';
            } else if (!targetInputToken || !targetOutputToken) {
                // If target tokens not provided but target domain is valid, use equivalent tokens
                targetInputToken = inputToken;
                targetOutputToken = outputToken;
            }

            // Get the local domain
            const originDomain = await getLocalDomain();

            // Convert amounts to BigInt with 18 decimals (matching contract)
            const amountInBigInt = parseUnits(amountIn.toString(), 18);
            const amountOutBigInt = parseUnits(amountOut.toString(), 18);

            // Check if we're using native token as input
            const isNativeInput = isNativeToken(inputToken);

            // For ERC20 tokens, check and approve if needed
            if (!isNativeInput) {
                try {
                    toast.info('Checking token approvals...');

                    let allowance;
                    try {
                        console.log(`Calling allowance on token: ${inputToken}`);
                        allowance = await readContract(wagmiConfig, {
                            address: inputToken,
                            abi: erc20Abi,
                            functionName: 'allowance',
                            args: [address, localRouterAddress],
                        });
                        console.log('Current allowance:', allowance);
                    } catch (allowanceError) {
                        console.warn('Failed to read allowance, attempting to approve anyway:', allowanceError);
                        allowance = BigInt(0);
                        toast.warning('Unable to check current allowance. Will attempt to approve tokens anyway.');
                    }

                    if (BigInt(allowance) < amountInBigInt) {
                        toast.info('Approving tokens...');

                        // Add retry logic for approvals
                        let approvalSuccess = false;
                        let approvalAttempts = 0;
                        const maxApprovalAttempts = 2;

                        while (!approvalSuccess && approvalAttempts < maxApprovalAttempts) {
                            try {
                                approvalAttempts++;

                                const approvalHash = await writeContract(wagmiConfig, {
                                    account: address,
                                    address: inputToken,
                                    abi: erc20Abi,
                                    functionName: 'approve',
                                    args: [localRouterAddress, amountInBigInt],
                                });

                                toast.info('Waiting for approval confirmation...');
                                await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash });
                                toast.success('Token approval confirmed');
                                approvalSuccess = true;
                            } catch (approvalError) {
                                console.error(`Token approval attempt ${approvalAttempts} failed:`, approvalError);

                                if (approvalAttempts >= maxApprovalAttempts) {
                                    const errorMessage = getReadableErrorMessage(approvalError);
                                    toast.error(`Token approval failed: ${errorMessage}`);
                                    throw new Error(`Token approval failed: ${errorMessage}`);
                                } else {
                                    toast.warning(`Approval attempt failed, retrying...`);
                                }
                            }
                        }
                    } else {
                        console.log('Sufficient allowance already exists');
                    }
                } catch (approvalError) {
                    console.error('Token approval error:', approvalError);
                    const errorMessage = getReadableErrorMessage(approvalError);
                    toast.error(`Token approval failed: ${errorMessage}`);
                    throw new Error(`Token approval failed: ${errorMessage}`);
                }
            }

            // Get the next nonce directly from the contract
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

            // Create the order data structure matching the OrderData structure in the contract
            const orderData = {
                sender: addressToBytes32(sender),
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
                action,
                nonce: BigInt(nonce),
                data: '0x' as HexAddress
            };

            console.log('Order data structure:', orderData);

            // Encode the order data using OrderEncoder
            const encodedOrderData = OrderEncoder.encode(orderData);

            // Create the onchain order structure matching the OnchainCrossChainOrder contract struct
            const onchainOrder = {
                fillDeadline,
                orderDataType: OrderEncoder.orderDataType(),
                orderData: encodedOrderData
            };

            // Calculate order ID for tracking (this should match the contract's calculation)
            const calculatedOrderId = calculateOrderId(sender, originDomain, nonce);

            // Calculate gas payment for cross-chain message
            let gasPayment: bigint;
            try {
                // Try to use the estimateGasPayment from CrossChainProvider
                const gasEstimate = await estimateGasPayment(
                    'current', // current network
                    'remote' // destination network
                );
                gasPayment = parseUnits(gasEstimate, 18);
            } catch (gasError) {
                console.warn('⚠️ estimateGasPayment failed. Trying contract method.', gasError);

                try {
                    gasPayment = await readContract(wagmiConfig, {
                        address: localRouterAddress,
                        abi: HyperlaneABI,
                        functionName: 'quoteGasPayment',
                        args: [destinationDomain],
                    }) as bigint;
                } catch (contractGasError) {
                    console.warn('⚠️ quoteGasPayment failed. Trying destinationGas.', contractGasError);

                    try {
                        gasPayment = await readContract(wagmiConfig, {
                            address: localRouterAddress,
                            abi: HyperlaneABI,
                            functionName: 'destinationGas',
                            args: [destinationDomain],
                        }) as bigint;
                    } catch (destinationGasError) {
                        console.warn('⚠️ All gas estimation methods failed. Using hardcoded fallback.', destinationGasError);
                        gasPayment = parseUnits('0.0005', 18);
                    }
                }
            }

            console.log('Gas payment:', formatUnits(gasPayment, 18));

            // Submit the transaction using the appropriate method based on token type
            let txHash: HexAddress;
            try {
                if (isNativeInput) {
                    // If using native token, send with value
                    console.log('Sending transaction with native token');
                    txHash = await writeContract(wagmiConfig, {
                        account: address,
                        address: localRouterAddress,
                        abi: HyperlaneABI,
                        functionName: 'open',
                        args: [onchainOrder],
                        value: amountInBigInt + gasPayment // Send both the token amount and gas payment
                    }) as HexAddress;
                } else {
                    // If using ERC20, just send gas payment
                    console.log('Sending transaction with ERC20 token');
                    txHash = await writeContract(wagmiConfig, {
                        account: address,
                        address: localRouterAddress,
                        abi: HyperlaneABI,
                        functionName: 'open',
                        args: [onchainOrder],
                        value: gasPayment // Only send gas payment
                    }) as HexAddress;
                }
            } catch (txError) {
                // Handle transaction errors with better messages
                const errorMessage = getReadableErrorMessage(txError);
                toast.error(`Transaction failed: ${errorMessage}`);
                throw new Error(`Transaction failed: ${errorMessage}`);
            }

            setTxHash(txHash);
            setOrderId(calculatedOrderId);
            toast.info('Transaction submitted, awaiting confirmation...');

            // Wait for transaction confirmation with timeout
            try {
                const receiptPromise = waitForTransactionReceipt(wagmiConfig, { hash: txHash });

                // Create a timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000); // 60 second timeout
                });

                // Race the receipt promise against the timeout
                const receipt = await Promise.race([receiptPromise, timeoutPromise]);

                if (receipt.status === 'success') {
                    toast.success('Cross-chain order created successfully!');
                    return {
                        success: true,
                        txHash,
                        orderId: calculatedOrderId
                    };
                } else {
                    toast.error('Transaction failed on-chain');
                    const error = new Error('Transaction failed on-chain');
                    setError(error);
                    return { success: false, error };
                }
            } catch (error: unknown) {
                // Type guard for error
                const confirmError = error as Error;

                // Provide specific handling for confirmation timeout
                if (confirmError.message === 'Transaction confirmation timeout') {
                    toast.warning('Transaction submitted but confirmation is taking longer than expected. You can check the status later with your transaction hash.');
                    return {
                        success: true,
                        txHash,
                        error: new Error('Transaction confirmation timeout'),
                        orderId: calculatedOrderId
                    };
                }

                // Other confirmation errors
                const errorMessage = getReadableErrorMessage(confirmError);
                toast.error(`Transaction confirmation failed: ${errorMessage}`);
                setError(new Error(errorMessage));
                return { success: false, txHash, error: new Error(errorMessage) };
            }
        } catch (err) {
            console.error('Error creating cross-chain order:', err);

            // Format error message for user
            const errorObj = err instanceof Error ? err : new Error('Order creation failed');
            setError(errorObj);
            toast.error(errorObj.message);
            return { success: false, error: errorObj };
        } finally {
            setIsProcessing(false);
        }
    }, [
        address,
        localRouterAddress,
        getLocalDomain,
        remoteDomain,
        estimateGasPayment,
        calculateOrderId
    ]);

    // Function to settle an order
    const settleOrder = useCallback(async (orderId: string): Promise<OrderResult> => {
        if (!address) {
            toast.error('Wallet not connected');
            return { success: false, error: new Error('Wallet not connected') };
        }

        try {
            setIsProcessing(true);
            setError(null);

            // Call the settle function with the order ID
            const txHash = await writeContract(wagmiConfig, {
                account: address,
                address: localRouterAddress,
                abi: HyperlaneABI,
                functionName: 'settle',
                args: [[orderId]], // Takes array of order IDs
            }) as HexAddress;

            setTxHash(txHash);
            toast.info('Settlement transaction submitted, awaiting confirmation...');

            // Wait for confirmation
            const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            if (receipt.status === 'success') {
                toast.success('Order settled successfully!');
                return { success: true, txHash };
            } else {
                toast.error('Settlement failed');
                const error = new Error('Settlement transaction failed');
                setError(error);
                return { success: false, error };
            }
        } catch (err) {
            console.error('Error settling order:', err);
            const errorObj = err instanceof Error ? err : new Error('Settlement failed');
            const errorMessage = getReadableErrorMessage(errorObj);

            setError(errorObj);
            toast.error(`Settlement failed: ${errorMessage}`);
            return { success: false, error: errorObj };
        } finally {
            setIsProcessing(false);
        }
    }, [address, localRouterAddress]);

    // Function to refund an order
    const refundOrder = useCallback(async (order: any): Promise<OrderResult> => {
        if (!address) {
            toast.error('Wallet not connected');
            return { success: false, error: new Error('Wallet not connected') };
        }

        try {
            setIsProcessing(true);
            setError(null);

            // Call the refund function with the order
            const txHash = await writeContract(wagmiConfig, {
                account: address,
                address: localRouterAddress,
                abi: HyperlaneABI,
                functionName: 'refund',
                args: [[order]], // Takes array of OnchainCrossChainOrder
            }) as HexAddress;

            setTxHash(txHash);
            toast.info('Refund transaction submitted, awaiting confirmation...');

            // Wait for confirmation
            const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            if (receipt.status === 'success') {
                toast.success('Order refunded successfully!');
                return { success: true, txHash };
            } else {
                toast.error('Refund failed');
                const error = new Error('Refund transaction failed');
                setError(error);
                return { success: false, error };
            }
        } catch (err) {
            console.error('Error refunding order:', err);
            const errorObj = err instanceof Error ? err : new Error('Refund failed');
            const errorMessage = getReadableErrorMessage(errorObj);

            setError(errorObj);
            toast.error(`Refund failed: ${errorMessage}`);
            return { success: false, error: errorObj };
        } finally {
            setIsProcessing(false);
        }
    }, [address, localRouterAddress]);

    return {
        createOrder,
        settleOrder,
        refundOrder,
        getOrderStatus,
        getLocalDomain,
        txHash,
        orderId,
        isProcessing,
        error,
    };
};

export default useCrossChainOrderPharos;