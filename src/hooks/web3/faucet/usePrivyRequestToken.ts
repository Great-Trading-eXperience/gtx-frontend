import faucetABI from '@/abis/faucet/FaucetABI';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { HexAddress } from '@/types/general/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createWalletClient, custom } from 'viem';
import { useChainId } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';

const getChain = (chainId: number) => {
  const chains = wagmiConfig.chains;
  return chains.find(chain => chain.id === chainId) || chains[0];
};

export const usePrivyRequestToken = (userAddress?: HexAddress) => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [requestTokenHash, setRequestTokenHash] = useState<HexAddress | undefined>(undefined);
  
  // Get the embedded wallet or first connected wallet
  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  const address = userAddress || (wallet?.address as HexAddress);

  const chainId = useChainId();

  // Log wallet information
  useEffect(() => {
    console.log('[usePrivyRequestToken] Wallet info:', {
      userAddress,
      walletAddress: wallet?.address,
      walletType: wallet?.walletClientType,
      finalAddress: address,
      walletsCount: wallets.length
    });
  }, [userAddress, wallet?.address, wallet?.walletClientType, address, wallets.length]);

  const resetRequestTokenState = useCallback(() => {
    setRequestTokenHash(undefined);
  }, []);

  const writeContractWithPrivy = async (contractCall: {
    address: HexAddress;
    abi: any;
    functionName: string;
    args: readonly unknown[];
  }) => {
    console.log('[usePrivyRequestToken] writeContractWithPrivy called with:', {
      contractAddress: contractCall.address,
      functionName: contractCall.functionName,
      args: contractCall.args,
      walletAddress: address,
      chainId
    });

    if (!wallet || !address) {
      const error = 'No wallet connected';
      console.error('[usePrivyRequestToken] writeContractWithPrivy error:', error);
      throw new Error(error);
    }
    
    try {
      console.log('[usePrivyRequestToken] Switching to chain:', chainId);
      // Switch to the correct chain first
      await wallet.switchChain(chainId);

      // Method 1: Try the standard getEthereumProvider approach (most common)
      if ('getEthereumProvider' in wallet) {
        console.log('[usePrivyRequestToken] Using getEthereumProvider method');
        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({
          account: address,
          chain: getChain(chainId),
          transport: custom(provider),
        });

        // Let wallet client handle nonce automatically
        const hash = await walletClient.writeContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
        });
        console.log('[usePrivyRequestToken] Transaction hash from getEthereumProvider:', hash);
        return hash as HexAddress;
      }

      // Method 2: Try the newer getWalletClient method (if available)
      if ('getWalletClient' in wallet && typeof (wallet as any).getWalletClient === 'function') {
        console.log('[usePrivyRequestToken] Using getWalletClient method');
        const walletClient = await (wallet as any).getWalletClient();
        
        // Let wallet client handle nonce automatically  
        const hash = await walletClient.writeContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
        });
        console.log('[usePrivyRequestToken] Transaction hash from getWalletClient:', hash);
        return hash as HexAddress;
      }

      // Method 3: Fallback to using wagmi's writeContract with account override
      console.log('[usePrivyRequestToken] Using wagmi writeContract fallback');
      const result = await writeContract(wagmiConfig, {
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
        account: address,
      });

      console.log('[usePrivyRequestToken] Transaction hash from wagmi fallback:', result);
      return result as HexAddress;
    } catch (error: any) {
      console.error('[usePrivyRequestToken] Privy writeContract failed:', error);
      throw error;
    }
  };

  async function waitForTransactionReceiptWithRetry(
    hash: HexAddress, 
    options: {
      maxAttempts: number;
      initialDelay: number;
      maxDelay: number;
      timeout: number;
    }
  ) {
    const { maxAttempts, initialDelay, maxDelay, timeout } = options;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check if we've exceeded the total timeout
        if (Date.now() - startTime > timeout) {
          throw new Error(`Transaction receipt timeout after ${timeout}ms`);
        }
        
        const receipt = await waitForTransactionReceipt(wagmiConfig, { 
          hash,
          timeout: Math.min(20000, timeout - (Date.now() - startTime)) // Dynamic timeout
        });
        
        return receipt;
        
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const requestTokenMutation = useMutation({
    mutationFn: async ({
      receiverAddress,
      tokenAddress
    }: {
      receiverAddress: HexAddress;
      tokenAddress: HexAddress;
    }) => {
      console.log('[usePrivyRequestToken] Starting token request mutation:', {
        receiverAddress,
        tokenAddress,
        senderAddress: address,
        chainId,
        hasUser: !!user,
        hasWallet: !!wallet
      });

      try {
        // Check if user is authenticated and has a wallet
        if (!user || !wallet || !address) {
          const error = 'Please connect your wallet first';
          console.error('[usePrivyRequestToken] Authentication check failed:', error);
          throw new Error(error);
        }

        const faucetAddress = getContractAddress(chainId, ContractName.faucet) as HexAddress;
        console.log('[usePrivyRequestToken] Using faucet address:', faucetAddress);

        // Simulate the contract call first
        console.log('[usePrivyRequestToken] Simulating contract call...');
        await simulateContract(wagmiConfig, {
          address: faucetAddress,
          abi: faucetABI,
          functionName: 'requestToken',
          args: [receiverAddress, tokenAddress],
          account: address,
        });
        console.log('[usePrivyRequestToken] Contract simulation successful');

        // Execute the contract call using Privy
        console.log('[usePrivyRequestToken] Executing contract call with Privy...');
        const hash = await writeContractWithPrivy({
          address: faucetAddress,
          abi: faucetABI,
          functionName: 'requestToken',
          args: [receiverAddress, tokenAddress],
        });

        console.log('[usePrivyRequestToken] Transaction submitted with hash:', hash);
        setRequestTokenHash(hash);
        toast.success('Token request submitted. Waiting for confirmation...');

        console.log('[usePrivyRequestToken] Waiting for transaction receipt...');
        const receipt = await waitForTransactionReceiptWithRetry(hash, {
          maxAttempts: 5,
          initialDelay: 2000, 
          maxDelay: 10000,   
          timeout: 120000    
        });

        console.log('[usePrivyRequestToken] Transaction receipt received:', receipt);

        if (receipt && receipt.status === 'success') {
          console.log('[usePrivyRequestToken] Transaction confirmed successfully!');
          toast.success('Token request confirmed successfully!');
          return receipt;
        } else {
          console.error('[usePrivyRequestToken] Transaction failed on-chain:', receipt);
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }

      } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
          const errorStr = error.toString();
          
          if (errorStr.includes('CooldownActive')) {
            toast.error("Faucet cooldown is still active. Please wait before requesting again.");
          } else if (errorStr.includes('InsufficientBalance')) {
            toast.error("Faucet has insufficient balance for this token.");
          } else if (errorStr.includes('TransactionReceiptNotFoundError')) {
            toast.error("Transaction is taking longer than expected. Please check your transaction status manually.");
          } else if (errorStr.includes('reverted') && !errorStr.includes('reason')) {
            toast.error(`Contract execution failed. This might be due to cooldown period or insufficient faucet balance. Check console for details.`);
          } else {
            toast.error(error.message || 'Failed to request token');
          }
        }
        
        throw error;
      }
    },
  });

  // For transaction confirmation state management
  const [isRequestTokenConfirming, setIsRequestTokenConfirming] = useState(false);
  const [isRequestTokenConfirmed, setIsRequestTokenConfirmed] = useState(false);

  // Wrapper function with validation
  const handleRequestToken = async (receiverAddress: HexAddress, tokenAddress: HexAddress) => {
    console.log('[usePrivyRequestToken] handleRequestToken called:', {
      receiverAddress,
      tokenAddress,
      currentAddress: address,
      hasUser: !!user,
      hasWallet: !!wallet
    });

    if (!user || !wallet || !address) {
      const error = 'Please connect your wallet first';
      console.error('[usePrivyRequestToken] handleRequestToken validation failed:', error);
      toast.error(error);
      return;
    }

    if (!receiverAddress || !tokenAddress) {
      const error = 'Receiver address and token address are required';
      console.error('[usePrivyRequestToken] handleRequestToken validation failed:', error);
      toast.error(error);
      return;
    }

    console.log('[usePrivyRequestToken] Starting token request process...');
    setIsRequestTokenConfirming(true);
    setIsRequestTokenConfirmed(false);

    try {
      const result = await requestTokenMutation.mutateAsync({
        receiverAddress,
        tokenAddress
      });

      console.log('[usePrivyRequestToken] Token request completed successfully:', result);
      setIsRequestTokenConfirmed(true);
      return result;
    } catch (error) {
      console.error('[usePrivyRequestToken] Token request failed:', error);
      setIsRequestTokenConfirmed(false);
      throw error;
    } finally {
      setIsRequestTokenConfirming(false);
    }
  };

  return {
    handleRequestToken,
    isRequestTokenPending: requestTokenMutation.isPending,
    isRequestTokenConfirming,
    isRequestTokenConfirmed,
    requestTokenHash,
    requestTokenError: requestTokenMutation.error,
    resetRequestTokenState,
    isAlertOpen: !!requestTokenHash, // For backward compatibility with existing component
    setIsAlertOpen: (open: boolean) => {
      if (!open) {
        resetRequestTokenState();
      }
    },
  };
};