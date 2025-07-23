import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract
} from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { erc20Abi } from 'viem';

interface UseTransferFromOptions {
  tokenAddress: Address;
  fromAddress: Address; // External wallet address (token owner)
  toAddress: Address;   // Privy wallet address (receiver)
  spenderAddress?: Address; // Address that will execute transferFrom (defaults to connected wallet)
}

interface TransferFromState {
  isLoading: boolean; // Overall loading for the entire process
  currentStep: 'idle' | 'checking_allowance' | 'awaiting_approval_tx' | 'approving_success' | 'awaiting_transfer_tx' | 'transferring_success' | 'error';
  error: string | null;
  txHash: string | null; // Latest transaction hash (either approve or transferFrom)
  needsApproval: boolean;
  pendingAmountForTransfer: string | null; // Stores amount if approval is needed before transfer
}

export const useTransferFrom = ({
  tokenAddress,
  fromAddress,
  toAddress,
  spenderAddress
}: UseTransferFromOptions) => {
  const { address: connectedAddress } = useAccount();
  // The 'effectiveSpender' is the address that will call transferFrom.
  // By default, it's the connected wallet.
  const effectiveSpender = spenderAddress || connectedAddress;

  const [state, setState] = useState<TransferFromState>({
    isLoading: false,
    currentStep: 'idle',
    error: null,
    txHash: null,
    needsApproval: false,
    pendingAmountForTransfer: null,
  });

  // Contract write hooks for approve and transferFrom
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeTransferFrom, data: transferHash } = useWriteContract();

  // Transaction receipt hooks for monitoring status
  const { isLoading: isApproveTxLoading, isSuccess: isApproveTxSuccess, isError: isApproveTxError } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: !!approveHash } // Only enable when there's a hash to wait for
  });

  const { isLoading: isTransferTxLoading, isSuccess: isTransferTxSuccess, isError: isTransferTxError } = useWaitForTransactionReceipt({
    hash: transferHash,
    query: { enabled: !!transferHash } // Only enable when there's a hash to wait for
  });

  // Read current allowance (from external wallet to spender)
  const { data: allowance, refetch: refetchAllowance, isLoading: isAllowanceLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: effectiveSpender && fromAddress ? [fromAddress, effectiveSpender] : undefined,
    query: {
      enabled: !!effectiveSpender && !!fromAddress, // Only enable if addresses are valid
    },
  });

  // Read token balance of fromAddress
  const { data: balance, isLoading: isBalanceLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [fromAddress],
    query: {
      enabled: !!fromAddress,
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
  const isReadingData = isAllowanceLoading || isBalanceLoading || isDecimalsLoading || isSymbolLoading;

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      currentStep: 'idle',
      error: null,
      txHash: null,
      needsApproval: false,
      pendingAmountForTransfer: null,
    });
  }, []);

  // Function to request approval (exposed for UI, but also used internally)
  const requestApproval = useCallback(async (amount: string) => {
    if (!tokenDecimals) {
      setState(prev => ({ ...prev, error: 'Token decimals not loaded', isLoading: false }));
      return;
    }
    if (!effectiveSpender) {
      setState(prev => ({ ...prev, error: 'Spender address not set', isLoading: false }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true, // Overall process is loading
        currentStep: 'awaiting_approval_tx',
        error: null,
        txHash: null, // Clear previous hash
      }));

      const amountBigInt = parseUnits(amount, tokenDecimals);

      // Trigger the approve transaction
      await writeApprove({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [effectiveSpender, amountBigInt],
      });

    } catch (error: any) {
      console.error('Approval error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentStep: 'error',
        error: error.message || 'Approval transaction failed'
      }));
    }
  }, [tokenDecimals, tokenAddress, effectiveSpender, writeApprove]);

  // Main function to execute the transferFrom flow. This is the only function your UI should call.
  const executeTransferFrom = useCallback(async (amount: string) => {
    if (!effectiveSpender || !connectedAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected or spender not determined', isLoading: false }));
      return;
    }
    if (!tokenDecimals) {
      setState(prev => ({ ...prev, error: 'Token decimals not loaded', isLoading: false }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true, // Overall process is loading
        currentStep: 'checking_allowance',
        error: null,
        txHash: null,
        pendingAmountForTransfer: amount, // Always store the pending amount
      }));

      const amountBigInt = parseUnits(amount, tokenDecimals);

      // 1. Check if fromAddress has sufficient balance
      if (balance !== undefined && amountBigInt > balance) {
        setState(prev => ({
          ...prev,
          isLoading: false, // Not loading a tx, just reporting error
          currentStep: 'error',
          error: `Insufficient token balance in source wallet (${formatUnits(balance, tokenDecimals)} ${tokenSymbol || 'tokens'} available).`
        }));
        return; // Stop execution here
      }

      // 2. Refetch current allowance to get the very latest value
      const { data: currentAllowance } = await refetchAllowance();
      const allowanceBigInt = currentAllowance || 0n;

      // 3. Check if approval is needed
      if (allowanceBigInt < amountBigInt) {
        setState(prev => ({
          ...prev,
          needsApproval: true,
          // We set isLoading to false here, as we're waiting for user to confirm approve.
          // The `isTransactionLoading` will then reflect the approval tx's status.
          isLoading: false,
          currentStep: 'awaiting_approval_tx',
          error: `Insufficient allowance. Approval required for ${formatUnits(amountBigInt, tokenDecimals)} ${tokenSymbol || 'tokens'}.`
        }));
        // Automatically request approval here.
        // This makes the hook fully autonomous for the approve step.
        // IMPORTANT: The connected wallet MUST be `fromAddress` for this `approve` call to succeed.
        // Your UI should guide the user if this is not the case.
        if (connectedAddress === fromAddress) {
          await requestApproval(amount);
        } else {
          // If the connected wallet is not the owner, we can't send the approve tx from here.
          // The UI needs to handle prompting the user to connect the correct wallet.
          setState(prev => ({
            ...prev,
            error: prev.error + ` Please connect with the token owner's wallet (${fromAddress}) to approve.`
          }));
        }
        return; // Stop here and wait for approval to complete (or for user to connect owner wallet)
      }

      // 4. If approval is sufficient (or not needed), proceed with transferFrom
      setState(prev => ({
        ...prev,
        currentStep: 'awaiting_transfer_tx',
        needsApproval: false, // Reset needsApproval
        isLoading: true, // Loading for transfer tx
      }));

      await writeTransferFrom({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transferFrom',
        args: [fromAddress, toAddress, amountBigInt],
      });

      // Note: Success state will be set by the useEffect watching transferHash

    } catch (error: any) {
      console.error('TransferFrom execution error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentStep: 'error',
        error: error.message || 'Transfer failed'
      }));
    }
  }, [
    effectiveSpender,
    connectedAddress, // Added to check for owner connection
    tokenDecimals,
    balance,
    fromAddress,
    toAddress,
    tokenAddress,
    refetchAllowance,
    writeTransferFrom,
    tokenSymbol,
    requestApproval // Included because it's called internally
  ]);

  // Effect to handle successful approval: automatically retry transferFrom
  useEffect(() => {
    if (isApproveTxSuccess && approveHash) {
      setState(prev => ({
        ...prev,
        currentStep: 'approving_success',
        isLoading: false, // Approval tx is done
        txHash: approveHash,
        needsApproval: false, // Approval done
        error: null, // Clear any previous allowance error
      }));
      console.log('Approval successful, hash:', approveHash);

      // After successful approval, if there was a pending transfer, try to execute it again
      if (state.pendingAmountForTransfer) {
        console.log('Retrying transfer after successful approval...');
        executeTransferFrom(state.pendingAmountForTransfer);
      }
    } else if (isApproveTxError && approveHash) {
       // Handle approval transaction failure (e.g., user rejected)
       setState(prev => ({
         ...prev,
         isLoading: false,
         currentStep: 'error',
         error: prev.error || 'Approval transaction failed or was rejected.',
         txHash: approveHash, // Keep the hash of the failed transaction
       }));
    }
  }, [isApproveTxSuccess, approveHash, isApproveTxError, state.pendingAmountForTransfer, executeTransferFrom]);


  // Effect to handle successful transfer
  useEffect(() => {
    if (isTransferTxSuccess && transferHash) {
      setState(prev => ({
        ...prev,
        currentStep: 'transferring_success',
        isLoading: false,
        txHash: transferHash,
        error: null, // Clear any previous error
        pendingAmountForTransfer: null, // Clear pending amount
      }));
    } else if (isTransferTxError && transferHash) {
       // Handle transferFrom transaction failure
       setState(prev => ({
         ...prev,
         isLoading: false,
         currentStep: 'error',
         error: prev.error || 'TransferFrom transaction failed or was rejected.',
         txHash: transferHash,
       }));
    }
  }, [isTransferTxSuccess, transferHash, isTransferTxError]);


  // Utility functions
  const getFormattedBalance = useCallback(() => {
    if (balance === undefined || tokenDecimals === undefined) return '0';
    return formatUnits(balance, tokenDecimals);
  }, [balance, tokenDecimals]);

  const getFormattedAllowance = useCallback(() => {
    if (allowance === undefined || tokenDecimals === undefined) return '0';
    return formatUnits(allowance, tokenDecimals);
  }, [allowance, tokenDecimals]);

  const hasEnoughBalance = useCallback((amount: string) => {
    if (balance === undefined || tokenDecimals === undefined) return false;
    try {
      const amountBigInt = parseUnits(amount, tokenDecimals);
      return balance >= amountBigInt;
    } catch {
      return false; // Invalid amount string
    }
  }, [balance, tokenDecimals]);

  const hasEnoughAllowance = useCallback((amount: string) => {
    if (allowance === undefined || tokenDecimals === undefined) return false;
    try {
      const amountBigInt = parseUnits(amount, tokenDecimals);
      return allowance >= amountBigInt;
    } catch {
      return false; // Invalid amount string
    }
  }, [allowance, tokenDecimals]);

  return {
    // State
    ...state,
    // Provide a consolidated loading state for UI
    isTransactionLoading: isApproveTxLoading || isTransferTxLoading, // Only true when a blockchain TX is pending
    isReadingData, // True when read contracts are fetching data

    // Actions
    transferFrom: executeTransferFrom,
    requestApproval,
    resetState,

    // Data
    balance: getFormattedBalance(),
    allowance: getFormattedAllowance(),
    rawBalance: balance,
    rawAllowance: allowance,
    tokenDecimals,
    tokenSymbol: tokenSymbol || 'TOKEN',

    // Addresses
    fromAddress,
    toAddress,
    spenderAddress: effectiveSpender,
    connectedAddress, // Export connected address for UI checks

    // Utilities
    hasEnoughBalance,
    hasEnoughAllowance,
  };
};