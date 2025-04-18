import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { BALANCE_MANAGER_ADDRESS, GTX_ROUTER_ADDRESS } from "@/constants/contract-address";
import { HexAddress } from "@/types/general/address";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  
  // Mutation for limit orders
  const {
    mutateAsync: placeLimitOrder,
    isPending: isLimitOrderPending,
    isError: isLimitOrderError,
    error: limitSimulateError,
  } = useMutation({
    mutationFn: async ({
      baseCurrency,
      quoteCurrency,
      price,
      quantity,
      side,
      withDeposit = false
    }: {
      baseCurrency: HexAddress;
      quoteCurrency: HexAddress;
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
              requiredToken = quoteCurrency as `0x${string}`;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10**18); // Adjust based on your token decimals
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
              args: [address as `0x${string}`, BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`],
            });
            
            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);
            
            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${BALANCE_MANAGER_ADDRESS(chainId)}`);
              
              try {
                // Execute the approval transaction
                const approvalHash = await writeContract(wagmiConfig, {
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`, requiredAmount],
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
              address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, price, quantity, side, address as `0x${string}` ] as const,
            });
            
            console.log("Simulation result:", simulation.result);
            
            // If simulation succeeds, execute the transaction
            hash = await writeContract(wagmiConfig, {
              address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrderWithDeposit',
              args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, price, quantity, side, address as `0x${string}` ] as const,
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
              requiredToken = quoteCurrency as `0x${string}`;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = price * quantity / BigInt(10**18); // Adjust based on your token decimals
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
              args: [address as `0x${string}`, BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`],
            });
            
            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);
            
            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${BALANCE_MANAGER_ADDRESS(chainId)}`);
              
              try {
                // Execute the approval transaction
                const approvalHash = await writeContract(wagmiConfig, {
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`, requiredAmount],
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
              address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrder',
              args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, price, quantity, side, address as `0x${string}` ] as const,
            });
            
            console.log("Simulation result:", simulation.result);
            
            // If simulation succeeds, execute the transaction
            hash = await writeContract(wagmiConfig, {
              address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeOrder',
              args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, price, quantity, side, address as `0x${string}` ] as const,
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
      baseCurrency,
      quoteCurrency,
      quantity,
      side,
      price,
      withDeposit = false
    }: {
      baseCurrency: HexAddress;
      quoteCurrency: HexAddress;
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
              requiredToken = quoteCurrency as `0x${string}`;
              // Calculate total cost (price * quantity) for buy orders
              requiredAmount = BigInt(quantity) * price / BigInt(10**18); // Adjust based on your token decimals
            } else {
              requiredToken = baseCurrency as `0x${string}`;
              requiredAmount = BigInt(quantity);
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
              args: [address as `0x${string}`, BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`],
            });
            
            console.log(`Allowance: ${allowance}, Required: ${requiredAmount}`);
            
            // If allowance is insufficient, trigger approval transaction
            if (allowance < requiredAmount) {
              toast.info('Approving tokens for trading...');
              console.log(`Approving ${formatUnits(requiredAmount, side === OrderSideEnum.BUY ? 6 : 18)} tokens from ${address} to ${GTX_ROUTER_ADDRESS(chainId)}`);
              
              try {
                // Execute the approval transaction
                const approvalHash = await writeContract(wagmiConfig, {
                  account: address,
                  address: requiredToken,
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [BALANCE_MANAGER_ADDRESS(chainId) as `0x${string}`, BigInt(Number(requiredAmount) * 2)  ],
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
              address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeMarketOrderWithDeposit',
              args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, BigInt(quantity), side, address as `0x${string}` ] as const,
            });
            
            console.log("Simulation result:", simulation.result);
            
            // If simulation succeeds, execute the transaction
            hash = await writeContract(wagmiConfig, {
              address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
              abi: GTXRouterABI,
              functionName: 'placeMarketOrderWithDeposit',
              args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, BigInt(quantity), side, address as `0x${string}` ] as const,
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
            address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
            abi: GTXRouterABI,
            functionName: 'placeMarketOrder',
            args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, quantity, side, address as `0x${string}` ] as const,
          });
          
          console.log("Simulation result:", simulation.result);
          
          // If simulation succeeds, execute the transaction
          hash = await writeContract(wagmiConfig, {
            address: GTX_ROUTER_ADDRESS(chainId) as `0x${string}`,
            abi: GTXRouterABI,
            functionName: 'placeMarketOrder',
            args: [baseCurrency as `0x${string}`, quoteCurrency as `0x${string}`, quantity, side, address as `0x${string}` ] as const,
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
    poolKey: { baseCurrency: HexAddress; quoteCurrency: HexAddress },
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
      baseCurrency: poolKey.baseCurrency, 
      quoteCurrency: poolKey.quoteCurrency, 
      price, 
      quantity, 
      side, 
      withDeposit 
    });
  };

  const handlePlaceMarketOrder = async (
    poolKey: { baseCurrency: HexAddress; quoteCurrency: HexAddress },
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
      baseCurrency: poolKey.baseCurrency, 
      quoteCurrency: poolKey.quoteCurrency, 
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
  };
};