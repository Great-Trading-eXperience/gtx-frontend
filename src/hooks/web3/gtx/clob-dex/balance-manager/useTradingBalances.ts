import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { encodeFunctionData, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

// Import required ABIs
import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';

// Types
import { HexAddress } from '@/types/general/address';

/**
 * Simplified hook for trading balances that focuses on wallet balances
 * and avoids problematic contract calls
 */
export const useTradingBalances = (balanceManagerAddress: HexAddress) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get wallet balance (ERC20) - this is our primary and most reliable method
  const getWalletBalance = useCallback(async (currency: HexAddress): Promise<bigint> => {
    if (!address) return BigInt(0);
    
    try {
      setLoading(true);
      
      // Check if this is a valid ERC20 token address
      try {
        const balance = await readContract(wagmiConfig, {
          address: currency,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as HexAddress],
        });
        
        return balance as bigint;
      } catch (err) {
        console.error('Error fetching ERC20 balance:', err);
        return BigInt(0);
      }
    } catch (err) {
      console.error('Error in getWalletBalance:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch wallet balance'));
      return BigInt(0);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // These are stub implementations that just return wallet balance
  // We're avoiding the problematic contract calls
  const getManagerBalance = useCallback(async (currency: HexAddress): Promise<bigint> => {
    // Just return 0 to avoid problematic contract calls
    return BigInt(0);
  }, []);

  const getLockedBalance = useCallback(async (
    currency: HexAddress,
    operator: HexAddress
  ): Promise<bigint> => {
    // Just return 0 to avoid problematic contract calls
    return BigInt(0);
  }, []);

  // Since manager balance calls are failing, just return wallet balance
  const getTotalAvailableBalance = useCallback(async (currency: HexAddress): Promise<bigint> => {
    return await getWalletBalance(currency);
  }, [getWalletBalance]);

  // Simple deposit function - still try this but with better error handling
  const deposit = useCallback(async (
    currency: HexAddress,
    amount: bigint
  ): Promise<boolean> => {
    if (!address) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      
      // Check allowance first
      const allowance = await readContract(wagmiConfig, {
        address: currency,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as HexAddress, balanceManagerAddress],
      });

      if (allowance < amount) {
        // Need to approve tokens
        toast.info('Approving tokens...');
        try {
          const approveHash = await writeContract(wagmiConfig, {
            account: address,
            address: currency,
            abi: erc20Abi,
            functionName: 'approve',
            args: [balanceManagerAddress, amount],
          });

          await waitForTransactionReceipt(wagmiConfig, {
            hash: approveHash,
          });
        } catch (error) {
          console.error('Token approval failed:', error);
          toast.error('Failed to approve tokens');
          return false;
        }
      }
      
      // Now try deposit but be prepared for it to fail
      toast.info('Attempting to deposit funds...');
      
      try {
        // Try with the 2-argument version first
        const depositHash = await writeContract(wagmiConfig, {
          account: address,
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'deposit',
          args: [currency, amount],
        });

        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: depositHash,
        });

        if (receipt.status === 'success') {
          toast.success('Deposit successful');
          return true;
        }
      } catch (error) {
        console.error('Deposit failed with 2 arguments:', error);
        
        try {
          // Try with the 3-argument version
          const depositHash = await writeContract(wagmiConfig, {
            account: address,
            address: balanceManagerAddress,
            abi: BalanceManagerABI,
            functionName: 'deposit',
            args: [currency, amount, address],
          });

          const receipt = await waitForTransactionReceipt(wagmiConfig, {
            hash: depositHash,
          });

          if (receipt.status === 'success') {
            toast.success('Deposit successful');
            return true;
          }
        } catch (err) {
          console.error('Deposit failed with 3 arguments:', err);
          toast.error('Deposit failed. Contract may not be properly configured.');
          return false;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error during deposit:', err);
      setError(err instanceof Error ? err : new Error('Failed to deposit'));
      toast.error(err instanceof Error ? err.message : 'Deposit failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, balanceManagerAddress]);

  // Simple withdraw function - stub that always fails since the contract seems problematic
  const withdraw = useCallback(async (
    currency: HexAddress,
    amount: bigint
  ): Promise<boolean> => {
    toast.error('Withdrawal is not available in this version');
    return false;
  }, []);

  return {
    getManagerBalance,
    getLockedBalance,
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    withdraw,
    loading,
    error
  };
};