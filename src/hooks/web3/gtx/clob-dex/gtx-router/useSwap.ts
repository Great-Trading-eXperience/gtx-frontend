import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useChainId } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt } from "wagmi/actions";
import { createWalletClient, custom } from "viem";
import { writeContract } from "wagmi/actions";

const getTokenDecimals = async (tokenAddress: HexAddress): Promise<number> => {
  try {
    const decimals = await readContract(wagmiConfig, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    });
    return decimals;
  } catch (error) {
    console.error(`Failed to fetch decimals for token ${tokenAddress}:`, error);
    return 18;
  }
};

const getChain = (chainId: number) => {
  const chains = wagmiConfig.chains;
  return chains.find(chain => chain.id === chainId) || chains[0];
};

interface SwapParams {
  srcTokenAddress: HexAddress;
  dstTokenAddress: HexAddress;
  srcAmount: string;
  minDstAmount: string;
  maxHops?: number;
}

export const useSwap = (userAddress?: HexAddress) => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [swapHash, setSwapHash] = useState<HexAddress | undefined>(undefined);
  
  // Get the embedded wallet or first connected wallet
  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  const address = userAddress || (wallet?.address as HexAddress);

  const chainId = useChainId();

  const resetSwapState = useCallback(() => {
    setSwapHash(undefined);
  }, []);

  const checkBalance = async (token: HexAddress, requiredAmount: bigint, address: HexAddress) => {
    console.log('[SWAP] 💳 Checking balance for token:', {
      token,
      requiredAmount: requiredAmount.toString(),
      userAddress: address
    });
    
    const balance = await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });

    console.log('[SWAP] 💰 Balance check result:', {
      token,
      balance: balance.toString(),
      requiredAmount: requiredAmount.toString(),
      sufficient: balance >= requiredAmount
    });

    if (balance < requiredAmount) {
      const tokenDecimals = await getTokenDecimals(token);
      const formattedBalance = formatUnits(balance, tokenDecimals);
      const formattedRequired = formatUnits(requiredAmount, tokenDecimals);
      
      const errorMessage = `Insufficient balance. You have ${formattedBalance}, but need ${formattedRequired}.`;
      console.error('[SWAP] ❌ Insufficient balance:', {
        token,
        balance: formattedBalance,
        required: formattedRequired,
        decimals: tokenDecimals
      });
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }    
  };

  const writeContractWithPrivy = async (contractCall: {
    address: HexAddress;
    abi: any;
    functionName: string;
    args: readonly unknown[];
  }) => {
    if (!wallet || !address) {
      throw new Error('No wallet connected');
    }
    
    try {
      // Switch to the correct chain first
      await wallet.switchChain(chainId);

      // Method 1: Try the standard getEthereumProvider approach (most common)
      if ('getEthereumProvider' in wallet) {
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

        return hash as HexAddress;
      }

      // Method 2: Try the newer getWalletClient method (if available)
      if ('getWalletClient' in wallet && typeof (wallet as any).getWalletClient === 'function') {
        const walletClient = await (wallet as any).getWalletClient();
        
        // Let wallet client handle nonce automatically  
        const hash = await walletClient.writeContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
        });

        return hash as HexAddress;
      }

      // Method 3: Fallback to using wagmi's writeContract with account override
      const result = await writeContract(wagmiConfig, {
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
        account: address,
      });

      return result as HexAddress;
    } catch (error: any) {
      console.error('Privy writeContract failed:', error);
      throw error;
    }
  };

  const ensureAllowance = async (
    token: HexAddress,
    requiredAmount: bigint,
    address: HexAddress,
    chainId: number
  ) => {
    const spender = getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress;
    
    console.log('[SWAP] 🔐 Checking allowance for token:', {
      token,
      owner: address,
      spender, // BalanceManager address (tokens are deposited here, not to Router)
      requiredAmount: requiredAmount.toString(),
      chainId
    });
    
    const allowance = await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, spender],
    });

    console.log('[SWAP] ✅ Allowance check result:', {
      token,
      currentAllowance: allowance.toString(),
      requiredAmount: requiredAmount.toString(),
      sufficient: allowance >= requiredAmount
    });

    if (allowance < requiredAmount) {
      console.log('[SWAP] 📝 Insufficient allowance, requesting approval...');
      toast.info('Approving tokens for swap...');
      
      const approvalHash = await writeContractWithPrivy({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, requiredAmount],
      });

      console.log('[SWAP] 📤 Approval transaction hash:', approvalHash);

      const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: approvalHash
      });

      console.log('[SWAP] 📨 Approval receipt:', {
        hash: approvalHash,
        status: approvalReceipt.status,
        gasUsed: approvalReceipt.gasUsed?.toString()
      });

      if (approvalReceipt.status !== 'success') {
        console.error('[SWAP] ❌ Token approval failed');
        toast.error('Token approval failed');
        throw new Error('Token approval failed');
      }
      
      console.log('[SWAP] ✅ Token approval confirmed');
      toast.success('Token approval confirmed');
    }
  };

  const executeSwap = async (
    srcTokenAddress: HexAddress,
    dstTokenAddress: HexAddress,
    srcAmount: string,
    minDstAmount: string,
    maxHops: number = 3
  ) => {
    const routerAddress = getContractAddress(chainId, ContractName.clobRouter) as HexAddress;
    
    console.log('[SWAP] 🔍 Execute swap called with parameters:', {
      srcTokenAddress,
      dstTokenAddress,
      srcAmount,
      minDstAmount,
      maxHops,
      userAddress: address,
      routerAddress,
      chainId
    });
    
    // Log wallet and connection status
    console.log('[SWAP] 🔗 Wallet status:', {
      walletType: wallet?.walletClientType,
      walletAddress: wallet?.address,
      connectedAddress: address,
      chainId,
      isEmbeddedWallet: wallet?.walletClientType === 'privy'
    });
    
    // Convert amounts to proper units
    const srcTokenDecimals = await getTokenDecimals(srcTokenAddress);
    const dstTokenDecimals = await getTokenDecimals(dstTokenAddress);
    
    console.log('[SWAP] 🔢 Token decimals fetched:', {
      srcTokenAddress,
      srcTokenDecimals,
      dstTokenAddress, 
      dstTokenDecimals
    });
    
    const srcAmountWei = parseUnits(srcAmount, srcTokenDecimals);
    const minDstAmountWei = parseUnits(minDstAmount, dstTokenDecimals);
    
    console.log('[SWAP] 💰 Amount conversions:', {
      srcAmount,
      srcAmountWei: srcAmountWei.toString(),
      minDstAmount,
      minDstAmountWei: minDstAmountWei.toString(),
      srcTokenDecimals,
      dstTokenDecimals
    });
    
    const args = [
      srcTokenAddress,
      dstTokenAddress,
      srcAmountWei,
      minDstAmountWei,
      maxHops,
      address
    ] as const;
    
    console.log('[SWAP] 📋 Contract call arguments:', {
      contractAddress: routerAddress,
      functionName: 'swap',
      args: args.map(arg => typeof arg === 'bigint' ? arg.toString() : arg)
    });
    
    try {
      console.log('[SWAP] 🧪 Starting simulation...');
      
      // First try to estimate gas using wagmi
      try {
        const { estimateGas } = await import('wagmi/actions');
        const gasEstimate = await estimateGas(wagmiConfig, {
          to: routerAddress,
          data: '0x', // Would need to encode the function call properly
        });
        console.log('[SWAP] ⛽ Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.log('[SWAP] ⚠️ Could not estimate gas, proceeding with simulation');
      }
      
      console.log('[SWAP] 📤 Simulation sender address:', address);
      
      const simulation = await simulateContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName: 'swap',
        args,
        account: address,
      });
      console.log('[SWAP] ✅ Simulation successful, result:', simulation.result);
    } catch (simulationError: any) {
      console.error('[SWAP] ❌ Simulation failed with detailed error:', {
        error: simulationError,
        errorMessage: simulationError?.message,
        errorCause: simulationError?.cause,
        errorData: simulationError?.data,
        errorCode: simulationError?.code,
        errorSignature: simulationError?.data || simulationError?.signature,
        errorDetails: simulationError?.details,
        shortMessage: simulationError?.shortMessage,
        metaMessages: simulationError?.metaMessages,
        contractCall: {
          address: routerAddress,
          functionName: 'swap',
          args: args.map(arg => typeof arg === 'bigint' ? arg.toString() : arg)
        }
      });

      // Try to decode the error signature
      if (simulationError?.data && typeof simulationError.data === 'string') {
        console.error('[SWAP] 🔍 Raw error data:', simulationError.data);
        
        // Check if it's the 0x7939f424 error
        if (simulationError.data.includes('7939f424')) {
          console.error('[SWAP] 🚨 Detected error signature 0x7939f424 - this may be a custom contract error');
        }
      }

      throw simulationError;
    }

    // Execute if simulation passes using Privy
    return await writeContractWithPrivy({
      address: routerAddress,
      abi: GTXRouterABI,
      functionName: 'swap',
      args,
    });
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

  const swapMutation = useMutation({
    mutationFn: async ({
      srcTokenAddress,
      dstTokenAddress,
      srcAmount,
      minDstAmount,
      maxHops = 3
    }: SwapParams) => {
      try {
        // Check if user is authenticated and has a wallet
        if (!user || !wallet || !address) {
          throw new Error('Please connect your wallet first');
        }

        if (srcTokenAddress === dstTokenAddress) {
          throw new Error('Cannot swap identical tokens');
        }

        // Convert amounts for balance and allowance checks
        const srcTokenDecimals = await getTokenDecimals(srcTokenAddress);
        const srcAmountWei = parseUnits(srcAmount, srcTokenDecimals);

        // Check balance
        await checkBalance(srcTokenAddress, srcAmountWei, address as HexAddress);

        // Ensure allowance for swap
        await ensureAllowance(srcTokenAddress, srcAmountWei, address as HexAddress, chainId);

        // Execute the swap
        const hash = await executeSwap(
          srcTokenAddress,
          dstTokenAddress,
          srcAmount,
          minDstAmount,
          maxHops
        );

        setSwapHash(hash);
        toast.success('Swap submitted. Waiting for confirmation...');

        const receipt = await waitForTransactionReceiptWithRetry(hash, {
          maxAttempts: 5,
          initialDelay: 2000, 
          maxDelay: 10000,   
          timeout: 120000    
        });

        if (receipt && receipt.status === 'success') {
          toast.success('Swap confirmed successfully!');
          return receipt;
        } else {
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }

      } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
          const errorStr = error.toString();
          
          if (errorStr.includes('0x7939f424')) {
            toast.error("No trading pools available for this token pair. Please try a different token pair or check if liquidity exists.");
          } else if (errorStr.includes('InsufficientSwapBalance')) {
            toast.error("Insufficient balance for this swap.");
          } else if (errorStr.includes('SlippageTooHigh')) {
            toast.error("Swap failed due to high slippage. Try again with higher slippage tolerance.");
          } else if (errorStr.includes('NoValidSwapPath')) {
            toast.error("No valid swap path found between these tokens. Please try a different token pair.");
          } else if (errorStr.includes('IdenticalCurrencies')) {
            toast.error("Cannot swap identical tokens.");
          } else if (errorStr.includes('TransactionReceiptNotFoundError')) {
            toast.error("Transaction is taking longer than expected. Please check your transaction status manually.");
          } else if (errorStr.includes('reverted') && !errorStr.includes('reason')) {
            toast.error('Contract execution failed. This might be due to insufficient balance, slippage, or market conditions.');
          } else {
            toast.error(error.message || 'Failed to execute swap');
          }
        }
        
        throw error;
      }
    },
  });

  // State management for UI
  const [isSwapConfirming, setIsSwapConfirming] = useState(false);
  const [isSwapConfirmed, setIsSwapConfirmed] = useState(false);

  // Wrapper function with validation
  const handleSwap = async (
    srcTokenAddress: HexAddress,
    dstTokenAddress: HexAddress,
    srcAmount: string,
    minDstAmount: string,
    maxHops: number = 3
  ) => {
    if (!user || !wallet || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!srcAmount || parseFloat(srcAmount) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    if (srcTokenAddress === dstTokenAddress) {
      toast.error('Cannot swap identical tokens');
      return;
    }

    setIsSwapConfirming(true);
    setIsSwapConfirmed(false);

    try {
      const result = await swapMutation.mutateAsync({
        srcTokenAddress,
        dstTokenAddress,
        srcAmount,
        minDstAmount,
        maxHops
      });

      setIsSwapConfirmed(true);
      return result;
    } catch (error) {
      setIsSwapConfirmed(false);
      throw error;
    } finally {
      setIsSwapConfirming(false);
    }
  };

  return {
    handleSwap,
    isSwapPending: swapMutation.isPending,
    isSwapConfirming,
    isSwapConfirmed,
    swapHash,
    swapError: swapMutation.error,
    resetSwapState,
  };
};