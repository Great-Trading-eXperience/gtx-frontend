import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract
} from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { erc20Abi } from 'viem';

interface UseWithdrawOptions {
  tokenAddress: Address;
  fromAddress?: Address; // Source address (embedded wallet), defaults to connected wallet
  toAddress: Address; // Destination address (where tokens will be sent)
}

interface WithdrawState {
  isLoading: boolean; // Overall loading for the entire process
  currentStep: 'idle' | 'checking_balance' | 'awaiting_transfer_tx' | 'transfer_success' | 'error';
  error: string | null;
  txHash: string | null; // Transaction hash for the transfer
}

export const useWithdraw = ({
  tokenAddress,
  fromAddress,
  toAddress
}: UseWithdrawOptions) => {
  const { address: connectedAddress } = useAccount();
  
  // The effective sender is fromAddress if provided, otherwise connected wallet
  const effectiveSender = fromAddress || connectedAddress;

  const [state, setState] = useState<WithdrawState>({
    isLoading: false,
    currentStep: 'idle',
    error: null,
    txHash: null,
  });

  // Contract write hook for transfer
  const { writeContract: writeTransfer, data: transferHash } = useWriteContract();

  // Transaction receipt hook for monitoring transfer status
  const { 
    isLoading: isTransferTxLoading, 
    isSuccess: isTransferTxSuccess, 
    isError: isTransferTxError 
  } = useWaitForTransactionReceipt({
    hash: transferHash,
    query: { enabled: !!transferHash } // Only enable when there's a hash to wait for
  });

  // Read token balance of the sender (embedded wallet or connected wallet)
  const { data: balance, refetch: refetchBalance, isLoading: isBalanceLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: effectiveSender ? [effectiveSender] : undefined,
    query: {
      enabled: !!effectiveSender,
    },
  });

  // Read token decimals
  const { data: tokenDecimals, isLoading: isDecimalsLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  });

  // Read token symbol
  const { data: tokenSymbol, isLoading: isSymbolLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  // Consolidated loading state for read operations
  const isReadingData = isBalanceLoading || isDecimalsLoading || isSymbolLoading;

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      currentStep: 'idle',
      error: null,
      txHash: null,
    });
  }, []);

  // Main function to execute the withdraw (transfer) flow
  const executeWithdraw = useCallback(async (amount: string) => {
    if (!effectiveSender) {
      setState(prev => ({ ...prev, error: 'Sender wallet not determined', isLoading: false }));
      return;
    }
    if (!connectedAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected', isLoading: false }));
      return;
    }
    if (!tokenDecimals) {
      setState(prev => ({ ...prev, error: 'Token decimals not loaded', isLoading: false }));
      return;
    }

    console.log(connectedAddress !== fromAddress);

    // Check if connected wallet can send transactions for the effective sender
    if (fromAddress && connectedAddress !== fromAddress) {
      setState(prev => ({ 
        ...prev, 
        error: `Please connect with the sender wallet (${fromAddress}) to execute the transfer.`,
        isLoading: false 
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        currentStep: 'checking_balance',
        error: null,
        txHash: null,
      }));

      const amountBigInt = parseUnits(amount, tokenDecimals);

      // 1. Refetch current balance to get the very latest value
      const { data: currentBalance } = await refetchBalance();
      const balanceBigInt = currentBalance || 0n;

      // 2. Check if sender wallet has sufficient balance
      if (balanceBigInt < amountBigInt) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentStep: 'error',
          error: `Insufficient token balance in sender wallet (${effectiveSender}). Available: ${formatUnits(balanceBigInt, tokenDecimals)} ${tokenSymbol || 'tokens'}, Required: ${formatUnits(amountBigInt, tokenDecimals)} ${tokenSymbol || 'tokens'}.`
        }));
        return;
      }

      // 3. Proceed with transfer - NO APPROVAL NEEDED for transfer()
      setState(prev => ({
        ...prev,
        currentStep: 'awaiting_transfer_tx',
        isLoading: true,
      }));

      await writeTransfer({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress, amountBigInt],
      });

      // Note: Success state will be set by the useEffect watching transferHash

    } catch (error: any) {
      console.error('Withdraw execution error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentStep: 'error',
        error: error.message || 'Transfer failed'
      }));
    }
  }, [
    effectiveSender,
    connectedAddress,
    fromAddress,
    tokenDecimals,
    toAddress,
    tokenAddress,
    refetchBalance,
    writeTransfer,
    tokenSymbol
  ]);

  // Effect to handle transfer transaction results
  useEffect(() => {
    if (isTransferTxSuccess && transferHash) {
      setState(prev => ({
        ...prev,
        currentStep: 'transfer_success',
        isLoading: false,
        txHash: transferHash,
        error: null,
      }));
      console.log('Transfer successful, hash:', transferHash);
    } else if (isTransferTxError && transferHash) {
      // Handle transfer transaction failure
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentStep: 'error',
        error: 'Transfer transaction failed or was rejected.',
        txHash: transferHash,
      }));
    }
  }, [isTransferTxSuccess, transferHash, isTransferTxError]);

  // Utility functions
  const getFormattedBalance = useCallback(() => {
    if (balance === undefined || tokenDecimals === undefined) return '0';
    return formatUnits(balance, tokenDecimals);
  }, [balance, tokenDecimals]);

  const hasEnoughBalance = useCallback((amount: string) => {
    if (balance === undefined || tokenDecimals === undefined) return false;
    try {
      const amountBigInt = parseUnits(amount, tokenDecimals);
      return balance >= amountBigInt;
    } catch {
      return false; // Invalid amount string
    }
  }, [balance, tokenDecimals]);

  // Calculate maximum withdrawable amount (current balance)
  const getMaxWithdrawAmount = useCallback(() => {
    return getFormattedBalance();
  }, [getFormattedBalance]);

  // Validate withdraw amount
  const validateAmount = useCallback((amount: string) => {
    if (!amount || amount === '0') {
      return 'Amount must be greater than 0';
    }
    if (!hasEnoughBalance(amount)) {
      return 'Insufficient balance';
    }
    try {
      parseUnits(amount, tokenDecimals || 18);
      return null; // Valid
    } catch {
      return 'Invalid amount format';
    }
  }, [hasEnoughBalance, tokenDecimals]);

  return {
    // State
    ...state,
    
    // Provide a consolidated loading state for UI
    isTransactionLoading: isTransferTxLoading, // True when blockchain TX is pending
    isReadingData, // True when read contracts are fetching data

    // Actions
    withdraw: executeWithdraw,
    resetState,

    // Data
    balance: getFormattedBalance(),
    rawBalance: balance,
    tokenDecimals,
    tokenSymbol: tokenSymbol || 'TOKEN',
    maxWithdrawAmount: getMaxWithdrawAmount(),

    // Addresses
    fromAddress: effectiveSender, // The effective sender (embedded wallet or connected wallet)
    toAddress,
    connectedAddress,
    embeddedWalletAddress: fromAddress, // Explicitly show the embedded wallet address if provided

    // Utilities
    hasEnoughBalance,
    validateAmount,
  };
};