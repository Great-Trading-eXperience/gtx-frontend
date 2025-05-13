import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits, encodeFunctionData } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { OrderSideEnum } from "../../../../../../lib/enums/clob.enum";
// Import RISE Chain's sync client
import { createSyncPublicClient, syncTransport } from "rise-shred-client";
import { ethers } from 'ethers';

// Configuration variables for RISE Chain integration
const USE_SHRED_API = true;

export const usePlaceOrder = () => {
  const { address } = useAccount();
  const [limitOrderHash, setLimitOrderHash] = useState<HexAddress | undefined>(undefined);
  const [marketOrderHash, setMarketOrderHash] = useState<HexAddress | undefined>(undefined);

  const chainId = useChainId();

  // Create the RISE Chain sync client only if we're using the shred-api
  const syncClient = USE_SHRED_API ? createSyncPublicClient({
    transport: syncTransport('https://testnet.riselabs.xyz')
  }) : null;
  
  const executeTransaction = async (config: any) => {
    if (USE_SHRED_API && syncClient) {
      try {
        // Simulate the transaction to get necessary data
        const simulationResult = await simulateContract(wagmiConfig, config);
        const { request } = simulationResult;
        
        // Extract contract address and calldata
        const contractAddress = request.address as `0x${string}`;
        const callData = typeof request.data !== 'undefined' ? request.data : encodeFunctionData({ 
          abi: request.abi as any, 
          functionName: request.functionName as string, 
          args: request.args as any[]
        });
        
        const value = request.value || 0n;
        
        // Get transaction parameters using syncClient
        const nonce = await syncClient.getTransactionCount({
          address: address as `0x${string}`,
        });
        
        const gasPrice = await syncClient.getGasPrice();
        
        // Get gas estimate
        let gas = request.gas;
        if (!gas) {
          try {
            gas = await syncClient.estimateGas({
              account: address as `0x${string}`,
              to: contractAddress,
              data: callData,
              value: value,
            });
          } catch (error) {
            console.error('Error estimating gas:', error);
            gas = 500000n;
          }
        }
        
        // Create ethers.js provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await provider.getSigner();
        
        // Format the transaction for ethers
        const transaction = {
          to: contractAddress,
          value: BigInt(value.toString()),
          data: callData,
          gasLimit: BigInt(gas.toString()),
          gasPrice: BigInt(gasPrice.toString()),
          nonce: Number(nonce),
          chainId: Number(chainId)
        };
        
        console.log('Transaction to be signed:', transaction);
        
        // Sign the transaction locally using ethers.js
        // This will use the connected wallet but handle signing locally
        const signedTx = await ethersSigner.signTransaction(transaction);
        
        console.log('Signed transaction:', signedTx);
        
        // Send the raw signed transaction to RISE Chain
        const receipt = await syncClient.sendRawTransactionSync(signedTx as `0x${string}`);
        
        console.log('Transaction confirmed, receipt:', receipt);
        
        return { 
          receipt, 
          hash: receipt.transactionHash as `0x${string}` 
        };
        
      } catch (error: unknown) {
        console.error("Error with RISE Chain transaction:", error);
        
        if (error instanceof Error) {
          console.error({
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else {
          console.error('Unknown error type:', error);
        }
        
        // Fall back to standard approach
        console.log("Falling back to standard transaction...");
        const hash = await writeContract(wagmiConfig, config);
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
        return { receipt, hash };
      }
    } else {
      // Standard approach
      const hash = await writeContract(wagmiConfig, config);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      return { receipt, hash };
    }
  };

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
        if (withDeposit) {
          try {
            // Check if the user has enough balance first
            let requiredToken: HexAddress;
            let requiredAmount: bigint;

            // For BUY orders, we need the quote currency (e.g., USDC)
            // For SELL orders, we need the base currency (e.g., WETH)
            if (side === OrderSideEnum.BUY) {
              requiredToken = quoteCurrency as `0x${string}`;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10 ** 18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as `0x${string}`;
              requiredAmount = quantity;
            }

            console.log(`Checking balance for token: ${requiredToken}, required amount: ${requiredAmount}`);

            // Check user's wallet balance
            const balance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
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
              args: [address as `0x${string}`, getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`],
            });

            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);

            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${getContractAddress(chainId, ContractName.clobBalanceManager)}`);

              try {
                // Execute the approval transaction
                const { hash: approvalHash } = await executeTransaction({
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`, requiredAmount],
                });

                console.log('Approval transaction hash:', approvalHash);

                if (approvalHash) {
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
            await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as `0x${string}`
              ] as const,
            });

            // Show toast for order submission
            toast.success(USE_SHRED_API ?
              'Limit order submitted. Getting immediate confirmation...' :
              'Limit order submitted. Waiting for confirmation...');

            // If simulation succeeds, execute the transaction with our helper
            const { receipt, hash } = await executeTransaction({
              account: address,
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as `0x${string}`
              ] as const,
            });

            setLimitOrderHash(hash);

            if (receipt.status === 'success' || receipt.status.toString() === '0x1') {
              toast.success(USE_SHRED_API ?
                `Limit order confirmed in block: ${receipt.blockNumber}` :
                'Limit order confirmed successfully!');
            } else {
              toast.error('Transaction failed on-chain');
              throw new Error('Transaction failed on-chain');
            }

            return receipt;
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
              requiredToken = quoteCurrency as `0x${string}`;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10 ** 18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as `0x${string}`;
              requiredAmount = quantity;
            }

            console.log(`Checking balance for token: ${requiredToken}, required amount: ${requiredAmount}`);

            // Check user's wallet balance
            const balance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
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
              args: [address as `0x${string}`, getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`],
            });

            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);

            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${getContractAddress(chainId, ContractName.clobBalanceManager)}`);

              try {
                // Execute the approval transaction
                const { hash: approvalHash } = await executeTransaction({
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`, requiredAmount],
                });

                console.log('Approval transaction hash:', approvalHash);

                if (approvalHash) {
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
            await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as `0x${string}`
              ] as const,
            });

            // Show toast for order submission
            toast.success(USE_SHRED_API ?
              'Limit order submitted. Getting immediate confirmation...' :
              'Limit order submitted. Waiting for confirmation...');

            // If simulation succeeds, execute the transaction with our helper
            const { receipt, hash } = await executeTransaction({
              account: address,
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [
                pool,
                BigInt(price),
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as `0x${string}`
              ] as const,
            });

            setLimitOrderHash(hash);

            if (receipt.status === 'success' || receipt.status.toString() === '0x1') {
              toast.success(USE_SHRED_API ?
                `Limit order confirmed in block: ${receipt.blockNumber}` :
                'Limit order confirmed successfully!');
            } else {
              toast.error('Transaction failed on-chain');
              throw new Error('Transaction failed on-chain');
            }

            return receipt;
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
              requiredToken = quoteCurrency as `0x${string}`;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10 ** 18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as `0x${string}`;
              requiredAmount = quantity;
            }

            console.log(`Checking balance for token: ${requiredToken}, required amount: ${requiredAmount}`);

            // Check user's wallet balance
            const balance = await readContract(wagmiConfig, {
              address: requiredToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
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
              args: [address as `0x${string}`, getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`],
            });

            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);

            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${getContractAddress(chainId, ContractName.clobBalanceManager)}`);

              try {
                // Execute the approval transaction
                const { hash: approvalHash } = await executeTransaction({
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`, requiredAmount],
                });

                console.log('Approval transaction hash:', approvalHash);

                if (approvalHash) {
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
            await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeMarketOrderWithDeposit',
              args: [
                pool,
                BigInt(quantity),
                side === OrderSideEnum.BUY ? 0 : 1,
                address as `0x${string}`
              ] as const,
            });

            // Show toast for order submission
            toast.success(USE_SHRED_API ?
              'Market order submitted. Getting immediate confirmation...' :
              'Market order submitted. Waiting for confirmation...');

            // If simulation succeeds, execute the transaction with our helper
            const { receipt, hash } = await executeTransaction({
              account: address,
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
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
                address as `0x${string}`
              ] as const,
            });

            setMarketOrderHash(hash);

            if (receipt.status === 'success' || receipt.status.toString() === '0x1') {
              toast.success(USE_SHRED_API ?
                `Market order confirmed in block: ${receipt.blockNumber}` :
                'Market order confirmed successfully!');
            } else {
              toast.error('Transaction failed on-chain');
              throw new Error('Transaction failed on-chain');
            }

            return receipt;
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
          try {
            // First simulate the transaction
            await simulateContract(wagmiConfig, {
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
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
                address as `0x${string}`
              ] as const,
            });

            // Show toast for order submission
            toast.success(USE_SHRED_API ?
              'Market order submitted. Getting immediate confirmation...' :
              'Market order submitted. Waiting for confirmation...');

            // If simulation succeeds, execute the transaction with our helper
            const { receipt, hash } = await executeTransaction({
              account: address,
              address: getContractAddress(chainId, ContractName.clobRouter) as `0x${string}`,
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
                address as `0x${string}`
              ] as const,
            });

            setMarketOrderHash(hash);

            if (receipt.status === 'success' || receipt.status.toString() === '0x1') {
              toast.success(USE_SHRED_API ?
                `Market order confirmed in block: ${receipt.blockNumber}` :
                'Market order confirmed successfully!');
            } else {
              toast.error('Transaction failed on-chain');
              throw new Error('Transaction failed on-chain');
            }

            return receipt;
          } catch (simulationError: unknown) {
            console.error("Market order simulation failed:", simulationError);

            // Check if it's the specific error signature we can't decode
            if (simulationError instanceof Error && simulationError.toString().includes('0xfb8f41b2')) {
              toast.error("Insufficient balance for this order. Please deposit more funds.");
              throw new Error("Insufficient balance for this order. Please deposit more funds.");
            }

            // For any other errors, propagate them
            throw simulationError;
          }
        }
      } catch (error) {
        console.error('Market order error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to place market order');
        throw error;
      }
    },
  });

  // If using shred-api, we track confirmation states with local state variables
  const [shredLimitOrderConfirmed, setShredLimitOrderConfirmed] = useState(false);
  const [shredMarketOrderConfirmed, setShredMarketOrderConfirmed] = useState(false);
  const [shredLimitOrderConfirming, setShredLimitOrderConfirming] = useState(false);
  const [shredMarketOrderConfirming, setShredMarketOrderConfirming] = useState(false);

  // Transaction confirmation states - use conditionally based on whether we're using shred-api
  const {
    data: limitOrderReceipt,
    isLoading: isLimitOrderConfirming,
    isSuccess: isLimitOrderConfirmed,
  } = !USE_SHRED_API ? useWaitForTransactionReceipt({
    hash: limitOrderHash,
  }) : { data: null, isLoading: false, isSuccess: false };

  const {
    data: marketOrderReceipt,
    isLoading: isMarketOrderConfirming,
    isSuccess: isMarketOrderConfirmed,
  } = !USE_SHRED_API ? useWaitForTransactionReceipt({
    hash: marketOrderHash,
  }) : { data: null, isLoading: false, isSuccess: false };

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

    if (USE_SHRED_API) {
      setShredLimitOrderConfirming(true);
    }

    try {
      const result = await placeLimitOrder({
        pool,
        baseCurrency: pool.baseCurrency,
        quoteCurrency: pool.quoteCurrency,
        orderBook: pool.orderBook,
        price,
        quantity,
        side,
        withDeposit
      });

      if (USE_SHRED_API) {
        setShredLimitOrderConfirmed(true);
      }

      return result;
    } finally {
      if (USE_SHRED_API) {
        setShredLimitOrderConfirming(false);
      }
    }
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

    if (USE_SHRED_API) {
      setShredMarketOrderConfirming(true);
    }

    try {
      const result = await placeMarketOrder({
        pool,
        baseCurrency: pool.baseCurrency,
        quoteCurrency: pool.quoteCurrency,
        orderBook: pool.orderBook,
        quantity,
        side,
        price,
        withDeposit
      });

      if (USE_SHRED_API) {
        setShredMarketOrderConfirmed(true);
      }

      return result;
    } finally {
      if (USE_SHRED_API) {
        setShredMarketOrderConfirming(false);
      }
    }
  };

  return {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
    isLimitOrderPending,
    isLimitOrderConfirming: USE_SHRED_API ? shredLimitOrderConfirming : isLimitOrderConfirming,
    isLimitOrderConfirmed: USE_SHRED_API ? shredLimitOrderConfirmed : isLimitOrderConfirmed,
    isMarketOrderPending,
    isMarketOrderConfirming: USE_SHRED_API ? shredMarketOrderConfirming : isMarketOrderConfirming,
    isMarketOrderConfirmed: USE_SHRED_API ? shredMarketOrderConfirmed : isMarketOrderConfirmed,
    limitOrderHash,
    marketOrderHash,
    limitSimulateError,
    marketSimulateError,
  };
};