import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits, parseAbi } from "viem";
import { useChainId } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt } from "wagmi/actions";
import { OrderSideEnum, TimeInForceEnum } from "../../../../../../lib/enums/clob.enum";
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
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(undefined);
  
  // Get the embedded wallet or first connected wallet
  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  const address = userAddress || (wallet?.address as HexAddress);

  const chainId = useChainId()

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
      if (!price) throw new Error("Price is required for buy orders");
      
      const baseDecimals = await getTokenDecimals(baseCurrency);
      return {
        token: quoteCurrency,
        amount: price * quantity / BigInt(10 ** baseDecimals)
      };
    }
    return {
      token: baseCurrency,
      amount: quantity
    };
  };

  const checkBalance = async (token: HexAddress, requiredAmount: bigint, address: HexAddress) => {
    const balance = await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance < requiredAmount) {
      const tokenDecimals = await getTokenDecimals(token);
      const formattedBalance = formatUnits(balance, tokenDecimals);
      const formattedRequired = formatUnits(requiredAmount, tokenDecimals);
      
      const errorMessage = `Insufficient balance. You have ${formattedBalance}, but need ${formattedRequired}.`;
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
          chain: getChain(chainId), // You'll need to import getChain from your wagmi config
          transport: custom(provider),
        });

        const hash = await walletClient.writeContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
        });

        return hash as HexAddress;
      }

      // Method 2: Try the newer getWalletClient method (if available)
      if (typeof wallet.getWalletClient === 'function') {
        const walletClient = await wallet.getWalletClient();

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
    
    const allowance = await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, spender],
    });

    if (allowance < requiredAmount) {
      toast.info('Approving tokens for trading...');
      
      const approvalHash = await writeContractWithPrivy({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, requiredAmount],
      });

      const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: approvalHash
      });

      if (approvalReceipt.status !== 'success') {
        toast.error('Token approval failed');
        throw new Error('Token approval failed');
      }
      
      toast.success('Token approval confirmed');
    }
  };

  const calculateSlippageForMarket = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    quantity: bigint,
    side: OrderSideEnum,
    slippageBps: number = 500,
    chainId: number,
    userDepositAmount?: bigint
  ): Promise<SlippageInfo> => {
    try {
      const routerAddress = getContractAddress(chainId, ContractName.clobRouter) as HexAddress;
      
      let depositAmount: bigint;
      if (side === OrderSideEnum.BUY) {
        depositAmount = userDepositAmount || quantity;
      } else {
        depositAmount = quantity;
      }

      const minOutAmount = await readContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName: 'calculateMinOutAmountForMarket',
        args: [pool, depositAmount, side === OrderSideEnum.BUY ? 0 : 1, slippageBps],
      }) as bigint;
   
      let estimatedPrice: bigint;
      if (side === OrderSideEnum.BUY) {
        const bestSellPrice = await readContract(wagmiConfig, {
          address: routerAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1],
        }) as BestSellPrice;
        estimatedPrice = bestSellPrice.price;
      } else {
        estimatedPrice = minOutAmount * BigInt(10 ** 18) / quantity;
      }
      
      let actualSlippage: number;
      if (side === OrderSideEnum.BUY) {
        const baseDecimals = await getTokenDecimals(pool.baseCurrency);
        const expectedEthTokens = depositAmount * BigInt(10 ** baseDecimals) / estimatedPrice;
        const actualMinTokens = minOutAmount;
        
        if (expectedEthTokens > 0n) {
          actualSlippage = Number((expectedEthTokens - actualMinTokens) * BigInt(10000) / expectedEthTokens) / 100;
        } else {
          actualSlippage = 0;
        }
      } else {
        const bestBuyPrice = await readContract(wagmiConfig, {
          address: routerAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 0], 
        }) as BestSellPrice;
        
        const baseDecimals = await getTokenDecimals(pool.baseCurrency);
        const expectedUSDC = bestBuyPrice.price * quantity / BigInt(10 ** baseDecimals);
        actualSlippage = Number((expectedUSDC - minOutAmount) * BigInt(10000) / expectedUSDC) / 100;
      }
      
      actualSlippage = Math.max(0, actualSlippage);

      const conservativeBufferBps = 50;
      const conservativeMinOut = minOutAmount * BigInt(10000 - conservativeBufferBps) / BigInt(10000);

      const result = {
        minOutAmount,
        conservativeMinOut,
        slippageTolerance: slippageBps / 100,
        actualSlippage,
        estimatedPrice
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
    chainId: number,
    slippageInfo?: SlippageInfo
  ) => {
    const routerAddress = getContractAddress(chainId, ContractName.clobRouter) as HexAddress;
    const sideValue = side === OrderSideEnum.BUY ? 0 : 1;
    
    let functionName: string;
    let args: readonly unknown[];

    if (orderType === 'market') {
      if (!slippageInfo) throw new Error('Slippage info is required for market orders');
      
      const { amount: depositAmount } = await getRequiredTokenAndAmount(
        side, pool.baseCurrency, pool.quoteCurrency, quantity, slippageInfo.estimatedPrice
      );
      
      functionName = 'placeMarketOrder';
      args = [pool, quantity, sideValue, depositAmount, slippageInfo.conservativeMinOut] as const;
    } else {
      if (!price) throw new Error('Price is required for limit orders');
      
      const { amount: requiredAmount } = await getRequiredTokenAndAmount(
        side, pool.baseCurrency, pool.quoteCurrency, quantity, price
      );
      
      functionName = 'placeLimitOrder';
      args = [pool, price, quantity, sideValue, timeInForce, requiredAmount] as const;
    }
    
    if (orderType === 'market') {
      if (side === OrderSideEnum.BUY && address) {
        try {
          const requiredToken = pool.quoteCurrency; 
          const balance = await readContract(wagmiConfig, {
            address: requiredToken,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;
          
          const allowance = await readContract(wagmiConfig, {
            address: requiredToken,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress],
          }) as bigint;
          
          const requiredAmount = functionName === 'placeMarketOrder' ? args[3] as bigint : quantity;
          if (allowance < requiredAmount) {
            throw new Error('Insufficient allowance!');
          }
        } catch (error) {
          console.error('[CONTRACT_CALL] Failed to check user balance/allowance:', error);
          throw error;
        }
      }
    }
    
    // Simulate first with detailed error handling
    try {
      console.log('simulatedContract');
      await simulateContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName,
        args,
      });
    } catch (simulationError: any) {
      console.error('[CONTRACT_CALL] ❌ Simulation failed with detailed error:', {
        error: simulationError,
        errorMessage: simulationError?.message,
        errorCause: simulationError?.cause,
        errorData: simulationError?.data,
        errorCode: simulationError?.code,
        contractCall: {
          address: routerAddress,
          functionName,
          args: args.map(arg => typeof arg === 'bigint' ? arg.toString() : arg)
        }
      });
      
      // Try to extract more specific error information
      if (simulationError?.cause?.data) {
        console.error('[CONTRACT_CALL] 🔍 Raw error data:', simulationError.cause.data);
      }
      
      if (simulationError?.shortMessage) {
        console.error('[CONTRACT_CALL] 📝 Short message:', simulationError.shortMessage);
      }

      // Try a direct static call to get better error info
      try {
        console.log('[CONTRACT_CALL] 🔍 Attempting direct static call for better error details...');
        await readContract(wagmiConfig, {
          address: routerAddress,
          abi: GTXRouterABI,
          functionName,
          args,
        });
      } catch (staticCallError: any) {
        console.error('[CONTRACT_CALL] 🔍 Static call also failed:', {
          staticError: staticCallError,
          staticErrorMessage: staticCallError?.message,
          staticErrorData: staticCallError?.data,
          note: 'This might give us more specific error details'
        });
      }

      // Check if the amounts make sense
      if (orderType === 'market') {
        const depositAmount = args[3] as bigint;
        const minOut = args[4] as bigint;
        const quantity = args[1] as bigint;
        
        console.error('[CONTRACT_CALL] 🚨 Market order parameter analysis:', {
          side: side === OrderSideEnum.BUY ? 'BUY' : 'SELL',
          quantity: quantity.toString(),
          depositAmount: depositAmount.toString(),
          minOut: minOut.toString(),
          suspiciousRatios: {
            quantityVsDeposit: quantity === depositAmount ? 'SAME' : 'DIFFERENT',
            minOutVsDeposit: side === OrderSideEnum.SELL ? 
              `${minOut.toString()} USDC for ${depositAmount.toString()} wei ETH - ratio: ${Number(minOut) / Number(depositAmount)}` :
              'N/A for BUY orders',
            possibleIssue: side === OrderSideEnum.SELL && Number(minOut) < Number(depositAmount) / Number(1000000000000000n) ? 
              'MIN_OUT_TOO_LOW - expecting ~3600 USDC but getting ~3.6 USDC' : 'RATIO_OK'
          }
        });
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
    chainId: number,
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    slippageInfo?: SlippageInfo
  ) => {
    let requiredAmount: bigint;
    
    if (orderType === 'market' && slippageInfo) {
      // For market orders, use the deposit amount calculated with slippage
      const { amount } = await getRequiredTokenAndAmount(
        side, baseCurrency, quoteCurrency, quantity, slippageInfo.estimatedPrice
      );
      requiredAmount = amount;
    } else {
      // For limit orders, use the provided price
      const { amount } = await getRequiredTokenAndAmount(
        side, baseCurrency, quoteCurrency, quantity, price
      );
      requiredAmount = amount;
    }

    // Get the required token for balance checks
    const requiredToken = side === OrderSideEnum.BUY ? quoteCurrency : baseCurrency;

    await checkBalance(requiredToken, requiredAmount, address);
    await ensureAllowance(requiredToken, requiredAmount, address, chainId);
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
        console.log(`Waiting ${delay}ms before retry...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }


  const CreateOrderMutation = (orderType: OrderType, setOrderHash: (hash: HexAddress) => void) => {
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
        originalUsdcAmount
      }: OrderParams) => {
        try {
          // Check if user is authenticated and has a wallet
          if (!user || !wallet || !address) {
            throw new Error('Please connect your wallet first');
          }

          console.log(`Placing ${orderType} order:`, {
            baseCurrency,
            quoteCurrency,
            side,
            quantity: quantity.toString(),
            price: price?.toString(),
            walletType: wallet.walletClientType,
          });

          let slippageInfo: SlippageInfo | undefined;
          
          if (orderType === 'market') {
            const quantityForSlippageCalc = quantity;
              
            const userDepositAmount = side === OrderSideEnum.BUY ? originalUsdcAmount : undefined;
            
            slippageInfo = await calculateSlippageForMarket(
              pool,
              quantityForSlippageCalc,
              side,
              slippageBps,
              chainId,
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
            chainId,
            pool,
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
            chainId,
            slippageInfo
          );

          setOrderHash(hash);
          toast.success(`${orderType} order submitted. Waiting for confirmation...`);

          const receipt = await waitForTransactionReceiptWithRetry(hash, {
            maxAttempts: 5,
            initialDelay: 2000, 
            maxDelay: 10000,   
            timeout: 120000    
          });

          if (receipt && receipt.status === 'success') {
            toast.success(`${orderType} order confirmed successfully!`);
            return receipt;
          } else {
            toast.error('Transaction failed on-chain');
            throw new Error('Transaction failed on-chain');
          }

        } catch (error) {
          console.error(`${orderType} order error:`, error);
          
          // Handle specific error cases with enhanced detection
          if (error instanceof Error) {
            const errorStr = error.toString();
            const errorMessage = error.message || '';
            
            // Check for common revert reasons
            if (errorStr.includes('0xfb8f41b2')) {
              toast.error("Insufficient balance for this order. Please deposit more funds.");
            } else if (errorStr.includes('SlippageTooHigh')) {
              toast.error("Order failed due to high slippage. Try again with higher slippage tolerance or smaller amount.");
            } else if (errorStr.includes('InsufficientLiquidity')) {
              toast.error("Insufficient liquidity in the order book for this order size.");
            } else if (errorStr.includes('InvalidPool')) {
              toast.error("Invalid trading pool. Please refresh and try again.");
            } else if (errorStr.includes('TransactionReceiptNotFoundError')) {
              toast.error("Transaction is taking longer than expected. Please check your transaction status manually.");
            } else if (errorStr.includes('reverted') && !errorStr.includes('reason')) {
              // Generic revert without specific reason
              toast.error(`Contract execution failed. This might be due to insufficient balance, slippage, or market conditions. Check console for details.`);
            } else {
              toast.error(error.message || `Failed to place ${orderType} order`);
            }
            
            // Log additional error context for debugging
            console.error(`[${orderType.toUpperCase()}_ORDER] 🚨 Enhanced error context:`, {
              errorType: error.constructor.name,
              errorMessage: errorMessage,
              isRevertError: errorStr.includes('reverted'),
              hasErrorCode: error.hasOwnProperty('code'),
              errorData: error.hasOwnProperty('data') ? (error as any).data : undefined
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
      timeInForce
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
        const bestSellPrice = await readContract(wagmiConfig, {
          address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1],
        }) as BestSellPrice;
        
        if (bestSellPrice.price === 0n) {
          throw new Error('No sell orders available for market buy order');
        }
        
        // Calculate expected ETH amount (this is just for estimation)
        const baseDecimals = await getTokenDecimals(pool.baseCurrency);
        baseCurrencyQuantity = quoteCurrencyToSpend * BigInt(10 ** baseDecimals) / bestSellPrice.price;

        // CRITICAL FIX: Don't use the estimated quantity for the contract call
        // Let the contract calculate the actual quantity based on available liquidity

        console.log('🔧 BUY Order Debug:', {
          userWantsToSpend: formatUnits(quoteCurrencyToSpend, 6) + ' USDC',
          estimatedETHReceive: formatUnits(baseCurrencyQuantity, 18) + ' ETH',
          currentPrice: formatUnits(bestSellPrice.price, 6) + ' USDC/ETH',
          actualDepositAmount: formatUnits(actualDepositAmount, 6) + ' USDC',
        });
      } catch (error) {
        console.error('Failed to get market price:', error);
        throw new Error('Failed to get current market price');
      }
    } else {
      // SELL order: user specifies how much ETH to sell
      baseCurrencyQuantity = inputQuantity;
      actualDepositAmount = inputQuantity; // For sells, deposit the ETH amount

      console.log('🔧 SELL Order Debug:', {
        userWantsToSell: formatUnits(baseCurrencyQuantity, 18) + ' ETH',
        depositAmount: formatUnits(actualDepositAmount, 18) + ' ETH',
      });
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
        slippageBps
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
        const bestSellPrice = await readContract(wagmiConfig, {
          address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1],
        }) as BestSellPrice;
        
        const baseDecimals = await getTokenDecimals(pool.baseCurrency);
        baseCurrencyQuantity = inputQuantity * BigInt(10 ** baseDecimals) / bestSellPrice.price;
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
        chainId,
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
  };
};