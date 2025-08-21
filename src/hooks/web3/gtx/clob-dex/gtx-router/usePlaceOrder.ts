import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
// Removed unused useWallets import
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { OrderSideEnum, TimeInForceEnum } from "../../../../../../lib/enums/clob.enum";

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
  const { address: wagmiAddress } = useAccount();
  // Remove unused wallets import
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(undefined);
  
  const address = wagmiAddress; 

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
      const amount = price * quantity / BigInt(10 ** baseDecimals);
      
      return {
        token: quoteCurrency,
        amount
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

  const writeContractSafe = async (contractCall: any) => {
    
    if (!address) {
      throw new Error('No wallet address available');
    }
    
    try {
      return await writeContract(wagmiConfig, contractCall);
    } catch (error: any) {
      console.error('Wagmi writeContract failed:', error);
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
      
      const approvalHash = await writeContractSafe({
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
    } else {
      console.log('[ALLOWANCE_CHECK] ✅ Allowance check passed');
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
      const simulationResult = await simulateContract(wagmiConfig, {
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

    // Execute if simulation passes
    const txHash = await writeContractSafe({
      address: routerAddress,
      abi: GTXRouterABI,
      functionName,
      args,
    });
    
    return txHash;
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
      const { amount } = await getRequiredTokenAndAmount(
        side, baseCurrency, quoteCurrency, quantity, slippageInfo.estimatedPrice
      );
      requiredAmount = amount;
    } else {
      console.log('[PRE_ORDER_CHECKS] Using limit order pricing');
      const { amount } = await getRequiredTokenAndAmount(
        side, baseCurrency, quoteCurrency, quantity, price
      );
      requiredAmount = amount;
    }

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
          console.error(`[ORDER_MUTATION] ❌ ${orderType} order error:`, error);
          
          // Log additional context for debugging
          console.error(`[ORDER_MUTATION] Error context:`, {
            orderType,
            userAddress: address,
            chainId,
            baseCurrency,
            quoteCurrency,
            side: side === OrderSideEnum.BUY ? 'BUY' : 'SELL',
            quantity: quantity.toString(),
            price: price?.toString()
          });
          
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

  // Transaction confirmation states
  const {
    isLoading: isLimitOrderConfirming,
    isSuccess: isLimitOrderConfirmed,
  } = useWaitForTransactionReceipt({
    hash: limitOrderHash, // Only pass the hash, no enabled option
  });

  const {
    isLoading: isMarketOrderConfirming,
    isSuccess: isMarketOrderConfirmed,
  } = useWaitForTransactionReceipt({
    hash: marketOrderHash, // Only pass the hash, no enabled option
  });

  // Wrapper functions with validation
  const handlePlaceLimitOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    price: bigint,
    quantity: bigint,
    side: OrderSideEnum,
    timeInForce: TimeInForceEnum = TimeInForceEnum.GTC
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
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

    return placeLimitOrder({
      pool,
      baseCurrency: pool.baseCurrency,
      quoteCurrency: pool.quoteCurrency,
      orderBook: pool.orderBook,
      price,
      quantity,
      side,
      timeInForce
    });
  };

  const handlePlaceMarketOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    inputQuantity: bigint, // This is either quote currency (for BUY) or base currency (for SELL)
    side: OrderSideEnum,
    slippageBps: number = 500
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    if (inputQuantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    let baseCurrencyQuantity: bigint; 
    
    if (side === OrderSideEnum.BUY) {
      const quoteCurrencyToSpend = inputQuantity;
      
      try {
        // Get best sell price to convert quote currency to base currency quantity
        const bestSellPrice = await readContract(wagmiConfig, {
          address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
          abi: GTXRouterABI,
          functionName: 'getBestPrice',
          args: [pool.baseCurrency, pool.quoteCurrency, 1], // Get SELL prices for BUY order
        }) as BestSellPrice;
        
        if (bestSellPrice.price === 0n) {
          throw new Error('No sell orders available for market buy order');
        }
        
        // Calculate base currency quantity: quoteCurrencyAmount * 10^baseDecimals / price
        const baseDecimals = await getTokenDecimals(pool.baseCurrency);
        const quoteDecimals = await getTokenDecimals(pool.quoteCurrency);

        baseCurrencyQuantity = quoteCurrencyToSpend * BigInt(10 ** baseDecimals) / bestSellPrice.price;
      } catch (error) {
        console.error('Failed to convert quote currency to base currency quantity:', error);
        throw new Error('Failed to get current market price for conversion');
      }
      
    } else {
      baseCurrencyQuantity = inputQuantity;
    }

    return placeMarketOrder({
      pool,
      baseCurrency: pool.baseCurrency,
      quoteCurrency: pool.quoteCurrency,
      orderBook: pool.orderBook,
      quantity: baseCurrencyQuantity, 
      originalUsdcAmount: side === OrderSideEnum.BUY ? inputQuantity : undefined, 
      side,
      slippageBps
    });
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