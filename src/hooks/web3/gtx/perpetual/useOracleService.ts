import { useMutation, useQuery } from "@tanstack/react-query";
import { writeContract, readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";
import { useAccount } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import GTXOracleServiceManagerABI from "@/abis/gtx/perpetual/GTXOracleServiceManagerABI";
import { toast } from "sonner";

// Define types
export type HexAddress = `0x${string}`;
export type OracleSource = {
  name: string;
  identifier: string;
  network: string;
};

export type OraclePrice = {
  value: bigint;
  timestamp: bigint;
  blockNumber: bigint;
  minBlockInterval: bigint;
  maxBlockInterval: bigint;
};

export const ORACLE_SERVICE_MANAGER_ADDRESS = '0xe18769210e128687bf2488fc2c967e9dd6576d16' as const; // Replace with your actual address

export const useOracleService = () => {
  const { address } = useAccount();
  const [currentTaskId, setCurrentTaskId] = useState<number | undefined>(undefined);

  // Get price for a token
  const useGetPrice = (tokenAddress?: HexAddress) => {
    return useQuery({
      queryKey: ['oraclePrice', tokenAddress],
      queryFn: async () => {
        if (!tokenAddress) return null;
        
        try {
          const price = await readContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'getPrice',
            args: [tokenAddress]
          });
          
          return price;
        } catch (error) {
          console.error('Error fetching price:', error);
          return null;
        }
      },
      enabled: !!tokenAddress,
      refetchInterval: 30000 // Refetch every 30 seconds
    });
  };

  // Get detailed price information
  const useGetPriceDetails = (tokenAddress?: HexAddress) => {
    return useQuery({
      queryKey: ['oraclePriceDetails', tokenAddress],
      queryFn: async () => {
        if (!tokenAddress) return null;
        
        try {
          const result = await readContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'prices',
            args: [tokenAddress]
          });
          
          // Convert tuple to object
          const [value, timestamp, blockNumber, minBlockInterval, maxBlockInterval] = result as readonly [bigint, bigint, bigint, bigint, bigint];
          
          const priceDetails: OraclePrice = {
            value,
            timestamp,
            blockNumber,
            minBlockInterval,
            maxBlockInterval
          };
          
          return priceDetails;
        } catch (error) {
          console.error('Error fetching price details:', error);
          return null;
        }
      },
      enabled: !!tokenAddress,
      refetchInterval: 30000 // Refetch every 30 seconds
    });
  };

  // Get sources for a token
  const useGetSources = (tokenAddress?: HexAddress) => {
    return useQuery({
      queryKey: ['oracleSources', tokenAddress],
      queryFn: async () => {
        if (!tokenAddress) return [];
        
        try {
          const sources = await readContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'getSources',
            args: [tokenAddress]
          }) as OracleSource[];
          
          return sources;
        } catch (error) {
          console.error('Error fetching sources:', error);
          return [];
        }
      },
      enabled: !!tokenAddress
    });
  };

  // Request a new oracle task for a token pair
  const useRequestNewOracleTask = () => {
    return useMutation({
      mutationFn: async ({
        tokenAddress1,
        tokenAddress2,
        tokenPair,
        sources
      }: {
        tokenAddress1: HexAddress;
        tokenAddress2: HexAddress;
        tokenPair: string;
        sources: OracleSource[];
      }) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        try {
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'requestNewOracleTask',
            args: [tokenAddress1, tokenAddress2, tokenPair, sources]
          });

          toast.success('Oracle task request submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          // Try to extract task ID from receipt
          if (receipt.status === 'success') {
            // You may need to adjust this based on your contract's event structure
            try {
              const relevantLog = receipt.logs.find((log: any) => 
                log.address.toLowerCase() === ORACLE_SERVICE_MANAGER_ADDRESS.toLowerCase()
              );
              
              if (relevantLog?.topics?.[1]) {
                const taskId = parseInt(relevantLog.topics[1], 16);
                setCurrentTaskId(taskId);
                return taskId;
              }
            } catch (err) {
              console.error('Failed to parse task ID', err);
            }
            
            toast.success('Oracle task created successfully');
          } else {
            toast.error('Transaction failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Oracle task request error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to request oracle task');
          throw error;
        }
      }
    });
  };

  // Request a price update for an existing token
  const useRequestOraclePriceTask = () => {
    return useMutation({
      mutationFn: async (tokenAddress: HexAddress) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        try {
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'requestOraclePriceTask',
            args: [tokenAddress]
          });

          toast.success('Price update request submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('Price update task created successfully');
          } else {
            toast.error('Transaction failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Price update request error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to request price update');
          throw error;
        }
      }
    });
  };

  // Register as an operator to AVS (for validators)
  const useRegisterOperatorToAVS = () => {
    return useMutation({
      mutationFn: async ({
        operator,
        signature,
        salt,
        expiry
      }: {
        operator: HexAddress;
        signature: `0x${string}`;
        salt: `0x${string}`;
        expiry: bigint;
      }) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        try {
          const operatorSignature = {
            signature,
            salt,
            expiry
          };

          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'registerOperatorToAVS',
            args: [operator, operatorSignature]
          });

          toast.success('Operator registration submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('Operator registered successfully');
          } else {
            toast.error('Transaction failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Operator registration error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to register operator');
          throw error;
        }
      }
    });
  };

  // Deregister an operator from AVS
  const useDeregisterOperatorFromAVS = () => {
    return useMutation({
      mutationFn: async (operator: HexAddress) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        try {
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'deregisterOperatorFromAVS',
            args: [operator]
          });

          toast.success('Operator deregistration submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('Operator deregistered successfully');
          } else {
            toast.error('Transaction failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Operator deregistration error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to deregister operator');
          throw error;
        }
      }
    });
  };

  // Get all restakeable strategies
  const useGetRestakeableStrategies = () => {
    return useQuery({
      queryKey: ['restakeableStrategies'],
      queryFn: async () => {
        try {
          const strategies = await readContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'getRestakeableStrategies',
            args: []
          }) as HexAddress[];
          
          return strategies;
        } catch (error) {
          console.error('Error fetching restakeable strategies:', error);
          return [];
        }
      }
    });
  };

  // Get operator's restaked strategies
  const useGetOperatorRestakedStrategies = (operatorAddress?: HexAddress) => {
    return useQuery({
      queryKey: ['operatorRestakedStrategies', operatorAddress],
      queryFn: async () => {
        if (!operatorAddress) return [];
        
        try {
          const strategies = await readContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'getOperatorRestakedStrategies',
            args: [operatorAddress]
          }) as HexAddress[];
          
          return strategies;
        } catch (error) {
          console.error('Error fetching operator restaked strategies:', error);
          return [];
        }
      },
      enabled: !!operatorAddress
    });
  };

  // Set price manually (for admin/testing)
  const useSetPrice = () => {
    return useMutation({
      mutationFn: async ({
        tokenAddress,
        price
      }: {
        tokenAddress: HexAddress;
        price: bigint;
      }) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        try {
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'setPrice',
            args: [tokenAddress, price]
          });

          toast.success('Price update submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('Price updated successfully');
          } else {
            toast.error('Transaction failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Price update error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to update price');
          throw error;
        }
      }
    });
  };

  return {
    // Price related hooks
    useGetPrice,
    useGetPriceDetails,
    useGetSources,
    useRequestNewOracleTask,
    useRequestOraclePriceTask,
    useSetPrice,
    
    // Operator related hooks
    useRegisterOperatorToAVS,
    useDeregisterOperatorFromAVS,
    useGetRestakeableStrategies,
    useGetOperatorRestakedStrategies,
    
    // State
    currentTaskId
  };
};

export default useOracleService;