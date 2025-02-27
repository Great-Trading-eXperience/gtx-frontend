import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract, useReadContract } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { encodeFunctionData, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

// Import required ABIs
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
// import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import PoolManagerABI from '@/abis/gtx/clob-dex/PoolManagerABI';

// Types
import { HexAddress } from '@/types/web3/general/address';
import { useOrderBookAPI } from '../orderbook/useOrderbook';
import { useCancelOrder } from '../orderbook/useCencelOrder';
import { useTradingBalances } from './useTradingBalances';

// Define order types
export type Side = 0 | 1; // 0 = BUY (BID), 1 = SELL (ASK)
export type Status = 0 | 1 | 2 | 3; // 0 = OPEN, 1 = FILLED, 2 = CANCELLED, 3 = EXPIRED
export type PoolKey = {
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
};

export type OrderStep = {
    name: string;
    description: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
};

export type OrderParams = {
    poolKey: PoolKey;
    price: bigint;
    quantity: bigint;
    side: Side;
    isMarketOrder?: boolean;
    withDeposit?: boolean;
    orderBookAddress?: HexAddress;
};

/**
 * Unified hook for placing orders with integrated deposit functionality
 */
export const useUnifiedOrderPlacement = (
    routerAddress: HexAddress,
    balanceManagerAddress: HexAddress
) => {
    const { address } = useAccount();
    const [currentOrderParams, setCurrentOrderParams] = useState<OrderParams | null>(null);
    const [currentTxHash, setCurrentTxHash] = useState<HexAddress | null>(null);
    const [needsDeposit, setNeedsDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState<bigint | null>(null);
    const [depositCurrency, setDepositCurrency] = useState<HexAddress | null>(null);

    // Track order placement steps
    const [steps, setSteps] = useState<OrderStep[]>([
        { name: 'Check Balance', description: 'Checking your balance', status: 'idle' },
        { name: 'Approve Tokens', description: 'Approving tokens for transfer', status: 'idle' },
        { name: 'Deposit Funds', description: 'Depositing funds', status: 'idle' },
        { name: 'Simulate Order', description: 'Simulating order', status: 'idle' },
        { name: 'Place Order', description: 'Placing order on-chain', status: 'idle' }
    ]);

    // Update a specific step by name
    const updateStep = useCallback((name: string, update: Partial<OrderStep>) => {
        setSteps(prev =>
            prev.map(step =>
                step.name === name ? { ...step, ...update } : step
            )
        );
    }, []);

    // Reset all steps to idle
    const resetSteps = useCallback(() => {
        setSteps(prev =>
            prev.map(step => ({ ...step, status: 'idle', error: undefined }))
        );
    }, []);

    // Transaction confirmation hook
    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed
    } = useWaitForTransactionReceipt({
        hash: currentTxHash || undefined,
    });

    // Effect to reset when transaction is confirmed
    useEffect(() => {
        if (isConfirmed) {
            toast.success('Transaction confirmed successfully!');
            setCurrentOrderParams(null);
            setCurrentTxHash(null);
            setNeedsDeposit(false);
            setDepositAmount(null);
            setDepositCurrency(null);
        }
    }, [isConfirmed]);

    // Calculate required deposit for an order
    const calculateRequiredDeposit = useCallback(async (
        poolKey: PoolKey,
        price: bigint,
        quantity: bigint,
        side: Side
    ): Promise<{ currency: HexAddress, amount: bigint }> => {
        // For BUY orders: Need quote currency (USDC) = price * quantity
        // For SELL orders: Need base currency (ETH) = quantity
        const currency = side === 0 ? poolKey.quoteCurrency : poolKey.baseCurrency;
        const amount = side === 0 ? price * quantity : quantity;

        return { currency, amount };
    }, []);

    // Check if user has sufficient balance
    const checkBalance = useCallback(async (
        currency: HexAddress,
        requiredAmount: bigint
    ): Promise<boolean> => {
        if (!address) return false;

        updateStep('Check Balance', { status: 'loading' });

        try {
            // First check ERC20 balance
            const tokenBalance = await readContract(wagmiConfig, {
                address: currency,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address as HexAddress],
            });

            // Also check balance manager balance
            const managerBalance = await readContract(wagmiConfig, {
                address: balanceManagerAddress,
                abi: BalanceManagerABI,
                functionName: 'getBalance',
                args: [address as HexAddress, currency],
            });

            const totalBalance = tokenBalance + managerBalance;
            const hasEnoughBalance = totalBalance >= requiredAmount;

            updateStep('Check Balance', {
                status: hasEnoughBalance ? 'success' : 'error',
                error: hasEnoughBalance ? undefined : 'Insufficient balance'
            });

            return hasEnoughBalance;
        } catch (error) {
            console.error('Error checking balance:', error);
            updateStep('Check Balance', {
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to check balance'
            });
            return false;
        }
    }, [address, balanceManagerAddress, updateStep]);

    // Handle the approval and deposit process
    const handleDeposit = useCallback(async (
        currency: HexAddress,
        amount: bigint
    ): Promise<boolean> => {
        if (!address) {
            toast.error('Wallet not connected');
            return false;
        }

        try {
            // Check if approval is needed
            updateStep('Approve Tokens', { status: 'loading' });

            const allowance = await readContract(wagmiConfig, {
                address: currency,
                abi: erc20Abi,
                functionName: 'allowance',
                args: [address as HexAddress, balanceManagerAddress],
            });

            if (allowance < amount) {
                // Need to approve tokens
                const approveData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [balanceManagerAddress, amount],
                });

                toast.info('Approving tokens...');
                const approveHash = await writeContract(wagmiConfig, {
                    account: address,
                    address: currency,
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [balanceManagerAddress, amount],
                });

                const approveReceipt = await waitForTransactionReceipt(wagmiConfig, {
                    hash: approveHash,
                });

                if (approveReceipt.status !== 'success') {
                    updateStep('Approve Tokens', {
                        status: 'error',
                        error: 'Token approval failed'
                    });
                    toast.error('Token approval failed');
                    return false;
                }
            }

            updateStep('Approve Tokens', { status: 'success' });

            // Now deposit the tokens
            updateStep('Deposit Funds', { status: 'loading' });
            toast.info('Depositing funds...');

            const depositHash = await writeContract(wagmiConfig, {
                account: address,
                address: balanceManagerAddress,
                abi: BalanceManagerABI,
                functionName: 'deposit',
                args: [currency, amount],
            });

            const depositReceipt = await waitForTransactionReceipt(wagmiConfig, {
                hash: depositHash,
            });

            if (depositReceipt.status !== 'success') {
                updateStep('Deposit Funds', {
                    status: 'error',
                    error: 'Deposit failed'
                });
                toast.error('Deposit failed');
                return false;
            }

            updateStep('Deposit Funds', { status: 'success' });
            toast.success('Funds deposited successfully');
            return true;
        } catch (error) {
            console.error('Deposit error:', error);

            // Update the step that was in progress
            const currentStep = steps.find(step => step.status === 'loading');
            if (currentStep) {
                updateStep(currentStep.name, {
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Transaction failed'
                });
            }

            toast.error(error instanceof Error ? error.message : 'Failed to deposit. Please try again.');
            return false;
        }
    }, [address, balanceManagerAddress, steps, updateStep]);

    // Simulate and execute the order
    const executeOrder = useCallback(async (params: OrderParams): Promise<boolean> => {
        if (!address) {
            toast.error('Wallet not connected');
            return false;
        }

        try {
            // Skip simulation since these are write functions
            updateStep('Simulate Order', { status: 'success' });

            // Determine which function to call based on order type
            const functionName = params.isMarketOrder
                ? (params.withDeposit ? 'placeMarketOrderWithDeposit' : 'placeMarketOrder')
                : (params.withDeposit ? 'placeOrderWithDeposit' : 'placeOrder');

            // Now place the order
            updateStep('Place Order', { status: 'loading' });
            toast.info('Placing order...');

            // We need to type our args properly based on the function
            let orderHash: `0x${string}`;

            if (params.isMarketOrder && !params.withDeposit) {
                orderHash = await writeContract(wagmiConfig, {
                    account: address,
                    address: routerAddress,
                    abi: GTXRouterABI,
                    functionName: 'placeMarketOrder',
                    args: [params.poolKey, params.quantity, params.side],
                });
            } else if (params.isMarketOrder && params.withDeposit) {
                orderHash = await writeContract(wagmiConfig, {
                    account: address,
                    address: routerAddress,
                    abi: GTXRouterABI,
                    functionName: 'placeMarketOrderWithDeposit',
                    args: [params.poolKey, params.price, params.quantity, params.side],
                });
            } else if (!params.isMarketOrder && params.withDeposit) {
                orderHash = await writeContract(wagmiConfig, {
                    account: address,
                    address: routerAddress,
                    abi: GTXRouterABI,
                    functionName: 'placeOrderWithDeposit',
                    args: [params.poolKey, params.price, params.quantity, params.side],
                });
            } else {
                orderHash = await writeContract(wagmiConfig, {
                    account: address,
                    address: routerAddress,
                    abi: GTXRouterABI,
                    functionName: 'placeOrder',
                    args: [params.poolKey, params.price, params.quantity, params.side],
                });
            }

            // Store the hash for transaction tracking
            setCurrentTxHash(orderHash);

            updateStep('Place Order', { status: 'success' });
            toast.success(`${params.isMarketOrder ? 'Market' : 'Limit'} order placed successfully!`);
            return true;
        } catch (error) {
            console.error('Order execution error:', error);

            // Update the step that was in progress
            const currentStep = steps.find(step => step.status === 'loading');
            if (currentStep) {
                updateStep(currentStep.name, {
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Transaction failed'
                });
            }

            toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
            return false;
        }
    }, [address, routerAddress, steps, updateStep]);

    // Add this validation function
    const validateOrderParams = useCallback(async (
        poolKey: PoolKey,
        price: bigint,
        quantity: bigint,
        side: Side
    ): Promise<boolean> => {
        try {
            // Get pool information using PoolManager
            const pool = await readContract(wagmiConfig, {
                address: routerAddress,
                abi: GTXRouterABI,
                functionName: 'poolManager',
            });

            const poolInfo = await readContract(wagmiConfig, {
                address: pool as HexAddress,
                abi: PoolManagerABI, // You'll need to import this
                functionName: 'getPool',
                args: [poolKey],
            });

            // Check against lotSize
            if (quantity % poolInfo.lotSize !== BigInt(0)) {
                toast.error(`Quantity must be a multiple of the lot size`);
                return false;
            }

            // Check against maxOrderAmount
            if (quantity > poolInfo.maxOrderAmount) {
                toast.error(`Quantity exceeds maximum order size`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Order validation error:', error);
            toast.error('Could not validate order parameters');
            return false;
        }
    }, [routerAddress]);

    // Main function to place an order with all the necessary checks
    const placeOrder = useCallback(async (params: OrderParams): Promise<void> => {
        if (!address) {
            toast.error('Wallet not connected');
            return;
        }

        try {
            // First, validate the order parameters
            const isValid = await validateOrderParams(
                params.poolKey,
                params.price,
                params.quantity,
                params.side
            );

            if (!isValid) return;

            // Store the current params
            setCurrentOrderParams(params);

            // Reset all steps to idle
            resetSteps();

            // Calculate required deposit
            const { currency, amount } = await calculateRequiredDeposit(
                params.poolKey,
                params.price,
                params.quantity,
                params.side
            );

            setDepositCurrency(currency);
            setDepositAmount(amount);

            // Check balance in BalanceManager
            const hasBalance = await readContract(wagmiConfig, {
                address: balanceManagerAddress,
                abi: BalanceManagerABI,
                functionName: 'getBalance',
                args: [address as HexAddress, currency],
            });

            // If insufficient balance in BalanceManager, check wallet balance and deposit if needed
            if (hasBalance < amount) {
                setNeedsDeposit(true);

                const hasSufficientBalance = await checkBalance(currency, amount);
                if (!hasSufficientBalance) {
                    toast.error('Insufficient balance to place this order');
                    return;
                }

                // Deposit funds if balance check passes
                const depositSuccess = await handleDeposit(currency, amount);
                if (!depositSuccess) {
                    return;
                }
            } else {
                // Skip the approval and deposit steps if already has balance
                updateStep('Check Balance', { status: 'success' });
                updateStep('Approve Tokens', { status: 'success' });
                updateStep('Deposit Funds', { status: 'success' });
            }

            // Finally, execute the order
            await executeOrder(params);

        } catch (error) {
            console.error('Order placement error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
        }
    }, [
        address,
        validateOrderParams,
        balanceManagerAddress,
        calculateRequiredDeposit,
        checkBalance,
        executeOrder,
        handleDeposit,
        resetSteps
    ]);

    // Function to place a limit order
    const placeLimitOrder = useCallback((
        poolKey: PoolKey,
        price: bigint,
        quantity: bigint,
        side: Side,
        withDeposit: boolean = true
    ) => {
        placeOrder({
            poolKey,
            price,
            quantity,
            side,
            isMarketOrder: false,
            withDeposit
        });
    }, [placeOrder]);

    // Function to place a market order
    const placeMarketOrder = useCallback((
        poolKey: PoolKey,
        quantity: bigint,
        side: Side,
        price?: bigint, // Optional price for market orders with deposit
        withDeposit: boolean = true
    ) => {
        placeOrder({
            poolKey,
            price: price || BigInt(0),
            quantity,
            side,
            isMarketOrder: true,
            withDeposit
        });
    }, [placeOrder]);

    return {
        // Main functions
        placeLimitOrder,
        placeMarketOrder,

        // State
        steps,
        currentOrderParams,
        currentTxHash,
        isConfirming,
        isConfirmed,
        needsDeposit,
        depositAmount,
        depositCurrency,

        // Utils
        resetSteps
    };
};

/**
 * Hook that combines everything for a complete trading experience
 */
export const useGTXTrading = (
    routerAddress: HexAddress,
    balanceManagerAddress: HexAddress,
    orderBookAddress: HexAddress
) => {
    // Combine all the hooks
    const orderPlacement = useUnifiedOrderPlacement(routerAddress, balanceManagerAddress);
    const balances = useTradingBalances(balanceManagerAddress);
    const orderBookAPI = useOrderBookAPI(orderBookAddress);
    const cancelOrder = useCancelOrder();

    return {
        // Order placement
        placeLimitOrder: orderPlacement.placeLimitOrder,
        placeMarketOrder: orderPlacement.placeMarketOrder,
        orderSteps: orderPlacement.steps,
        isOrderConfirming: orderPlacement.isConfirming,
        isOrderConfirmed: orderPlacement.isConfirmed,
        orderTxHash: orderPlacement.currentTxHash,

        // Balance management
        getBalance: balances.getManagerBalance,
        getLockedBalance: balances.getLockedBalance,
        getWalletBalance: balances.getWalletBalance,
        getTotalBalance: balances.getTotalAvailableBalance,
        deposit: balances.deposit,
        withdraw: balances.withdraw,
        isBalanceLoading: balances.loading,
        balanceError: balances.error,

        // Order book data
        bestBid: orderBookAPI.bestPriceBuy,
        bestAsk: orderBookAPI.bestPriceSell,
        isOrderBookLoading: orderBookAPI.isLoadingBestPrices,
        getNextBestPrices: orderBookAPI.getNextBestPrices,
        getUserActiveOrders: orderBookAPI.getUserActiveOrders,
        getOrderQueue: orderBookAPI.getOrderQueue,
        refreshOrderBook: orderBookAPI.refreshOrderBook,
        orderBookError: orderBookAPI.error,

        // Cancel order
        cancelOrder: cancelOrder.handleCancelOrder,
        isCancelPending: cancelOrder.isCancelOrderPending,
        isCancelConfirming: cancelOrder.isCancelOrderConfirming,
        isCancelConfirmed: cancelOrder.isCancelOrderConfirmed,
        cancelTxHash: cancelOrder.cancelOrderHash
    };
};