import BalanceManagerABI from "@/abis/gtx/clob/BalanceManagerABI";
import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { useToast } from "@/components/clob-dex/place-order/toastContext";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { getCoreChain, isFeatureEnabled } from "@/constants/features/features-config";
import { HexAddress } from "@/types/general/address";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createWalletClient, custom, erc20Abi, formatUnits } from "viem";
import { useChainId } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt } from "wagmi/actions";
import { OrderSideEnum, TimeInForceEnum } from "../../../../../../lib/enums/clob.enum";

// Helper function to get the effective chain ID for contract calls
const getEffectiveChainId = (currentChainId: number): number => {
  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  const effectiveChainId = crosschainEnabled ? getCoreChain() : currentChainId;
  console.log('[DEBUG_PRIVY_ORDER] 🔗 Chain selection | Crosschain enabled:', crosschainEnabled, '| Current chain:', currentChainId, '| Effective chain:', effectiveChainId);
  return effectiveChainId;
};

const getTokenDecimals = async (tokenAddress: HexAddress, chainId?: number): Promise<number> => {
  try {
    const effectiveChainId = chainId || getCoreChain(); // Default to core chain if not specified
    console.log('[DEBUG_PRIVY_ORDER] 💳 Getting token decimals | Token:', tokenAddress, '| Chain:', effectiveChainId);
    
    const decimals = await readContract(wagmiConfig, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
      chainId: effectiveChainId,
    });
    
    console.log('[DEBUG_PRIVY_ORDER] ✅ Token decimals retrieved:', decimals, '| Token:', tokenAddress, '| Chain:', effectiveChainId);
    return decimals;
  } catch (error) {
    console.error(`[DEBUG_PRIVY_ORDER] ❌ Failed to fetch decimals for token ${tokenAddress} on chain ${chainId}:`, error);
    return 18;
  }
};

const getChain = (chainId: number) => {
  // Return your chain config based on chainId
  // This should match your wagmi chain configuration
  const chains = wagmiConfig.chains;
  return chains.find(chain => chain.id === chainId) || chains[0];
};

type OrderType = 'market' | 'limit';

interface OrderParams {
  pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress };
  baseCurrency: HexAddress;
  quoteCurrency: HexAddress;
  orderBook: HexAddress;
  quantity: bigint;
  side: OrderSideEnum;
  price?: bigint;
  timeInForce?: TimeInForceEnum;
  slippageBps?: number;
  originalUsdcAmount?: bigint;
}

interface SlippageInfo {
  minOutAmount: bigint;
  conservativeMinOut: bigint;
  slippageTolerance: number;
  actualSlippage: number;
  estimatedPrice: bigint;
}

interface BestSellPrice {
  price: bigint;
  volume: bigint;
}

export const usePlaceOrder = (userAddress?: HexAddress) => {
  const { showToast, updateToast } = useToast();

  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [walletNeedsRecovery, setWalletNeedsRecovery] = useState(false);
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(
    undefined
  );

  // Get the embedded wallet or first connected wallet
  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const address = userAddress || (wallet?.address as HexAddress);

  const currentChainId = useChainId();
  const effectiveChainId = getEffectiveChainId(currentChainId); // Chain for all operations when crosschain enabled

  // Check wallet recovery status on wallet change
  useEffect(() => {
    if (embeddedWallet) {
      // For Privy wallets, check if wallet has proper connectivity
      // Since we can't access recoveryMethod, we'll rely on error handling during transactions
      console.log('[DEBUG_PRIVY_ORDER] 🔍 Embedded wallet detected | Address:', embeddedWallet.address);
      setWalletNeedsRecovery(false); // Start optimistically
    } else {
      setWalletNeedsRecovery(false);
    }
  }, [embeddedWallet]);

  // Helper function to check if wallet is ready for transactions
  const isWalletReady = () => {
    if (!wallet || !address) {
      console.log('[DEBUG_PRIVY_ORDER] ❌ No wallet or address available');
      return false;
    }
    
    if (walletNeedsRecovery) {
      console.log('[DEBUG_PRIVY_ORDER] ❌ Wallet needs recovery');
      return false;
    }
    
    console.log('[DEBUG_PRIVY_ORDER] ✅ Wallet appears ready for transactions');
    return true;
  };

  // Recovery function - simplified to show error message
  const handleWalletRecovery = async () => {
    console.log('[DEBUG_PRIVY_ORDER] 🔄 Recovery handling - directing user to manual recovery');
    toast.error('Please recover your wallet manually through the Privy interface, then try again.');
    setWalletNeedsRecovery(false); // Reset flag to allow retry
  };

  const resetLimitOrderState = useCallback(() => {
    setLimitOrderHash(undefined);
  }, []);

  const resetMarketOrderState = useCallback(() => {
    setMarketOrderHash(undefined);
  }, []);

  // Shared helper functions
  const getRequiredTokenAndAmount = async (
    side: OrderSideEnum,
    baseCurrency: HexAddress,
    quoteCurrency: HexAddress,
    quantity: bigint,
    price?: bigint
  ) => {
    if (side === OrderSideEnum.BUY) {
      if (!price) throw new Error('Price is required for buy orders');

      const baseDecimals = await getTokenDecimals(baseCurrency, effectiveChainId);
      return {
        token: quoteCurrency,
        amount: (price * quantity) / BigInt(10 ** baseDecimals),
      };
    }
    return {
      token: baseCurrency,
      amount: quantity,
    };
  };

  const checkBalance = async (
    token: HexAddress,
    requiredAmount: bigint,
    address: HexAddress
  ) => {
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
    
    console.log('[DEBUG_PRIVY_ORDER] 💰 Checking token balance | Token:', token, '| User:', address, '| Chain:', effectiveChainId, '| Crosschain:', crosschainEnabled);
    
    let balance: bigint;
    
    if (crosschainEnabled) {
      // When crosschain is enabled, check balance from Balance Manager contract
      const balanceManagerAddress = getContractAddress(
        effectiveChainId,
        ContractName.clobBalanceManager
      ) as HexAddress;
      
      console.log('[DEBUG_PRIVY_ORDER] 💰 Reading balance from Balance Manager | Manager:', balanceManagerAddress, '| Chain:', effectiveChainId);
      
      balance = await readContract(wagmiConfig, {
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'getBalance',
        args: [address, token],
        chainId: effectiveChainId,
      }) as bigint;
      
      console.log('[DEBUG_PRIVY_ORDER] ✅ Balance Manager balance retrieved:', balance.toString(), '| Required:', requiredAmount.toString(), '| Token:', token, '| Chain:', effectiveChainId);
    } else {
      // When crosschain is disabled, check direct ERC20 balance
      console.log('[DEBUG_PRIVY_ORDER] 💰 Reading balance directly from ERC20 | Token:', token, '| Chain:', effectiveChainId);
      
      balance = await readContract(wagmiConfig, {
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: effectiveChainId,
      }) as bigint;
      
      console.log('[DEBUG_PRIVY_ORDER] ✅ ERC20 balance retrieved:', balance.toString(), '| Required:', requiredAmount.toString(), '| Token:', token, '| Chain:', effectiveChainId);
    }

    if (balance < requiredAmount) {
      const tokenDecimals = await getTokenDecimals(token, effectiveChainId);
      const formattedBalance = formatUnits(balance, tokenDecimals);
      const formattedRequired = formatUnits(requiredAmount, tokenDecimals);
      const balanceSource = crosschainEnabled ? 'Balance Manager' : 'ERC20';

      const errorMessage = `Insufficient ${balanceSource} balance. You have ${formattedBalance}, but need ${formattedRequired}.`;
      console.error('[DEBUG_PRIVY_ORDER] ❌ Insufficient balance | Token:', token, '| Source:', balanceSource, '| Chain:', effectiveChainId, '| Error:', errorMessage);
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

    // Check wallet recovery status before proceeding
    if (!isWalletReady()) {
      if (walletNeedsRecovery) {
        console.log('[DEBUG_PRIVY_ORDER] 🔄 Transaction blocked - wallet needs recovery');
        throw new Error('Wallet recovery required before placing orders');
      } else {
        throw new Error('Wallet is not ready for transactions');
      }
    }

    console.log('[DEBUG_PRIVY_ORDER] 📝 Starting writeContractWithPrivy | Function:', contractCall.functionName);

    try {
      // Chain switching strategy:
      // - When crosschain is DISABLED: switch to current chain for all operations
      // - When crosschain is ENABLED: switch to core chain where contracts are deployed
      //   This is necessary because approvals and transactions must happen on the same chain as the contracts
      const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
      const targetChainForWallet = getEffectiveChainId(currentChainId);
      
      console.log('[DEBUG_PRIVY_ORDER] 🔄 Switching wallet to target chain:', targetChainForWallet, '| Crosschain enabled:', crosschainEnabled);
      console.log('[DEBUG_PRIVY_ORDER] 🔄 Chain strategy | Current:', currentChainId, '| Effective for reads:', getEffectiveChainId(currentChainId), '| Wallet target:', targetChainForWallet);
      
      try {
        await wallet.switchChain(targetChainForWallet);
        console.log('[DEBUG_PRIVY_ORDER] ✅ Wallet successfully switched to chain:', targetChainForWallet);
      } catch (chainSwitchError) {
        console.error('[DEBUG_PRIVY_ORDER] ❌ Failed to switch wallet to chain:', targetChainForWallet, '| Error:', chainSwitchError);
        
        // Try to add the chain first if switch fails, especially for crosschain
        if (crosschainEnabled && targetChainForWallet === 1918988905) {
          console.log('[DEBUG_PRIVY_ORDER] 🔧 Chain switch failed for core chain, attempting to add chain first');
          
          try {
            // Get chain configuration from wagmi
            const wagmiChain = wagmiConfig.chains.find(chain => chain.id === targetChainForWallet);
            
            if (!wagmiChain) {
              throw new Error(`Chain configuration not found for chain ID ${targetChainForWallet}`);
            }
            
            // Get the actual RPC URL based on the mapping from route.ts
            const getRpcUrl = (chainId: number): string => {
              const rpcMapping: Record<number, string> = {
                4661: 'https://appchain.caff.testnet.espresso.network', // appchain-testnet
                1918988905: 'https://testnet.rpc.rarichain.org/http', // rari-testnet - match route.ts
                11155931: 'https://testnet.riselabs.xyz', // rise-sepolia
                911867: 'https://odyssey.ithaca.xyz', // conduit
              };
              return rpcMapping[chainId] || wagmiChain.rpcUrls.default.http[0];
            };
            
            const actualRpcUrl = getRpcUrl(targetChainForWallet);
            console.log('[DEBUG_PRIVY_ORDER] 🔧 Adding chain to wallet | Chain ID:', targetChainForWallet, '| RPC URL:', actualRpcUrl);
            
            // Add the chain to the wallet
            const provider = await wallet.getEthereumProvider();
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${targetChainForWallet.toString(16)}`,
                chainName: wagmiChain.name,
                nativeCurrency: {
                  name: wagmiChain.nativeCurrency.name,
                  symbol: wagmiChain.nativeCurrency.symbol,
                  decimals: wagmiChain.nativeCurrency.decimals,
                },
                rpcUrls: [actualRpcUrl],
                blockExplorerUrls: wagmiChain.blockExplorers ? [wagmiChain.blockExplorers.default.url] : [],
              }],
            });
            
            console.log('[DEBUG_PRIVY_ORDER] ✅ Chain added successfully, now attempting to switch');
            
            // Now try to switch again after adding the chain
            await wallet.switchChain(targetChainForWallet);
            console.log('[DEBUG_PRIVY_ORDER] ✅ Wallet successfully switched to chain after adding:', targetChainForWallet);
            
          } catch (addChainError) {
            console.error('[DEBUG_PRIVY_ORDER] 💥 Failed to add chain or switch after adding:', addChainError);
            
            const errorMsg = `Failed to add/switch to Rari core chain (${targetChainForWallet}) required for crosschain trading.\n\n` +
                            `Original switch error: ${(chainSwitchError as Error)?.message || chainSwitchError}\n` +
                            `Add chain error: ${(addChainError as Error)?.message || addChainError}\n\n` +
                            `Please manually add the Rari network to your wallet with these details:\n` +
                            `• Chain ID: ${targetChainForWallet}\n` +
                            `• RPC URL: https://testnet.rpc.rarichain.org/http\n` +
                            `• Currency: ETH\n\n` +
                            `Then try placing your order again.`;
            
            throw new Error(errorMsg);
          }
        } else {
          // For non-crosschain or other chains, provide the original error handling
          throw new Error(`Wallet chain switching failed: ${(chainSwitchError as Error)?.message || chainSwitchError}`);
        }
      }

      
      // Method 1: Try the standard getEthereumProvider approach (most common)
      if ('getEthereumProvider' in wallet) {
        console.log('[DEBUG_PRIVY_ORDER] 📝 Using Method 1: getEthereumProvider approach');
        
        try {
          const provider = await wallet.getEthereumProvider();
          console.log('[DEBUG_PRIVY_ORDER] 📝 Provider obtained:', !!provider);
          
          const walletClient = createWalletClient({
            account: address,
            chain: getChain(targetChainForWallet),
            transport: custom(provider),
          });
          console.log('[DEBUG_PRIVY_ORDER] 📝 WalletClient created | Account:', address, '| Chain:', targetChainForWallet);

          // Log the contract call details
          console.log('[DEBUG_PRIVY_ORDER] 📝 Contract call details:', {
            address: contractCall.address,
            functionName: contractCall.functionName,
            args: contractCall.args,
            chain: targetChainForWallet
          });

          console.log('[DEBUG_PRIVY_ORDER] 📝 Executing walletClient.writeContract...');
          
          // Wrap in Promise to ensure proper error handling
          const hash = await new Promise<string>((resolve, reject) => {
            walletClient.writeContract({
              address: contractCall.address,
              abi: contractCall.abi,
              functionName: contractCall.functionName,
              args: contractCall.args,
            }).then(resolve).catch(reject);
          });
          
          console.log('[DEBUG_PRIVY_ORDER] ✅ Method 1 successful | Hash:', hash);
          return hash as HexAddress;
          
        } catch (method1Error) {
          console.error('[DEBUG_PRIVY_ORDER] ❌ Method 1 failed with FULL error details:');
          console.error('[DEBUG_PRIVY_ORDER] 📝 Error message (full):', (method1Error as any)?.message);
          console.error('[DEBUG_PRIVY_ORDER] 📝 Error name:', (method1Error as any)?.name);
          console.error('[DEBUG_PRIVY_ORDER] 📝 Error cause:', (method1Error as any)?.cause);
          console.error('[DEBUG_PRIVY_ORDER] 📝 Error details:', (method1Error as any)?.details);
          console.error('[DEBUG_PRIVY_ORDER] 📝 Contract revert data:', (method1Error as any)?.cause?.data);
          console.error('[DEBUG_PRIVY_ORDER] 📝 Contract revert reason:', (method1Error as any)?.cause?.reason);
          console.log('[DEBUG_PRIVY_ORDER] 📝 Method 1 failed, will try other methods...');
          // Continue to try other methods
        }
      } else {
        console.log('[DEBUG_PRIVY_ORDER] 📝 Method 1 not available (no getEthereumProvider), trying Method 2');
      }

      // Method 2: Try the newer getWalletClient method (if available)
      if (
        'getWalletClient' in wallet &&
        typeof (wallet as any).getWalletClient === 'function'
      ) {
        console.log('[DEBUG_PRIVY_ORDER] 📝 Using Method 2: getWalletClient approach');
        
        try {
          const walletClient = await (wallet as any).getWalletClient();
          console.log('[DEBUG_PRIVY_ORDER] 📝 WalletClient obtained via Method 2:', !!walletClient);

          console.log('[DEBUG_PRIVY_ORDER] 📝 Executing Method 2 walletClient.writeContract...');
          // Let wallet client handle nonce automatically
          const hash = await walletClient.writeContract({
            address: contractCall.address,
            abi: contractCall.abi,
            functionName: contractCall.functionName,
            args: contractCall.args,
          });
          console.log('[DEBUG_PRIVY_ORDER] ✅ Method 2 successful | Hash:', hash);
          return hash as HexAddress;
        } catch (method2Error) {
          console.error('[DEBUG_PRIVY_ORDER] ❌ Method 2 failed:', method2Error);
          console.log('[DEBUG_PRIVY_ORDER] 📝 Method 2 failed, will try Method 3...');
          // Continue to Method 3
        }
      } else {
        console.log('[DEBUG_PRIVY_ORDER] 📝 Method 2 not available (no getWalletClient), trying Method 3');
      }

      console.log('[DEBUG_PRIVY_ORDER] 📝 Skipping Method 3 (wagmi fallback) - Using pure Privy approach');

      // All Privy methods failed, throw a generic error
      console.error('[DEBUG_PRIVY_ORDER] 💥 All pure Privy transaction methods failed');
      throw new Error('All Privy transaction methods failed - check logs above for details');
    } catch (error: any) {
      console.error('[DEBUG_PRIVY_ORDER] ❌ Outer catch - All writeContract methods failed');
      console.error('[DEBUG_PRIVY_ORDER] ❌ Final error details:', {
        message: error?.message,
        code: error?.code,
        cause: error?.cause,
        stack: error?.stack,
        name: error?.name
      });
      console.error('[DEBUG_PRIVY_ORDER] ❌ Contract call that failed:', contractCall);
      console.error('[DEBUG_PRIVY_ORDER] ❌ Target chain:', getEffectiveChainId(currentChainId));
      console.error('[DEBUG_PRIVY_ORDER] ❌ Wallet address:', address);
      
      // If this is the Recovery method not supported error, provide more context
      if (error?.message?.includes('Recovery method not supported')) {
        console.error('[DEBUG_PRIVY_ORDER] 🚨 RECOVERY METHOD ERROR - Wallet needs recovery before transactions');
        console.error('[DEBUG_PRIVY_ORDER] 🚨 Setting wallet needs recovery flag');
        setWalletNeedsRecovery(true);
        
        // Provide a more helpful error message
        const enhancedError = new Error(
          `Wallet recovery required before placing orders. ` +
          `Please recover your wallet first or try using an external wallet instead.`
        );
        enhancedError.cause = error;
        throw enhancedError;
      }
      
      throw error;
    }
  };

  const ensureAllowance = async (
    token: HexAddress,
    requiredAmount: bigint,
    address: HexAddress,
    targetChainId: number
  ) => {
    const spender = getContractAddress(
      targetChainId,
      ContractName.clobBalanceManager
    ) as HexAddress;

    console.log('[DEBUG_PRIVY_ORDER] 🔐 Checking token allowance | Token:', token, '| User:', address, '| Spender:', spender, '| Chain:', targetChainId);

    const allowance = await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, spender],
      chainId: targetChainId,
    });

    console.log('[DEBUG_PRIVY_ORDER] ✅ Token allowance retrieved:', allowance.toString(), '| Required:', requiredAmount.toString(), '| Chain:', targetChainId);

    if (allowance < requiredAmount) {
      console.log('[DEBUG_PRIVY_ORDER] 🔄 Approving tokens for trading | Amount:', requiredAmount.toString(), '| Chain:', targetChainId);
      toast.info('Approving tokens for trading...');

      const approvalHash = await writeContractWithPrivy({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, requiredAmount],
      });

      console.log('[DEBUG_PRIVY_ORDER] ⏳ Waiting for approval transaction receipt | Hash:', approvalHash, '| Chain:', targetChainId);
      
      const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: approvalHash,
        chainId: targetChainId, // Ensure we wait for receipt on the correct chain
      });
      
      console.log('[DEBUG_PRIVY_ORDER] ✅ Approval transaction receipt received | Status:', approvalReceipt.status, '| Chain:', targetChainId);

      if (approvalReceipt.status !== 'success') {
        console.error('[DEBUG_PRIVY_ORDER] ❌ Token approval failed | Chain:', targetChainId);
        toast.error('Token approval failed');
        throw new Error('Token approval failed');
      }

      console.log('[DEBUG_PRIVY_ORDER] ✅ Token approval confirmed | Chain:', targetChainId);
      toast.success('Token approval confirmed');
    }
  };

  const calculateSlippageForMarket = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    quantity: bigint,
    side: OrderSideEnum,
    slippageBps: number = 500,
    targetChainId: number,
    userDepositAmount?: bigint
  ): Promise<SlippageInfo> => {
    try {
      console.log('[DEBUG_PRIVY_ORDER] 📊 Calculating market slippage | Pool:', pool, '| Side:', side, '| Chain:', targetChainId);
      
      const routerAddress = getContractAddress(
        targetChainId,
        ContractName.clobRouter
      ) as HexAddress;

      let depositAmount: bigint;
      if (side === OrderSideEnum.BUY) {
        depositAmount = userDepositAmount || quantity;
      } else {
        depositAmount = quantity;
      }

      console.log('[DEBUG_PRIVY_ORDER] 📊 Calling calculateMinOutAmountForMarket | Router:', routerAddress, '| Chain:', targetChainId);
      
      const minOutAmount = (await readContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName: 'calculateMinOutAmountForMarket',
        args: [pool, depositAmount, side === OrderSideEnum.BUY ? 0 : 1, slippageBps],
        chainId: targetChainId,
      })) as bigint;

      let estimatedPrice: bigint;
      if (side === OrderSideEnum.BUY) {
        console.log('[DEBUG_PRIVY_ORDER] 📊 Getting best sell price | Router:', routerAddress, '| Chain:', targetChainId);
        
        const bestSellPrice = (await readContract(wagmiConfig, {
          address: routerAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1],
          chainId: targetChainId,
        })) as BestSellPrice;
        estimatedPrice = bestSellPrice.price;

        if (estimatedPrice === 0n) {
          console.warn(
            'No sell orders available for BUY market order slippage calculation'
          );
          throw new Error('No sell orders available for market buy order');
        }
      } else {
        if (quantity === 0n) {
          throw new Error('Invalid quantity for market sell order');
        }
        estimatedPrice = (minOutAmount * BigInt(10 ** 18)) / quantity;
      }

      let actualSlippage: number;
      if (side === OrderSideEnum.BUY) {
        const baseDecimals = await getTokenDecimals(pool.baseCurrency, targetChainId);
        const expectedEthTokens =
          (depositAmount * BigInt(10 ** baseDecimals)) / estimatedPrice;
        const actualMinTokens = minOutAmount;

        if (expectedEthTokens > 0n) {
          actualSlippage =
            Number(
              ((expectedEthTokens - actualMinTokens) * BigInt(10000)) / expectedEthTokens
            ) / 100;
        } else {
          actualSlippage = 0;
        }
      } else {
        console.log('[DEBUG_PRIVY_ORDER] 📊 Getting best buy price | Router:', routerAddress, '| Chain:', targetChainId);
        
        const bestBuyPrice = (await readContract(wagmiConfig, {
          address: routerAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 0],
          chainId: targetChainId,
        })) as BestSellPrice;

        if (bestBuyPrice.price === 0n) {
          console.warn(
            'No buy orders available for SELL market order slippage calculation'
          );
          actualSlippage = 0;
        } else {
          const baseDecimals = await getTokenDecimals(pool.baseCurrency, targetChainId);
          const expectedUSDC =
            (bestBuyPrice.price * quantity) / BigInt(10 ** baseDecimals);
          if (expectedUSDC > 0n) {
            actualSlippage =
              Number(((expectedUSDC - minOutAmount) * BigInt(10000)) / expectedUSDC) /
              100;
          } else {
            actualSlippage = 0;
          }
        }
      }

      actualSlippage = Math.max(0, actualSlippage);

      const conservativeBufferBps = 50;
      const conservativeMinOut =
        (minOutAmount * BigInt(10000 - conservativeBufferBps)) / BigInt(10000);

      const result = {
        minOutAmount,
        conservativeMinOut,
        slippageTolerance: slippageBps / 100,
        actualSlippage,
        estimatedPrice,
      };

      return result;
    } catch (error) {
      console.error('Failed to calculate slippage:', error);
      throw error;
    }
  };

  const executeOrder = async (
    orderType: OrderType,
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    price: bigint | undefined,
    quantity: bigint,
    side: OrderSideEnum,
    timeInForce: TimeInForceEnum,
    targetChainId: number,
    slippageInfo?: SlippageInfo
  ) => {
    console.log('[DEBUG_PRIVY_ORDER] 🚀 Executing order | Type:', orderType, '| Side:', side, '| Chain:', targetChainId);
    
    const routerAddress = getContractAddress(
      targetChainId,
      ContractName.clobRouter
    ) as HexAddress;
    const sideValue = side === OrderSideEnum.BUY ? 0 : 1;

    let functionName: string;
    let args: readonly unknown[];

    if (orderType === 'market') {
      if (!slippageInfo) throw new Error('Slippage info is required for market orders');

      const { amount: requiredAmount } = await getRequiredTokenAndAmount(
        side,
        pool.baseCurrency,
        pool.quoteCurrency,
        quantity,
        slippageInfo.estimatedPrice
      );

      // When crosschain is enabled, funds are already in Balance Manager, so no deposit needed
      const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
      const depositAmount = crosschainEnabled ? 0n : requiredAmount;

      functionName = 'placeMarketOrder';
      args = [
        pool,
        quantity,
        sideValue,
        depositAmount,
        slippageInfo.conservativeMinOut,
      ] as const;
    } else {
      if (!price) throw new Error('Price is required for limit orders');

      const { amount: requiredAmount } = await getRequiredTokenAndAmount(
        side,
        pool.baseCurrency,
        pool.quoteCurrency,
        quantity,
        price
      );

      functionName = 'placeLimitOrder';
      
      // When crosschain is enabled, funds are already in Balance Manager, so no deposit needed
      const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
      const depositAmount = crosschainEnabled ? 0n : requiredAmount;
      
      args = [pool, price, quantity, sideValue, timeInForce, depositAmount] as const;
    }

    // Skip allowance check when crosschain is enabled (no ERC20 transfer needed)
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
    
    if (orderType === 'market' && !crosschainEnabled) {
      if (side === OrderSideEnum.BUY && address) {
        try {
          const requiredToken = pool.quoteCurrency;
          const requiredAmount =
            functionName === 'placeMarketOrder' ? (args[3] as bigint) : quantity;

          await ensureAllowance(requiredToken, requiredAmount, address, targetChainId);
        } catch (error) {
          console.error('[DEBUG_PRIVY_ORDER] Failed to ensure allowance:', error);
          throw error;
        }
      }
    }

    // Quick balance/allowance verification before simulation (skip when crosschain enabled)
    if (orderType === 'market' && side === OrderSideEnum.BUY && address && !crosschainEnabled) {
      try {
        const pool = args[0] as {
          baseCurrency: HexAddress;
          quoteCurrency: HexAddress;
          orderBook: HexAddress;
        };
        const depositAmount = args[3] as bigint;

        console.log('[DEBUG_PRIVY_ORDER] 🔍 Final verification - checking balance and allowance | Chain:', targetChainId);
        
        let balance: bigint;
        const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
        
        if (crosschainEnabled) {
          // Check balance from Balance Manager when crosschain is enabled
          const balanceManagerAddress = getContractAddress(
            targetChainId,
            ContractName.clobBalanceManager
          ) as HexAddress;
          
          balance = (await readContract(wagmiConfig, {
            address: balanceManagerAddress,
            abi: BalanceManagerABI,
            functionName: 'getBalance',
            args: [address, pool.quoteCurrency],
            chainId: targetChainId,
          })) as bigint;
          
          console.log('[DEBUG_PRIVY_ORDER] 🔍 Final verification - Balance Manager balance:', balance.toString(), '| Chain:', targetChainId);
        } else {
          // Check direct ERC20 balance when crosschain is disabled
          balance = (await readContract(wagmiConfig, {
            address: pool.quoteCurrency,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
            chainId: targetChainId,
          })) as bigint;
          
          console.log('[DEBUG_PRIVY_ORDER] 🔍 Final verification - ERC20 balance:', balance.toString(), '| Chain:', targetChainId);
        }

        const balanceManager = getContractAddress(
          targetChainId,
          ContractName.clobBalanceManager
        ) as HexAddress;
        const allowance = (await readContract(wagmiConfig, {
          address: pool.quoteCurrency,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, balanceManager],
          chainId: targetChainId,
        })) as bigint;

        if (balance < depositAmount) {
          const balanceSource = crosschainEnabled ? 'Balance Manager' : 'ERC20';
          console.error(
            `[DEBUG_PRIVY_ORDER] ❌ INSUFFICIENT ${balanceSource.toUpperCase()} BALANCE! Need ${formatUnits(
              depositAmount,
              6
            )} USDC, have ${formatUnits(balance, 6)} USDC from ${balanceSource} | Chain: ${targetChainId}`
          );
        }
        if (allowance < depositAmount) {
          console.error(
            `[DEBUG_PRIVY_ORDER] ❌ INSUFFICIENT ALLOWANCE! Need ${formatUnits(
              depositAmount,
              6
            )} USDC allowance, have ${formatUnits(allowance, 6)} USDC`
          );
        }
      } catch (verificationError) {
        console.error(
          `[DEBUG_PRIVY_ORDER] ❌ Error during final verification:`,
          verificationError
        );
      }
    }

    try {
      console.log('[DEBUG_PRIVY_ORDER] 🧪 Simulating contract call | Router:', routerAddress, '| Function:', functionName, '| Chain:', targetChainId);
      console.log('[DEBUG_PRIVY_ORDER] 🧪 Contract call arguments:', {
        functionName,
        args: args.map((arg) => {
          if (typeof arg === 'bigint') {
            return `${arg.toString()} (${arg})`;
          }
          if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2);
          }
          return arg;
        }),
        account: address,
        chainId: targetChainId
      });
      
      await simulateContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName,
        args,
        account: address,
        chainId: targetChainId,
      });
    } catch (simulationError: any) {
      console.error('[DEBUG_PRIVY_ORDER] ❌ Simulation failed with detailed error:', {
        error: simulationError,
        errorMessage: simulationError?.message,
        errorCause: simulationError?.cause,
        errorData: simulationError?.data,
        errorCode: simulationError?.code,
        contractCall: {
          address: routerAddress,
          functionName,
          args: args.map(arg => (typeof arg === 'bigint' ? arg.toString() : arg)),
        },
      });

      try {
        await readContract(wagmiConfig, {
          address: routerAddress,
          abi: GTXRouterABI,
          functionName,
          args,
          chainId: targetChainId,
        });
      } catch (staticCallError: any) {
        console.error('[DEBUG_PRIVY_ORDER] 🔍 Static call also failed:', {
          staticError: staticCallError,
          staticErrorMessage: staticCallError?.message,
          staticErrorData: staticCallError?.data,
          note: 'This might give us more specific error details',
        });
      }

      // Check if the amounts make sense
      if (orderType === 'market') {
        // Could add additional validation here if needed
      }

      throw simulationError;
    }

    // Execute if simulation passes using Privy
    return await writeContractWithPrivy({
      address: routerAddress,
      abi: GTXRouterABI,
      functionName,
      args,
    });
  };

  const handlePreOrderChecks = async (
    orderType: OrderType,
    side: OrderSideEnum,
    baseCurrency: HexAddress,
    quoteCurrency: HexAddress,
    quantity: bigint,
    price: bigint | undefined,
    address: HexAddress,
    targetChainId: number,
    slippageInfo?: SlippageInfo
  ) => {
    let requiredAmount: bigint;

    if (orderType === 'market' && slippageInfo) {
      const { amount } = await getRequiredTokenAndAmount(
        side,
        baseCurrency,
        quoteCurrency,
        quantity,
        slippageInfo.estimatedPrice
      );
      requiredAmount = amount;
    } else {
      const { amount } = await getRequiredTokenAndAmount(
        side,
        baseCurrency,
        quoteCurrency,
        quantity,
        price
      );
      requiredAmount = amount;
    }

    // Skip balance and allowance checks when crosschain is enabled (funds already in Balance Manager)
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
    
    if (!crosschainEnabled) {
      // Get the required token for balance checks
      const requiredToken = side === OrderSideEnum.BUY ? quoteCurrency : baseCurrency;

      await checkBalance(requiredToken, requiredAmount, address);
      await ensureAllowance(requiredToken, requiredAmount, address, targetChainId);
    } else {
      console.log('[DEBUG_PRIVY_ORDER] ⚡ Skipping balance/allowance checks - crosschain enabled, funds already in Balance Manager');
    }
  };

  async function waitForTransactionReceiptWithRetry(
    hash: HexAddress,
    chainId: number,
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

        console.log('[DEBUG_PRIVY_ORDER] ⏳ Waiting for transaction receipt | Hash:', hash, '| Chain:', chainId, '| Attempt:', attempt);
        
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          chainId: chainId, // Ensure we wait for receipt on the correct chain  
          timeout: Math.min(20000, timeout - (Date.now() - startTime)), // Dynamic timeout
        });
        
        console.log('[DEBUG_PRIVY_ORDER] ✅ Transaction receipt received | Status:', receipt.status, '| Chain:', chainId);

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

  const CreateOrderMutation = (
    orderType: OrderType,
    setOrderHash: (hash: HexAddress) => void
  ) => {
    return useMutation({
      mutationFn: async ({
        pool,
        baseCurrency,
        quoteCurrency,
        quantity,
        side,
        price,
        timeInForce = TimeInForceEnum.GTC,
        slippageBps = 500,
        originalUsdcAmount,
      }: OrderParams) => {
        const toastId = showToast({
          type: 'loading',
          message: 'Processing place order...',
        });

        try {
          // Check if user is authenticated and has a wallet
          if (!user || !wallet || !address) {
            throw new Error('Please connect your wallet first');
          }

          // Check if wallet is ready for transactions (includes recovery status)
          if (!isWalletReady()) {
            if (walletNeedsRecovery) {
              throw new Error('Your wallet needs to be recovered before placing orders');
            } else {
              throw new Error('Wallet is not ready for transactions');
            }
          }

          let slippageInfo: SlippageInfo | undefined;

          if (orderType === 'market') {
            const quantityForSlippageCalc = quantity;

            const userDepositAmount =
              side === OrderSideEnum.BUY ? originalUsdcAmount : undefined;

            slippageInfo = await calculateSlippageForMarket(
              pool,
              quantityForSlippageCalc,
              side,
              slippageBps,
              effectiveChainId,
              userDepositAmount
            );
          }

          // Handle balance checks and approvals
          await handlePreOrderChecks(
            orderType,
            side,
            baseCurrency,
            quoteCurrency,
            quantity,
            price,
            address as HexAddress,
            effectiveChainId,
            slippageInfo
          );

          // Execute the order
          const hash = await executeOrder(
            orderType,
            pool,
            price,
            quantity,
            side,
            timeInForce,
            effectiveChainId,
            slippageInfo
          );

          setOrderHash(hash);
          // toast.success(`${orderType} order submitted. Waiting for confirmation...`);

          const receipt = await waitForTransactionReceiptWithRetry(hash, effectiveChainId, {
            maxAttempts: 5,
            initialDelay: 2000,
            maxDelay: 10000,
            timeout: 120000,
          });

          if (receipt && receipt.status === 'success') {
            updateToast(toastId, {
              type: 'success',
              message: 'Place Order successful!',
            });
            // toast.success(`${orderType} order confirmed successfully!`);
            return receipt;
          } else {
            // toast.error('Transaction failed on-chain');
            updateToast(toastId, {
              type: 'error',
              message: 'Transaction failed on-chain',
            });
            throw new Error('Transaction failed on-chain');
          }
        } catch (error) {
          // Handle specific error cases with enhanced detection
          if (error instanceof Error) {
            const errorStr = error.toString();

            // Check for common revert reasons
            if (errorStr.includes('0x7939f424')) {
            } else if (errorStr.includes('0xfb8f41b2')) {
              // toast.error("Insufficient balance for this order. Please deposit more funds.");
            } else if (errorStr.includes('SlippageTooHigh')) {
              // toast.error("Order failed due to high slippage. Try again with higher slippage tolerance or smaller amount.");
            } else if (errorStr.includes('InsufficientLiquidity')) {
              // toast.error("Insufficient liquidity in the order book for this order size.");
            } else if (errorStr.includes('InvalidPool')) {
              // toast.error("Invalid trading pool. Please refresh and try again.");
            } else if (errorStr.includes('TransactionReceiptNotFoundError')) {
              // toast.error("Transaction is taking longer than expected. Please check your transaction status manually.");
            } else if (errorStr.includes('reverted') && !errorStr.includes('reason')) {
              // Generic revert without specific reason
              // toast.error(`Contract execution failed. This might be due to insufficient balance, slippage, or market conditions. Check console for details.`);
            } else {
              // toast.error(error.message || `Failed to place ${orderType} order`);
            }
            updateToast(toastId, {
              type: 'error',
              message: 'Place order failed',
            });
          }

          throw error;
        }
      },
    });
  };

  // Market Order Hook
  const {
    mutateAsync: placeMarketOrder,
    isPending: isMarketOrderPending,
    error: marketSimulateError,
  } = CreateOrderMutation('market', setMarketOrderHash);

  // Limit Order Hook
  const {
    mutateAsync: placeLimitOrder,
    isPending: isLimitOrderPending,
    error: limitSimulateError,
  } = CreateOrderMutation('limit', setLimitOrderHash);

  // For transaction confirmation, you can create custom hooks since wagmi might not work with Privy
  const [isLimitOrderConfirming, setIsLimitOrderConfirming] = useState(false);
  const [isLimitOrderConfirmed, setIsLimitOrderConfirmed] = useState(false);
  const [isMarketOrderConfirming, setIsMarketOrderConfirming] = useState(false);
  const [isMarketOrderConfirmed, setIsMarketOrderConfirmed] = useState(false);

  // Wrapper functions with validation
  const handlePlaceLimitOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    price: bigint,
    quantity: bigint,
    side: OrderSideEnum,
    timeInForce: TimeInForceEnum = TimeInForceEnum.GTC
  ) => {
    if (!user || !wallet || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isWalletReady()) {
      if (walletNeedsRecovery) {
        toast.error('Please recover your wallet before placing orders');
      } else {
        toast.error('Wallet is not ready for transactions');
      }
      return;
    }

    if (price <= 0n) {
      toast.error('Price must be greater than zero');
      return;
    }

    if (quantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    setIsLimitOrderConfirming(true);
    setIsLimitOrderConfirmed(false);

    try {
      const result = await placeLimitOrder({
        pool,
        baseCurrency: pool.baseCurrency,
        quoteCurrency: pool.quoteCurrency,
        orderBook: pool.orderBook,
        price,
        quantity,
        side,
        timeInForce,
      });

      setIsLimitOrderConfirmed(true);
      return result;
    } catch (error) {
      setIsLimitOrderConfirmed(false);
      throw error;
    } finally {
      setIsLimitOrderConfirming(false);
    }
  };

  const handlePlaceMarketOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    inputQuantity: bigint, // This should be the amount user wants to spend/sell
    side: OrderSideEnum,
    slippageBps: number = 500
  ) => {
    if (!user || !wallet || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isWalletReady()) {
      if (walletNeedsRecovery) {
        toast.error('Please recover your wallet before placing orders');
      } else {
        toast.error('Wallet is not ready for transactions');
      }
      return;
    }

    if (inputQuantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    let baseCurrencyQuantity: bigint;
    let actualDepositAmount: bigint;

    if (side === OrderSideEnum.BUY) {
      // User input: how much USDC they want to spend
      const quoteCurrencyToSpend = inputQuantity;
      actualDepositAmount = quoteCurrencyToSpend;

      try {
        // Get best sell price to estimate how much ETH they'll get
        const bestSellPrice = (await readContract(wagmiConfig, {
          address: getContractAddress(effectiveChainId, ContractName.clobRouter) as HexAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1],
          chainId: effectiveChainId,
        })) as BestSellPrice;

        if (bestSellPrice.price === 0n) {
          throw new Error('No sell orders available for market buy order');
        }

        // Calculate expected ETH amount (this is just for estimation)
        const baseDecimals = await getTokenDecimals(pool.baseCurrency, effectiveChainId);
        baseCurrencyQuantity =
          (quoteCurrencyToSpend * BigInt(10 ** baseDecimals)) / bestSellPrice.price;
      } catch (error) {
        console.error('Failed to get market price:', error);
        throw new Error('Failed to get current market price');
      }
    } else {
      // SELL order: user specifies how much ETH to sell
      baseCurrencyQuantity = inputQuantity;
      actualDepositAmount = inputQuantity;
    }

    // CRITICAL: Pre-validate the amounts make sense
    if (side === OrderSideEnum.BUY) {
      const maxReasonableETH = BigInt(10 * 10 ** 18); // 10 ETH max for safety
      if (baseCurrencyQuantity > maxReasonableETH) {
        throw new Error(
          `Estimated ETH amount (${formatUnits(
            baseCurrencyQuantity,
            18
          )} ETH) seems too large for ` +
            `deposit amount (${formatUnits(
              actualDepositAmount,
              6
            )} USDC). Check market price calculation.`
        );
      }
    }

    setIsMarketOrderConfirming(true);
    setIsMarketOrderConfirmed(false);

    try {
      const result = await placeMarketOrder({
        pool,
        baseCurrency: pool.baseCurrency,
        quoteCurrency: pool.quoteCurrency,
        orderBook: pool.orderBook,
        quantity: baseCurrencyQuantity,
        originalUsdcAmount: side === OrderSideEnum.BUY ? actualDepositAmount : undefined,
        side,
        slippageBps,
      });

      setIsMarketOrderConfirmed(true);
      return result;
    } catch (error) {
      setIsMarketOrderConfirmed(false);
      throw error;
    } finally {
      setIsMarketOrderConfirming(false);
    }
  };

  // Helper function to get slippage info for display
  const getMarketOrderSlippageInfo = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    inputQuantity: bigint,
    side: OrderSideEnum,
    slippageBps: number = 500
  ): Promise<SlippageInfo | null> => {
    try {
      if (inputQuantity <= 0n || !address) return null;

      // For display purposes, we need to convert to base currency quantity for the contract
      let baseCurrencyQuantity: bigint;
      let userDepositAmount: bigint | undefined;

      if (side === OrderSideEnum.BUY) {
        // Convert quote currency input to base currency quantity
        const bestSellPrice = (await readContract(wagmiConfig, {
          address: getContractAddress(effectiveChainId, ContractName.clobRouter) as HexAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1],
          chainId: effectiveChainId,
        })) as BestSellPrice;

        if (bestSellPrice.price === 0n) {
          console.warn('No sell orders available in order book for slippage calculation');
          return null;
        }

        const baseDecimals = await getTokenDecimals(pool.baseCurrency, effectiveChainId);
        baseCurrencyQuantity =
          (inputQuantity * BigInt(10 ** baseDecimals)) / bestSellPrice.price;
        userDepositAmount = inputQuantity;
      } else {
        baseCurrencyQuantity = inputQuantity;
        userDepositAmount = undefined;
      }

      return await calculateSlippageForMarket(
        pool,
        baseCurrencyQuantity,
        side,
        slippageBps,
        effectiveChainId,
        userDepositAmount
      );
    } catch (error) {
      console.error('Failed to calculate slippage info:', error);
      return null;
    }
  };

  return {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
    getMarketOrderSlippageInfo,
    isLimitOrderPending,
    isLimitOrderConfirming,
    isLimitOrderConfirmed,
    isMarketOrderPending,
    isMarketOrderConfirming,
    isMarketOrderConfirmed,
    limitOrderHash,
    marketOrderHash,
    limitSimulateError,
    marketSimulateError,
    resetLimitOrderState,
    resetMarketOrderState,
    // Recovery-related exports
    walletNeedsRecovery,
    handleWalletRecovery,
    isWalletReady,
  };
};
