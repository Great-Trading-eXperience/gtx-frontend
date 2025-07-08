import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { OrderSideEnum, TimeInForceEnum } from "../../../../../../lib/enums/clob.enum";
// Helper function to get token decimals
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
    // Default to 18 decimals if we can't fetch
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
  withDeposit?: boolean;
}

interface BestSellPrice {
  price: bigint;
  volume: bigint;
}

export const usePlaceOrder = (userAddress?: HexAddress) => {
  const { address: wagmiAddress } = useAccount();
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(undefined);
  
  // Use provided address or fall back to wagmi address
  const address = userAddress || wagmiAddress;

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

  const writeContractSafe = async (contractCall: any) => {
    // Use Wagmi writeContract - Privy should now work as a connector
    return await writeContract(wagmiConfig, contractCall);
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
        account: address,
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

  const checkOrderBookLiquidity = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    chainId: number
  ) => {
    try {
      const bestSellPrice = await readContract(wagmiConfig, {
        address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
        abi: GTXRouterABI,
        functionName: 'getBestPrice',
        args: [pool.baseCurrency, pool.quoteCurrency, 1],
      }) as BestSellPrice;

      if (bestSellPrice.price === 0n) {
        toast.error('No liquidity available - no sell orders in the order book');
        throw new Error('No sell orders available for market buy order');
      }
    } catch (error) {
      console.error('Failed to check order book liquidity:', error);
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
    withDeposit: boolean
  ) => {
    const routerAddress = getContractAddress(chainId, ContractName.clobRouter) as HexAddress;
    const sideValue = side === OrderSideEnum.BUY ? 0 : 1;
    
    let functionName: string;
    let args: readonly unknown[];

    if (orderType === 'market') {
      functionName = withDeposit ? 'placeMarketOrderWithDeposit' : 'placeMarketOrder';
      args = [pool, quantity, sideValue] as const;
    } else {
      if (!price) throw new Error('Price is required for limit orders');
      functionName = withDeposit ? 'placeOrderWithDeposit' : 'placeOrder';
      args = [pool, price, quantity, sideValue, timeInForce] as const;
    }

    // Simulate first
    await simulateContract(wagmiConfig, {
      address: routerAddress,
      abi: GTXRouterABI,
      functionName,
      args,
    });

    // Execute if simulation passes
    return await writeContractSafe({
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
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress }
  ) => {
    const { token: requiredToken, amount: requiredAmount } = await getRequiredTokenAndAmount(
      side, baseCurrency, quoteCurrency, quantity, price
    );

    await checkBalance(requiredToken, requiredAmount, address);
    await ensureAllowance(requiredToken, requiredAmount, address, chainId);

    // Only check liquidity for market orders
    if (orderType === 'market') {
      await checkOrderBookLiquidity(pool, chainId);
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

        console.log(`Attempt ${attempt}/${maxAttempts} to get transaction receipt for ${hash}`);
        
        const receipt = await waitForTransactionReceipt(wagmiConfig, { 
          hash,
          timeout: Math.min(20000, timeout - (Date.now() - startTime)) // Dynamic timeout
        });
        
        return receipt;
        
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error);
        
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
        withDeposit = false
      }: OrderParams) => {
        try {
          console.log(`Placing ${orderType} order:`, {
            baseCurrency,
            quoteCurrency,
            side,
            quantity: quantity.toString(),
            price: price?.toString()
          });

          // Handle balance checks and approvals for both withDeposit and regular orders
          await handlePreOrderChecks(
            orderType,
            side,
            baseCurrency,
            quoteCurrency,
            quantity,
            price,
            address as HexAddress,
            chainId,
            pool
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
            withDeposit
          );

          setOrderHash(hash);
          toast.success(`${orderType} order submitted. Waiting for confirmation...`);

          // const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, });
          // Enhanced receipt waiting with timeout and retry logic
          const receipt = await waitForTransactionReceiptWithRetry(hash, {
            maxAttempts: 5,
            initialDelay: 2000, // 2 seconds
            maxDelay: 10000,    // 10 seconds
            timeout: 120000     // 2 minutes total timeout
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
          
          // Handle specific error cases
          if (error instanceof Error) {
            const errorStr = error.toString();
            if (errorStr.includes('0xfb8f41b2')) {
              toast.error("Insufficient balance for this order. Please deposit more funds.");
            } else if (errorStr.includes('TransactionReceiptNotFoundError')) {
              toast.error("Transaction is taking longer than expected. Please check your transaction status manually.");
            } else {
              toast.error(error.message || `Failed to place ${orderType} order`);
            }
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
    isError: isMarketOrderError,
    error: marketSimulateError,
  } = CreateOrderMutation('market', setMarketOrderHash);

  // Limit Order Hook
  const {
    mutateAsync: placeLimitOrder,
    isPending: isLimitOrderPending,
    isError: isLimitOrderError,
    error: limitSimulateError,
  } = CreateOrderMutation('limit', setLimitOrderHash);

  // Transaction confirmation states
  const {
    data: limitOrderReceipt,
    isLoading: isLimitOrderConfirming,
    isSuccess: isLimitOrderConfirmed,
  } = useWaitForTransactionReceipt({
    hash: limitOrderHash, // Only pass the hash, no enabled option
  });

  const {
    data: marketOrderReceipt,
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
    timeInForce: TimeInForceEnum = TimeInForceEnum.GTC,
    withDeposit: boolean = false
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
      timeInForce,
      withDeposit
    });
  };

  const handlePlaceMarketOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    quantity: bigint,
    side: OrderSideEnum,
    price?: bigint,
    withDeposit: boolean = false
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    if (quantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    console.log('handlePlaceMarketOrder called with:', {
      pool,
      quantity,
      side,
      price,
      withDeposit
    });

    return placeMarketOrder({
      pool,
      baseCurrency: pool.baseCurrency,
      quoteCurrency: pool.quoteCurrency,
      orderBook: pool.orderBook,
      quantity,
      side,
      price,
      withDeposit
    });
  };

  return {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
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