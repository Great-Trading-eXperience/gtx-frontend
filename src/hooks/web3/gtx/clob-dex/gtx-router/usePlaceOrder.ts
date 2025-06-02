import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { OrderSideEnum } from "../../../../../../lib/enums/clob.enum";

export const usePlaceOrder = () => {
  const { address } = useAccount();
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(undefined);

  const chainId = useChainId()

  const resetLimitOrderState = useCallback(() => {
    setLimitOrderHash(undefined);
  }, []);

  const resetMarketOrderState = useCallback(() => {
    setMarketOrderHash(undefined);
  }, []);

  // Mutation for limit orders
  const {
    mutateAsync: placeLimitOrder,
    isPending: isLimitOrderPending,
    isError: isLimitOrderError,
    error: limitSimulateError,
  } = useMutation({
    mutationFn: async ({
      pool,
      baseCurrency,
      quoteCurrency,
      price,
      quantity,
      side,
      withDeposit = false
    }: {
      pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress };
      baseCurrency: HexAddress;
      quoteCurrency: HexAddress;
      orderBook: HexAddress;
      price: bigint;
      quantity: bigint;
      side: OrderSideEnum;
      withDeposit?: boolean;
    }) => {
      try {
        let hash: HexAddress;

        if (withDeposit) {
          try {
            // Check if the user has enough balance first
            let requiredToken: HexAddress;
            let requiredAmount: bigint;

            // For BUY orders, we need the quote currency (e.g., USDC)
            // For SELL orders, we need the base currency (e.g., WETH)
            if (side === OrderSideEnum.BUY) {
              requiredToken = quoteCurrency as HexAddress;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10 ** 18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as HexAddress;
              requiredAmount = quantity;
            }

            console.log(`Checking balance for token: ${requiredToken}, required amount: ${requiredAmount}`);

            // Check user's wallet balance
            const balance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as HexAddress],
            });

            console.log(`User balance: ${balance}, Required: ${requiredAmount}`);

            // If balance is insufficient, stop immediately with helpful message
            if (balance < requiredAmount) {
              const tokenSymbol = side === OrderSideEnum.BUY ? "USDC" : "Asset";
              const tokenDecimals = side === OrderSideEnum.BUY ? 6 : 18; // Adjust based on your tokens

              const formattedBalance = formatUnits(balance, tokenDecimals);
              const formattedRequired = formatUnits(requiredAmount, tokenDecimals);

              const errorMessage = `Insufficient balance. You have ${formattedBalance} ${tokenSymbol}, but need ${formattedRequired} ${tokenSymbol}.`;
              toast.error(errorMessage);
              throw new Error(errorMessage);
            }

            // Check allowance if there's enough balance
            const allowance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [address as HexAddress, getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress],
            });

            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);

            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${getContractAddress(chainId, ContractName.clobBalanceManager)}`);

              try {
                // Execute the approval transaction
                const approvalHash = await writeContract(wagmiConfig, {
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress, requiredAmount],
                });

                console.log('Approval transaction hash:', approvalHash);
                toast.info('Waiting for approval confirmation...');

                // Wait for the approval transaction to be confirmed
                const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
                  hash: approvalHash
                });

                if (approvalReceipt.status === 'success') {
                  toast.success('Token approval confirmed');
                  console.log('Token approval confirmed, proceeding with order');
                } else {
                  toast.error('Token approval failed');
                  throw new Error('Token approval failed');
                }
              } catch (approvalError) {
                console.error('Token approval error:', approvalError);
                toast.error('Token approval failed. Please try again.');
                throw new Error('Failed to approve tokens for trading');
              }
            } else {
              console.log('Sufficient allowance already exists');
            }

            // First simulate the transaction
            const simulation = await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as HexAddress
              ] as const,
            });

            console.log("Simulation result:", simulation.result);

            // If simulation succeeds, execute the transaction
            hash = await writeContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as HexAddress
              ] as const,
            });
          } catch (simulationError: unknown) {
            console.error("Limit order with deposit simulation failed:", simulationError);

            // Check if it's the specific error signature we can't decode
            if (simulationError instanceof Error && simulationError.toString().includes('0xfb8f41b2')) {
              toast.error("Insufficient balance for this order. Please deposit more funds.");
              throw new Error("Insufficient balance for this order. Please deposit more funds.");
            }

            // For any other errors, propagate them
            throw simulationError;
          }
        } else {
          try {
            // For regular limit orders, also check balance and approval
            let requiredToken: HexAddress;
            let requiredAmount: bigint;

            // For BUY orders, we need the quote currency (e.g., USDC)
            // For SELL orders, we need the base currency (e.g., WETH)
            if (side === OrderSideEnum.BUY) {
              requiredToken = quoteCurrency as HexAddress;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10 ** 18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as HexAddress;
              requiredAmount = quantity;
            }

            console.log(`Checking balance for token: ${requiredToken}, required amount: ${requiredAmount}`);

            // Check user's wallet balance
            const balance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as HexAddress],
            });

            console.log(`User balance: ${balance}, Required: ${requiredAmount}`);

            // If balance is insufficient, stop immediately with helpful message
            if (balance < requiredAmount) {
              const tokenSymbol = side === OrderSideEnum.BUY ? "USDC" : "Asset";
              const tokenDecimals = side === OrderSideEnum.BUY ? 6 : 18; // Adjust based on your tokens

              const formattedBalance = formatUnits(balance, tokenDecimals);
              const formattedRequired = formatUnits(requiredAmount, tokenDecimals);

              const errorMessage = `Insufficient balance. You have ${formattedBalance} ${tokenSymbol}, but need ${formattedRequired} ${tokenSymbol}.`;
              toast.error(errorMessage);
              throw new Error(errorMessage);
            }

            // Check allowance if there's enough balance
            const allowance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [address as HexAddress, getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress],
            });

            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);

            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${getContractAddress(chainId, ContractName.clobBalanceManager)}`);

              try {
                // Execute the approval transaction
                const approvalHash = await writeContract(wagmiConfig, {
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress, requiredAmount],
                });

                console.log('Approval transaction hash:', approvalHash);
                toast.info('Waiting for approval confirmation...');

                // Wait for the approval transaction to be confirmed
                const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
                  hash: approvalHash
                });

                if (approvalReceipt.status === 'success') {
                  toast.success('Token approval confirmed');
                  console.log('Token approval confirmed, proceeding with order');
                } else {
                  toast.error('Token approval failed');
                  throw new Error('Token approval failed');
                }
              } catch (approvalError) {
                console.error('Token approval error:', approvalError);
                toast.error('Token approval failed. Please try again.');
                throw new Error('Failed to approve tokens for trading');
              }
            } else {
              console.log('Sufficient allowance already exists');
            }

            // First simulate the transaction
            const simulation = await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as HexAddress
              ] as const,
            });

            console.log("Simulation result:", simulation.result);

            // If simulation succeeds, execute the transaction
            hash = await writeContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as HexAddress
              ] as const,
            });
          } catch (simulationError: unknown) {
            console.error("Limit order simulation failed:", simulationError);

            // Check if it's the specific error signature we can't decode
            if (simulationError instanceof Error && simulationError.toString().includes('0xfb8f41b2')) {
              toast.error("Insufficient balance for this order. Please deposit more funds.");
              throw new Error("Insufficient balance for this order. Please deposit more funds.");
            }

            // For any other errors, propagate them
            throw simulationError;
          }
        }

        setLimitOrderHash(hash);
        toast.success('Limit order submitted. Waiting for confirmation...');

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === 'success') {
          toast.success('Limit order confirmed successfully!');
        } else {
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }

        return receipt;
      } catch (error) {
        console.error('Limit order error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to place limit order');
        throw error;
      }
    },
  });

  // Mutation for market orders
  const {
    mutateAsync: placeMarketOrder,
    isPending: isMarketOrderPending,
    isError: isMarketOrderError,
    error: marketSimulateError,
  } = useMutation({
    mutationFn: async ({
      pool,
      baseCurrency,
      quoteCurrency,
      orderBook,
      quantity,
      side,
      price,
      withDeposit = false
    }: {
      pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress };
      baseCurrency: HexAddress;
      quoteCurrency: HexAddress;
      orderBook: HexAddress;
      quantity: bigint;
      side: OrderSideEnum;
      price?: bigint;
      withDeposit?: boolean;
    }) => {
      try {
        let hash: HexAddress;

        if (withDeposit) {
          if (!price) {
            throw new Error("Price is required for market orders with deposit");
          }

          try {
            // Check if the user has enough balance first
            let requiredToken: HexAddress;
            let requiredAmount: bigint;

            // For BUY orders, we need the quote currency (e.g., USDC)
            // For SELL orders, we need the base currency (e.g., WETH)
            if (side === OrderSideEnum.BUY) {
              requiredToken = quoteCurrency as HexAddress;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = BigInt(quantity) * price / BigInt(10 ** 18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as HexAddress;
              requiredAmount = BigInt(quantity);
            }

            console.log(`Checking balance for token: ${requiredToken}, required amount: ${requiredAmount}`);

            // Check user's wallet balance
            const balance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as HexAddress],
            });

            console.log(`User balance: ${balance}, Required: ${requiredAmount}`);

            // If balance is insufficient, stop immediately with helpful message
            if (balance < requiredAmount) {
              const tokenSymbol = side === OrderSideEnum.BUY ? "USDC" : "Asset";
              const tokenDecimals = side === OrderSideEnum.BUY ? 6 : 18; // Adjust based on your tokens

              const formattedBalance = formatUnits(balance, tokenDecimals);
              const formattedRequired = formatUnits(requiredAmount, tokenDecimals);

              const errorMessage = `Insufficient balance. You have ${formattedBalance} ${tokenSymbol}, but need ${formattedRequired} ${tokenSymbol}.`;
              toast.error(errorMessage);
              throw new Error(errorMessage);
            }

            // Check allowance if there's enough balance
            const allowance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [address as HexAddress, getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress],
            });

            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);

            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${getContractAddress(chainId, ContractName.clobBalanceManager)}`);

              try {
                // Execute the approval transaction
                const approvalHash = await writeContract(wagmiConfig, {
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress, requiredAmount],
                });

                console.log('Approval transaction hash:', approvalHash);
                toast.info('Waiting for approval confirmation...');

                // Wait for the approval transaction to be confirmed
                const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
                  hash: approvalHash
                });

                if (approvalReceipt.status === 'success') {
                  toast.success('Token approval confirmed');
                  console.log('Token approval confirmed, proceeding with order');
                } else {
                  toast.error('Token approval failed');
                  throw new Error('Token approval failed');
                }
              } catch (approvalError) {
                console.error('Token approval error:', approvalError);
                toast.error('Token approval failed. Please try again.');
                throw new Error('Failed to approve tokens for trading');
              }
            } else {
              console.log('Sufficient allowance already exists');
            }

            // First simulate the transaction
            const simulation = await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
              abi: GTXRouterABI,
              functionName: 'placeMarketOrderWithDeposit',
              args: [
                pool,
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as HexAddress
              ] as const,
            });

            console.log("Simulation result:", simulation.result);

            // If simulation succeeds, execute the transaction
            hash = await writeContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
              abi: GTXRouterABI,
              functionName: 'placeMarketOrderWithDeposit',
              args: [
                {
                  baseCurrency,
                  quoteCurrency,
                  orderBook
                },
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as HexAddress
              ] as const,
            });
          } catch (simulationError: unknown) {
            console.error("Market order with deposit simulation failed:", simulationError);

            // Check if it's the specific error signature we can't decode
            if (simulationError instanceof Error && simulationError.toString().includes('0xfb8f41b2')) {
              toast.error("Insufficient balance for this order. Please deposit more funds.");
              throw new Error("Insufficient balance for this order. Please deposit more funds.");
            }

            // For any other errors, propagate them
            throw simulationError;
          }
        } else {
          // First simulate the transaction
          const simulation = await simulateContract(wagmiConfig, {
            address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
            abi: GTXRouterABI,
            functionName: 'placeMarketOrder',
            args: [
              {
                baseCurrency,
                quoteCurrency,
                orderBook
              },
              BigInt(quantity),
              side === OrderSideEnum.BUY ? 0 : 1,
              address as HexAddress
            ] as const,
          });

          console.log("Simulation result:", simulation.result);

          // If simulation succeeds, execute the transaction
          hash = await writeContract(wagmiConfig, {
            address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
            abi: GTXRouterABI,
            functionName: 'placeMarketOrder',
            args: [
              {
                baseCurrency,
                quoteCurrency,
                orderBook
              },
              BigInt(quantity),
              side === OrderSideEnum.BUY ? 0 : 1,
              address as HexAddress
            ] as const,
          });
        }


        setMarketOrderHash(hash);
        toast.success('Market order submitted. Waiting for confirmation...');

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === 'success') {
          toast.success('Market order confirmed successfully!');
        } else {
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }

        return receipt;
      } catch (error) {
        console.error('Market order error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to place market order');
        throw error;
      }
    },
  });

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