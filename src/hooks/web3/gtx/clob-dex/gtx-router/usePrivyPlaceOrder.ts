import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';
import GTXRouterABI from '@/abis/gtx/clob/GTXRouterABI';
import { useToast } from '@/_components/toastContext';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { getCoreChain, isFeatureEnabled } from '@/constants/features/features-config';
import { HexAddress } from '@/types/general/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createWalletClient, custom, erc20Abi, formatUnits } from 'viem';
import { useChainId, useReadContract } from 'wagmi';
import { readContract, waitForTransactionReceipt } from 'wagmi/actions';

// ============================================================================
// Types & Interfaces
// ============================================================================
enum OrderSideEnum {
  BUY = 0,
  SELL = 1,
}

enum TimeInForceEnum {
  GTC = 0, // Good Till Cancel
  IOC = 1, // Immediate Or Cancel
  FOK = 2, // Fill Or Kill
}

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

// ============================================================================
// Helper Functions
// ============================================================================

const getEffectiveChainId = (currentChainId: number): number => {
  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  return crosschainEnabled ? getCoreChain() : currentChainId;
};

const getTokenDecimals = async (
  tokenAddress: HexAddress,
  chainId?: number
): Promise<number> => {
  try {
    const effectiveChainId = chainId || getCoreChain();
    const decimals = await readContract(wagmiConfig, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
      chainId: effectiveChainId,
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

const getRpcUrl = (chainId: number, wagmiChain: any): string => {
  const rpcMapping: Record<number, string> = {
    4661: 'https://appchain.caff.testnet.espresso.network',
    1918988905: 'https://testnet.rpc.rarichain.org/http',
    11155931: 'https://testnet.riselabs.xyz',
    911867: 'https://odyssey.ithaca.xyz',
  };
  return rpcMapping[chainId] || wagmiChain.rpcUrls.default.http[0];
};

function mockGetBestSellPrice(): {
  price: bigint;
  quantity: bigint;
} {
  // Price: 1 USDC = 1 token (1000000 = 1 USDC with 6 decimals)
  // Random price between 0.95 - 1.05 USDC
  const basePrice = 1000000n; // 1 USDC
  const randomVariation = BigInt(Math.floor(Math.random() * 100000 - 50000)); // ±0.05 USDC

  return {
    price: basePrice + randomVariation,
    quantity: 1000000000000000000n, // 1 token available (18 decimals)
  };
}

interface SlippageInfo {
  minOutAmount: bigint;
  conservativeMinOut: bigint;
  slippageTolerance: number;
  actualSlippage: number;
  estimatedPrice: bigint;
}

// Mock orderbook data from the image
const MOCK_ORDERBOOK = {
  asks: [
    { price: 3830.0, size: 1.449947 },
    { price: 3820.0, size: 0.027414 },
    { price: 3800.0, size: 0.562736 },
  ],
  bids: [
    { price: 3800.0, size: 0.7578 },
    { price: 3790.0, size: 0.1102 },
    { price: 3780.0, size: 0.1374 },
    { price: 3750.0, size: 0.5 },
  ],
};

interface Pool {
  baseCurrency: string;
  quoteCurrency: string;
  orderBook: string;
}

// Mock helper to get best buy price (bid)
function mockGetBestBuyPrice(): { price: bigint } {
  // Best bid price (highest buy order) in USDC with 18 decimals
  const bestBidPrice = MOCK_ORDERBOOK.bids[0].price;
  const priceWith18Decimals = BigInt(Math.floor(bestBidPrice * Math.pow(10, 18)));

  return { price: priceWith18Decimals };
}

// Mock function to calculate minimum out amount with slippage
async function mockCalculateMinOutAmountForMarket(
  pool: Pool,
  depositAmount: bigint,
  side: 0 | 1, // 0 = BUY, 1 = SELL
  slippageBps: number
): Promise<bigint> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const USDC_DECIMALS = 6;
  const TOKEN_DECIMALS = 18;

  let minOutAmount: bigint;

  if (side === 0) {
    // BUY: USDC (6 decimals) -> Token (18 decimals)
    // Use best ask price
    const bestAskPrice = MOCK_ORDERBOOK.asks[MOCK_ORDERBOOK.asks.length - 1].price;

    // Convert depositAmount from USDC to readable format
    const usdcAmount = Number(depositAmount) / Math.pow(10, USDC_DECIMALS);

    // Calculate tokens to receive at best ask price
    const tokensReceived = usdcAmount / bestAskPrice;

    // Convert to 18 decimals
    minOutAmount = BigInt(Math.floor(tokensReceived * Math.pow(10, TOKEN_DECIMALS)));
  } else {
    // SELL: Token (18 decimals) -> USDC (6 decimals)
    // Use best bid price
    const bestBidPrice = MOCK_ORDERBOOK.bids[0].price;

    // Convert depositAmount from Token to readable format
    const tokenAmount = Number(depositAmount) / Math.pow(10, TOKEN_DECIMALS);

    // Calculate USDC to receive at best bid price
    const usdcReceived = tokenAmount * bestBidPrice;

    // Convert to 6 decimals
    minOutAmount = BigInt(Math.floor(usdcReceived * Math.pow(10, USDC_DECIMALS)));
  }

  // Apply slippage tolerance (reduce output)
  const slippageMultiplier = 10000 - slippageBps;
  minOutAmount = (minOutAmount * BigInt(slippageMultiplier)) / 10000n;

  return minOutAmount;
}

// Mock token decimals
async function mockGetTokenDecimals(
  tokenAddress: string,
  chainId: number
): Promise<number> {
  await new Promise(resolve => setTimeout(resolve, 100));

  // Assume base token has 18 decimals (typical for most tokens)
  return 18;
}

// Main mock function matching your calculateSlippageForMarket
const mockCalculateSlippageForMarket = async (
  pool: Pool,
  quantity: bigint,
  side: OrderSideEnum,
  slippageBps: number,
  targetChainId: number,
  userDepositAmount?: bigint
): Promise<SlippageInfo> => {
  // Determine deposit amount based on side
  const depositAmount =
    side === OrderSideEnum.BUY ? userDepositAmount || quantity : quantity;

  // Get min out amount (simulating contract call)
  const minOutAmount = await mockCalculateMinOutAmountForMarket(
    pool,
    depositAmount,
    side === OrderSideEnum.BUY ? 0 : 1,
    slippageBps
  );

  let estimatedPrice: bigint;

  if (side === OrderSideEnum.BUY) {
    // Get best sell price (ask)
    const bestSellPrice = mockGetBestSellPrice();
    estimatedPrice = bestSellPrice.price;
  } else {
    // Calculate estimated price from minOutAmount
    if (quantity === 0n) throw new Error('Invalid quantity for market sell order');
    estimatedPrice = (minOutAmount * BigInt(10 ** 18)) / quantity;
  }

  // Get base token decimals
  const baseDecimals = await mockGetTokenDecimals(pool.baseCurrency, targetChainId);
  let actualSlippage = 0;

  if (side === OrderSideEnum.BUY) {
    // Calculate expected tokens at estimated price
    const expectedTokens = (depositAmount * BigInt(10 ** baseDecimals)) / estimatedPrice;

    if (expectedTokens > 0n) {
      actualSlippage =
        Number(((expectedTokens - minOutAmount) * BigInt(10000)) / expectedTokens) / 100;
    }
  } else {
    // Get best buy price (bid) for sell orders
    const bestBuyPrice = mockGetBestBuyPrice();

    if (bestBuyPrice.price > 0n) {
      const expectedUSDC = (bestBuyPrice.price * quantity) / BigInt(10 ** baseDecimals);

      if (expectedUSDC > 0n) {
        actualSlippage =
          Number(((expectedUSDC - minOutAmount) * BigInt(10000)) / expectedUSDC) / 100;
      }
    }
  }

  // Apply additional 0.5% buffer for conservative estimate
  const conservativeMinOut = (minOutAmount * BigInt(9950)) / BigInt(10000);

  console.log('Mock Slippage Calculation:', {
    minOutAmount: minOutAmount.toString(),
    conservativeMinOut: conservativeMinOut.toString(),
    slippageTolerance: slippageBps / 100,
    actualSlippage: Math.max(0, actualSlippage),
    estimatedPrice: estimatedPrice.toString(),
  });

  return {
    minOutAmount,
    conservativeMinOut,
    slippageTolerance: slippageBps / 100,
    actualSlippage: Math.max(0, actualSlippage),
    estimatedPrice,
  };
};

// ============================================================================
// Main Hook
// ============================================================================

export const usePlaceOrder = (userAddress?: HexAddress) => {
  const { showToast, updateToast } = useToast();
  const { wallets } = useWallets();
  const currentChainId = useChainId();
  const effectiveChainId = getEffectiveChainId(currentChainId);

  const [walletNeedsRecovery, setWalletNeedsRecovery] = useState(false);
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress>();
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress>();
  const [isLimitOrderConfirming, setIsLimitOrderConfirming] = useState(false);
  const [isLimitOrderConfirmed, setIsLimitOrderConfirmed] = useState(false);
  const [isMarketOrderConfirming, setIsMarketOrderConfirming] = useState(false);
  const [isMarketOrderConfirmed, setIsMarketOrderConfirmed] = useState(false);

  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  const address = userAddress || (wallet?.address as HexAddress);

  useEffect(() => {
    if (wallets.find(w => w.walletClientType === 'privy')) {
      setWalletNeedsRecovery(false);
    }
  }, [wallets]);

  // ============================================================================
  // Wallet Utilities
  // ============================================================================

  const isWalletReady = () => {
    return wallet && address && !walletNeedsRecovery;
  };

  const handleWalletRecovery = async () => {
    toast.error(
      'Please recover your wallet manually through the Privy interface, then try again.'
    );
    setWalletNeedsRecovery(false);
  };

  const switchWalletChain = async (targetChainId: number) => {
    if (!wallet) throw new Error('No wallet connected');

    try {
      await wallet.switchChain(targetChainId);
    } catch (error) {
      const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');

      if (crosschainEnabled && targetChainId === 1918988905) {
        const wagmiChain = wagmiConfig.chains.find(chain => chain.id === targetChainId);
        if (!wagmiChain)
          throw new Error(`Chain configuration not found for chain ID ${targetChainId}`);

        const provider = await wallet.getEthereumProvider();
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: wagmiChain.name,
              nativeCurrency: wagmiChain.nativeCurrency,
              rpcUrls: [getRpcUrl(targetChainId, wagmiChain)],
              blockExplorerUrls: wagmiChain.blockExplorers
                ? [wagmiChain.blockExplorers.default.url]
                : [],
            },
          ],
        });

        await wallet.switchChain(targetChainId);
      } else {
        throw error;
      }
    }
  };

  // ============================================================================
  // Balance & Allowance Operations
  // ============================================================================

  const getBalance = async (
    token: HexAddress,
    userAddress: HexAddress
  ): Promise<bigint> => {
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');

    if (crosschainEnabled) {
      const balanceManagerAddress = getContractAddress(
        effectiveChainId,
        ContractName.clobBalanceManager
      ) as HexAddress;

      return (await readContract(wagmiConfig, {
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'getBalance',
        args: [userAddress, token],
        chainId: effectiveChainId,
      })) as bigint;
    }

    return (await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
      chainId: effectiveChainId,
    })) as bigint;
  };

  const checkBalance = async (
    token: HexAddress,
    requiredAmount: bigint,
    userAddress: HexAddress
  ) => {
    const balance = await getBalance(token, userAddress);

    if (balance < requiredAmount) {
      const tokenDecimals = await getTokenDecimals(token, effectiveChainId);
      const balanceSource = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED')
        ? 'Balance Manager'
        : 'ERC20';

      const errorMessage = `Insufficient ${balanceSource} balance. You have ${formatUnits(
        balance,
        tokenDecimals
      )}, but need ${formatUnits(requiredAmount, tokenDecimals)}.`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const ensureAllowance = async (
    token: HexAddress,
    requiredAmount: bigint,
    userAddress: HexAddress,
    targetChainId: number
  ) => {
    const spender = getContractAddress(
      targetChainId,
      ContractName.clobBalanceManager
    ) as HexAddress;

    const allowance = (await readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [userAddress, spender],
      chainId: targetChainId,
    })) as bigint;

    console.log(allowance);

    if (allowance < requiredAmount) {
      toast.info('Approving tokens for trading...');

      const approvalHash = await writeContractWithPrivy({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, requiredAmount],
      });

      console.log(approvalHash);

      const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: approvalHash,
        chainId: targetChainId,
      });

      if (approvalReceipt.status !== 'success') {
        toast.error('Token approval failed');
        throw new Error('Token approval failed');
      }

      toast.success('Token approval confirmed');
    }
  };

  // ============================================================================
  // Contract Interaction
  // ============================================================================

  const writeContractWithPrivy = async (contractCall: {
    address: HexAddress;
    abi: any;
    functionName: string;
    args: readonly unknown[];
  }): Promise<HexAddress> => {
    if (!isWalletReady()) {
      throw new Error(
        walletNeedsRecovery ? 'Wallet recovery required' : 'Wallet not ready'
      );
    }

    const targetChainId = getEffectiveChainId(currentChainId);
    await switchWalletChain(targetChainId);

    // Try Method 1: getEthereumProvider
    if ('getEthereumProvider' in wallet) {
      try {
        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({
          account: address,
          chain: getChain(targetChainId),
          transport: custom(provider),
        });

        const hash = await walletClient.writeContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
        });

        return hash as HexAddress;
      } catch (error) {
        console.error('Method 1 (getEthereumProvider) failed:', error);
      }
    }

    // Try Method 2: getWalletClient
    if (
      'getWalletClient' in wallet &&
      typeof (wallet as any).getWalletClient === 'function'
    ) {
      try {
        const walletClient = await (wallet as any).getWalletClient();
        const hash = await walletClient.writeContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
        });

        return hash as HexAddress;
      } catch (error) {
        console.error('Method 2 (getWalletClient) failed:', error);
      }
    }

    throw new Error('All Privy transaction methods failed');
  };

  // ============================================================================
  // Order Execution
  // ============================================================================

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
    return { token: baseCurrency, amount: quantity };
  };

  const calculateSlippageForMarket = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    quantity: bigint,
    side: OrderSideEnum,
    slippageBps: number,
    targetChainId: number,
    userDepositAmount?: bigint
  ): Promise<SlippageInfo> => {
    const routerAddress = getContractAddress(
      targetChainId,
      ContractName.clobRouter
    ) as HexAddress;
    const depositAmount =
      side === OrderSideEnum.BUY ? userDepositAmount || quantity : quantity;

    const minOutAmount = (await readContract(wagmiConfig, {
      address: routerAddress,
      abi: GTXRouterABI,
      functionName: 'calculateMinOutAmountForMarket',
      args: [pool, depositAmount, side === OrderSideEnum.BUY ? 0 : 1, slippageBps],
      chainId: targetChainId,
    })) as bigint;

    let estimatedPrice: bigint;

    if (side === OrderSideEnum.BUY) {
      /*
      const bestSellPrice = (await readContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName: 'getBestPrice',
        args: [pool.baseCurrency, pool.quoteCurrency, 1],
        chainId: targetChainId,
      })) as BestSellPrice;

      if (bestSellPrice.price === 0n) {
        throw new Error('No sell orders available for market buy order');
      }
        */
      const bestSellPrice = mockGetBestSellPrice();
      estimatedPrice = bestSellPrice.price;
    } else {
      if (quantity === 0n) throw new Error('Invalid quantity for market sell order');
      estimatedPrice = (minOutAmount * BigInt(10 ** 18)) / quantity;
    }

    const baseDecimals = await getTokenDecimals(pool.baseCurrency, targetChainId);
    let actualSlippage = 0;

    if (side === OrderSideEnum.BUY) {
      const expectedTokens =
        (depositAmount * BigInt(10 ** baseDecimals)) / estimatedPrice;
      if (expectedTokens > 0n) {
        actualSlippage =
          Number(((expectedTokens - minOutAmount) * BigInt(10000)) / expectedTokens) /
          100;
      }
    } else {
      const bestBuyPrice = (await readContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName: 'getBestPrice',
        args: [pool.baseCurrency, pool.quoteCurrency, 0],
        chainId: targetChainId,
      })) as BestSellPrice;

      if (bestBuyPrice.price > 0n) {
        const expectedUSDC = (bestBuyPrice.price * quantity) / BigInt(10 ** baseDecimals);
        if (expectedUSDC > 0n) {
          actualSlippage =
            Number(((expectedUSDC - minOutAmount) * BigInt(10000)) / expectedUSDC) / 100;
        }
      }
    }

    const conservativeMinOut = (minOutAmount * BigInt(9950)) / BigInt(10000);
    console.log(
      minOutAmount,
      conservativeMinOut,
      slippageBps / 100,
      Math.max(0, actualSlippage),
      estimatedPrice
    );

    return {
      minOutAmount,
      conservativeMinOut,
      slippageTolerance: slippageBps / 100,
      actualSlippage: Math.max(0, actualSlippage),
      estimatedPrice,
    };
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
    const routerAddress = getContractAddress(
      targetChainId,
      ContractName.clobRouter
    ) as HexAddress;
    const sideValue = side === OrderSideEnum.BUY ? 0 : 1;
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');

    let functionName: string;
    let args: readonly unknown[];

    if (orderType === 'market') {
      if (!slippageInfo) throw new Error('Slippage info required for market orders');

      const { amount: requiredAmount } = await getRequiredTokenAndAmount(
        side,
        pool.baseCurrency,
        pool.quoteCurrency,
        quantity,
        slippageInfo.estimatedPrice
      );

      functionName = 'placeMarketOrder';
      args = [
        pool,
        quantity,
        sideValue,
        crosschainEnabled ? 0n : requiredAmount,
        slippageInfo.conservativeMinOut,
      ];
    } else {
      if (!price) throw new Error('Price required for limit orders');

      const { amount: requiredAmount } = await getRequiredTokenAndAmount(
        side,
        pool.baseCurrency,
        pool.quoteCurrency,
        quantity,
        price
      );

      functionName = 'placeLimitOrder';
      args = [
        pool,
        price,
        quantity,
        sideValue,
        timeInForce,
        crosschainEnabled ? 0n : requiredAmount,
      ];
    }

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
    userAddress: HexAddress,
    targetChainId: number,
    slippageInfo?: SlippageInfo
  ) => {
    // const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
    // if (crosschainEnabled) return;

    console.log('checking');

    const { token, amount } =
      orderType === 'market' && slippageInfo
        ? await getRequiredTokenAndAmount(
            side,
            baseCurrency,
            quoteCurrency,
            quantity,
            slippageInfo.estimatedPrice
          )
        : await getRequiredTokenAndAmount(
            side,
            baseCurrency,
            quoteCurrency,
            quantity,
            price
          );

    console.log(token, amount);

    await checkBalance(token, amount, userAddress);
    await ensureAllowance(token, amount, userAddress, targetChainId);
  };

  // ============================================================================
  // Mutation Creation
  // ============================================================================

  const createOrderMutation = (
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

        console.log('Execute');

        try {
          if (!isWalletReady()) {
            throw new Error(
              walletNeedsRecovery ? 'Wallet needs recovery' : 'Connect wallet first'
            );
          }

          let slippageInfo: SlippageInfo | undefined;
          if (orderType === 'market') {
            slippageInfo = await calculateSlippageForMarket(
              pool,
              quantity,
              side,
              slippageBps,
              effectiveChainId,
              side === OrderSideEnum.BUY ? originalUsdcAmount : undefined
            );
          }
          

          // With this (for testing):
          // let slippageInfo: SlippageInfo | undefined;
          // if (orderType === 'market') {
          //   slippageInfo = await mockCalculateSlippageForMarket(
          //     pool,
          //     quantity,
          //     side,
          //     slippageBps,
          //     effectiveChainId,
          //     side === OrderSideEnum.BUY ? originalUsdcAmount : undefined
          //   );
          // }

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

          const receipt = await waitForTransactionReceipt(wagmiConfig, {
            hash,
            chainId: effectiveChainId,
          });

          if (receipt.status === 'success') {
            updateToast(toastId, { type: 'success', message: 'Place Order successful!' });
            return receipt;
          }

          throw new Error('Transaction failed on-chain');
        } catch (error: any) {
          const errorStr = error.toString();
          const errorMessage = errorStr.includes('insufficient funds')
            ? 'Insufficient gas funds'
            : errorStr.includes('SlippageTooHigh')
            ? 'Slippage too high'
            : errorStr.includes('InsufficientLiquidity')
            ? 'Insufficient liquidity'
            : error.message || 'Order failed';

          updateToast(toastId, { type: 'error', message: errorMessage });
          throw error;
        }
      },
    });
  };

  const {
    mutateAsync: placeMarketOrder,
    isPending: isMarketOrderPending,
    error: marketSimulateError,
  } = createOrderMutation('market', setMarketOrderHash);

  const {
    mutateAsync: placeLimitOrder,
    isPending: isLimitOrderPending,
    error: limitSimulateError,
  } = createOrderMutation('limit', setLimitOrderHash);

  // ============================================================================
  // Public API
  // ============================================================================

  const handlePlaceLimitOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    price: bigint,
    quantity: bigint,
    side: OrderSideEnum,
    timeInForce: TimeInForceEnum = TimeInForceEnum.GTC
  ) => {
    if (!isWalletReady()) {
      toast.error(walletNeedsRecovery ? 'Wallet needs recovery' : 'Connect wallet first');
      return;
    }

    if (price <= 0n || quantity <= 0n) {
      toast.error('Price and quantity must be greater than zero');
      return;
    }

    setIsLimitOrderConfirming(true);
    setIsLimitOrderConfirmed(false);

    console.log(pool, price, quantity, side, timeInForce);
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
    } finally {
      setIsLimitOrderConfirming(false);
    }
  };

  const handlePlaceMarketOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    inputQuantity: bigint,
    side: OrderSideEnum,
    slippageBps: number = 500
  ) => {
    if (!isWalletReady()) {
      toast.error(walletNeedsRecovery ? 'Wallet needs recovery' : 'Connect wallet first');
      return;
    }

    if (inputQuantity <= 0n) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    let baseCurrencyQuantity = inputQuantity;
    let actualDepositAmount = inputQuantity;

    if (side === OrderSideEnum.BUY) {
      /*
      const bestSellPrice = (await readContract(wagmiConfig, {
        address: getContractAddress(
          effectiveChainId,
          ContractName.clobRouter
        ) as HexAddress,
        abi: GTXRouterABI,
        functionName: 'getBestPrice',
        args: [pool.baseCurrency, pool.quoteCurrency, 1],
        chainId: effectiveChainId,
      })) as BestSellPrice;

      if (bestSellPrice.price === 0n) {
        throw new Error('No sell orders available');
      }
      */

      const bestSellPrice = mockGetBestSellPrice();

      const baseDecimals = await getTokenDecimals(pool.baseCurrency, effectiveChainId);
      baseCurrencyQuantity =
        (inputQuantity * BigInt(10 ** baseDecimals)) / bestSellPrice.price;
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
    } finally {
      setIsMarketOrderConfirming(false);
    }
  };

  const getMarketOrderSlippageInfo = useCallback(
    async (
      pool: {
        baseCurrency: HexAddress;
        quoteCurrency: HexAddress;
        orderBook: HexAddress;
      },
      inputQuantity: bigint,
      side: OrderSideEnum,
      slippageBps: number = 500
    ): Promise<SlippageInfo | null> => {
      try {
        if (inputQuantity <= 0n || !address) return null;

        let baseCurrencyQuantity = inputQuantity;
        let userDepositAmount: bigint | undefined;

        if (side === OrderSideEnum.BUY) {
          const clobAddress = getContractAddress(
            effectiveChainId,
            ContractName.clobRouter
          ) as HexAddress;

          const bestSellPrice = (await readContract(wagmiConfig, {
            address: clobAddress,
            abi: GTXRouterABI,
            functionName: 'getBestPrice',
            args: [pool.baseCurrency, pool.quoteCurrency, 1],
            chainId: effectiveChainId,
          })) as BestSellPrice;

          console.log('bestSellPrice', bestSellPrice);
          // this is 0n so return null

          if (bestSellPrice.price === 0n) return null;

          const baseDecimals = await getTokenDecimals(
            pool.baseCurrency,
            effectiveChainId
          );
          baseCurrencyQuantity =
            (inputQuantity * BigInt(10 ** baseDecimals)) / bestSellPrice.price;
          userDepositAmount = inputQuantity;
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
        console.error('Failed to calculate slippage:', error);
        return null;
      }
    },
    [address, effectiveChainId]
  );

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
    resetLimitOrderState: useCallback(() => setLimitOrderHash(undefined), []),
    resetMarketOrderState: useCallback(() => setMarketOrderHash(undefined), []),
    walletNeedsRecovery,
    handleWalletRecovery,
    isWalletReady,
  };
};
