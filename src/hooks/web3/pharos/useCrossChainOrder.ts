// useCrossChainOrder.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, readContract, getBytecode } from '@wagmi/core';
import { parseUnits, formatUnits, erc20Abi, keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

import HyperlaneABI from '@/abis/pharos/HyperlaneABI';
import type { HexAddress } from '@/types/general/address';
import OrderEncoder from '@/types/espresso/OrderEncoder';
import { useCrossChain } from './useCrossChain';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import type { Token } from '@/components/pharos/swap/token-network-selector';

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
    targetInputToken?: HexAddress;
    targetOutputToken?: HexAddress;
    amountIn: string | number;
    amountOut: string | number;
    destinationDomain?: number;
    targetDomain?: number;
    destinationRouter: HexAddress;
    action?: number; // Changed from orderAction to action
    fillDeadline?: number;
};

// Helper function to convert address to bytes32
export const addressToBytes32 = (addr: HexAddress): `0x${string}` => {
    if (!addr || typeof addr !== 'string' || !addr.startsWith('0x')) {
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    return `0x${addr.slice(2).padStart(64, '0')}` as `0x${string}`;
};

// Helper to check if address is native token (address(0) in Solidity)
export const isNativeToken = (addr: HexAddress): boolean => {
    return addr === '0x0000000000000000000000000000000000000000';
};

// Helper function to extract readable error messages from blockchain errors
function getReadableErrorMessage(error: any): string {
    if (!error) return 'Unknown error';

    // Check for RPC URL errors
    if (error.message && error.message.includes('HTTP request failed')) {
        // Extract the URL from the error message
        const urlMatch = error.message.match(/URL: ([^\s]+)/);
        const url = urlMatch ? urlMatch[1] : 'unknown RPC endpoint';

        return `Network connection issue with ${url}. Please check your network connection or try again later.`;
    }

    // Check for user rejection
    if (error.message && error.message.includes('user rejected transaction')) {
        return 'Transaction was rejected in your wallet.';
    }

    // Check for contract errors
    if (error.message && error.message.includes('execution reverted')) {
        return 'Contract error: Transaction would fail on chain. Please check your inputs.';
    }

    // Check for gas errors
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

export const useCrossChainOrder = (
    localRouterAddress: HexAddress,
) => {
    const { address } = useAccount();
    const {
        currentNetwork,
        currentDomain,
        remoteDomain,
        estimateGasPayment
    } = useCrossChain();

    const [txHash, setTxHash] = useState<HexAddress | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getLocalDomain = useCallback(async (): Promise<number> => {
        // First use the domain from CrossChainProvider if available
        if (currentDomain) {
            return currentDomain;
        }

        // Otherwise read from contract directly
        try {
            const localDomain = await readContract(wagmiConfig, {
                address: localRouterAddress,
                abi: HyperlaneABI,
                functionName: 'localDomain',
            });
            return Number(localDomain);
        } catch (err) {
            console.warn('Failed to read localDomain, using fallback:', err);
            // Get domain based on network name or chain ID
            const chainId = currentNetwork === 'arbitrum-sepolia' ? 421614 : 1020201;
            return chainId;
        }
    }, [localRouterAddress, currentDomain, currentNetwork]);

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
            let status;
            try {
                status = await readContract(wagmiConfig, {
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
            destinationDomain = remoteDomain || parseInt(process.env.NEXT_PUBLIC_DESTINATION_DOMAIN || '421614'),
            targetDomain = parseInt(process.env.NEXT_PUBLIC_TARGET_DOMAIN || '1020201'),
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

            // Handle target domain and token logic similar to the smart contract
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
                        // If we can't read allowance, we'll try to approve anyway
                        allowance = BigInt(0);

                        // Show a more user-friendly error message
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
                                    // If we've tried the maximum number of times, show error and throw
                                    const errorMessage = getReadableErrorMessage(approvalError);
                                    toast.error(`Token approval failed: ${errorMessage}`);
                                    throw new Error(`Token approval failed: ${errorMessage}`);
                                } else {
                                    // Otherwise, retry
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

            // Get the next nonce directly from the contract like in the Solidity script
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

            // Create the order data structure
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
                data: '0x' as `0x${string}`
            };

            console.log('Order data structure:', orderData);

            // Encode the order data
            const encodedOrderData = OrderEncoder.encode(orderData);

            // Create the onchain order structure
            const onchainOrder = {
                fillDeadline,
                orderDataType: OrderEncoder.orderDataType(),
                orderData: encodedOrderData
            };

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
                    console.warn('⚠️ quoteGasPayment failed. Using hardcoded fallback.', contractGasError);
                    gasPayment = parseUnits('0.0005', 18);
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
            toast.info('Transaction submitted, awaiting confirmation...');

            // Wait for transaction confirmation with timeout
            try {
                const receiptPromise = waitForTransactionReceipt(wagmiConfig, { hash: txHash });

                // Create a timeout promise with proper typing
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000); // 60 second timeout
                });

                // Race the receipt promise against the timeout with proper typing
                const receipt = await Promise.race([receiptPromise, timeoutPromise]);

                if (receipt.status === 'success') {
                    toast.success('Cross-chain order created successfully!');
                    return { success: true, txHash };
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
                    return { success: true, txHash, error: new Error('Transaction confirmation timeout') };
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

            // Try to extract more specific error information
            if (typeof err === 'object' && err !== null) {
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
    }, [address, localRouterAddress, getLocalDomain, remoteDomain, estimateGasPayment]);

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