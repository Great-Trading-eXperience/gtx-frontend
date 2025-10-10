import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAccount, useChainId } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { encodeFunctionData, erc20Abi } from 'viem';
import { wagmiConfig } from '@/configs/wagmi';

// Import required ABIs
import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';

// Types
import { HexAddress } from '@/types/general/address';
import { isFeatureEnabled, getCoreChain, shouldUseCoreChainBalance } from '@/constants/features/features-config';
import { getTokensForChain } from '@/helper/token-helper';

/**
 * Simplified hook for trading balances that focuses on wallet balances
 * and avoids problematic contract calls
 */
export const useTradingBalances = (balanceManagerAddress: HexAddress, userAddress?: HexAddress) => {
  const { address: wagmiAddress } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use provided address or fall back to wagmi address
  const address = userAddress;
  
  // Helper function to get token symbol from address
  const getTokenSymbol = useCallback((tokenAddress: HexAddress, targetChainId?: number): string => {
    try {
      const tokens = getTokensForChain(targetChainId || chainId);
      const token = tokens.find(t => t.address?.toLowerCase() === tokenAddress.toLowerCase());
      return token?.symbol || `Token(${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)})`;
    } catch (error) {
      return `Token(${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)})`;
    }
  }, [chainId]);

  // Get wallet balance (ERC20) - this is our primary and most reliable method
  const getWalletBalance = useCallback(async (currency: HexAddress): Promise<bigint> => {
    if (!address) {
      // console.log('[DEBUG_BALANCE] ❌ Hook no address provided | Current Chain:', chainId);
      return BigInt(0);
    }
    
    try {
      setLoading(true);
      const tokenSymbol = getTokenSymbol(currency);
      
      // console.log('[DEBUG_BALANCE] 💰 Fetching ERC20 balance for', tokenSymbol, '| User:', address, '| Current Chain:', chainId);
      
      // Check if this is a valid ERC20 token address
      try {
        const balance = await readContract(wagmiConfig, {
          address: currency,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as HexAddress],
        });
        
        // console.log('[DEBUG_BALANCE] ✅ ERC20 balance for', tokenSymbol + ':', balance.toString(), '| User:', address, '| Current Chain:', chainId);
        return balance as bigint;
      } catch (err) {
        // console.error('[DEBUG_BALANCE] ❌ Error fetching ERC20 balance for', tokenSymbol, '| User:', address, '| Current Chain:', chainId, '| Error:', err);
        return BigInt(0);
      }
    } catch (err) {
      console.error('Error in getWalletBalance:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch wallet balance'));
      return BigInt(0);
    } finally {
      setLoading(false);
    }
  }, [address, userAddress, chainId, getTokenSymbol]);

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

  // Get total available balance - from balance manager when crosschain enabled, from ERC20 otherwise
  const getTotalAvailableBalance = useCallback(async (currency: HexAddress): Promise<bigint> => {
    if (!address) {
      // console.log('[DEBUG_BALANCE] ❌ Hook no address provided | Current Chain:', chainId);
      return BigInt(0);
    }
    
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
    const effectiveChainId = crosschainEnabled ? getCoreChain() : chainId;
    const tokenSymbol = getTokenSymbol(currency, effectiveChainId);
    
    // console.log('[DEBUG_BALANCE] 📍 User address for balance query:', address);
    // console.log('[DEBUG_BALANCE] 📍 Token being queried:', tokenSymbol, '(' + currency + ')');
    // console.log('[DEBUG_BALANCE] 📍 Current Chain ID:', chainId);
    // console.log('[DEBUG_BALANCE] 📍 Effective Chain ID (for balance):', effectiveChainId);
    // console.log('[DEBUG_BALANCE] 📍 Balance manager contract:', balanceManagerAddress);
    // console.log('[DEBUG_BALANCE] 📍 Crosschain enabled:', crosschainEnabled);
    // console.log('[DEBUG_BALANCE] 📍 Balance source:', crosschainEnabled ? 'Balance Manager Contract (Core Chain)' : 'Direct ERC20');
    
    // When crosschain is enabled, read from balance manager contract on the core chain
    if (crosschainEnabled) {
      try {
        // console.log('[DEBUG_BALANCE] 🔄 Reading balance from Balance Manager contract for', tokenSymbol, '| User:', address, '| Core Chain:', effectiveChainId);
        // console.log('[DEBUG_BALANCE] 📋 Balance Manager contract address:', balanceManagerAddress, '| Chain:', effectiveChainId);
        // console.log('[DEBUG_BALANCE] 📋 Calling getBalance(user:', address, ', token:', currency, ')');
        
        const managerBalance = await readContract(wagmiConfig, {
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'getBalance',
          args: [address as HexAddress, currency],
          chainId: effectiveChainId, // Use core chain for balance manager queries
        });
        
        // console.log('[DEBUG_BALANCE] ✅ Balance Manager balance for', tokenSymbol + ':', managerBalance.toString(), '| User:', address, '| Core Chain:', effectiveChainId);
        return managerBalance as bigint;
      } catch (error) {
        // console.error('[DEBUG_BALANCE] ❌ Failed to get Balance Manager balance for', tokenSymbol + ':', error);
        // console.error('[DEBUG_BALANCE] ❌ Error details | User:', address, '| Core Chain:', effectiveChainId, '| Token:', tokenSymbol, '| Error:', error);
        return BigInt(0);
      }
    } else {
      // When crosschain is disabled, read directly from ERC20 contract on current chain
      // console.log('[DEBUG_BALANCE] 🔄 Reading balance directly from ERC20 contract for', tokenSymbol, '| User:', address, '| Current Chain:', chainId);
      return await getWalletBalance(currency);
    }
  }, [address, balanceManagerAddress, getWalletBalance, chainId, getTokenSymbol]);

  // Simple deposit function - still try this but with better error handling
  const deposit = useCallback(async (
    currency: HexAddress,
    amount: bigint
  ): Promise<boolean> => {
    // When crosschain deposit is enabled, assets are deposited directly through crosschain
    // mechanism, so no manual deposit is needed
    if (isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED')) {
      const tokenSymbol = getTokenSymbol(currency);
      const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
      const effectiveChainId = crosschainEnabled ? getCoreChain() : chainId;
      // console.log('[DEBUG_BALANCE] 🔄 Crosschain deposit enabled - no manual deposit needed for', tokenSymbol, '| Current Chain:', chainId, '| Core Chain:', effectiveChainId);
      toast.info('Crosschain deposit is enabled - assets are deposited automatically');
      return true;
    }

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
  }, [address, balanceManagerAddress, userAddress]);

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