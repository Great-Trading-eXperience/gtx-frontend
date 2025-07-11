import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { writeContract, readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import GTXOracleServiceManagerABI from "@/abis/gtx/perpetual/GTXOracleServiceManagerABI";
import { ORACLE_ADDRESS } from "@/constants/contract/contract-address";


// Define types
export type HexAddress = `0x${string}`;
export type OracleSource = {
  name: string;
  identifier: string;
  network: string;
};

/**
 * Hook for interacting with the GTX Oracle Service Manager
 */
export const useOracleServiceManager = () => {
  const { address } = useAccount();
  
  /**
   * Get token price from Oracle
   */
  const useGetPrice = (tokenAddress?: HexAddress) => {
    return useQuery({
      queryKey: ['oraclePrice', tokenAddress],
      queryFn: async () => {
        if (!tokenAddress) return null;
        
        try {
          const price = await readContract(wagmiConfig, {
            address: ORACLE_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'getPrice',
            args: [tokenAddress]
          });
          
          return price;
        } catch (error) {
          console.error('Error fetching price:', error);
          throw error;
        }
      },
      enabled: !!tokenAddress,
    });
  };
  
  /**
   * Get oracle sources for a token
   */
  const useGetSources = (tokenAddress?: HexAddress) => {
    return useQuery({
      queryKey: ['oracleSources', tokenAddress],
      queryFn: async () => {
        if (!tokenAddress) return null;
        
        try {
          const sources = await readContract(wagmiConfig, {
            address: ORACLE_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'getSources',
            args: [tokenAddress]
          });
          
          return sources;
        } catch (error) {
          console.error('Error fetching sources:', error);
          throw error;
        }
      },
      enabled: !!tokenAddress,
    });
  };
  
  /**
   * Request a new oracle task for token price
   */
  const useRequestOraclePriceTask = () => {
    const [taskHash, setTaskHash] = useState<HexAddress | undefined>(undefined);
    
    const {
      mutateAsync: requestOraclePriceTask,
      isPending: isRequestPending,
      isError: isRequestError,
      error: requestError,
    } = useMutation({
      mutationFn: async (tokenAddress: HexAddress) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }
        
        try {
          console.log('Requesting oracle price task for token:', tokenAddress);
          
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'requestOraclePriceTask',
            args: [tokenAddress]
          });
          
          setTaskHash(hash);
          toast.success('Oracle price task request submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('Oracle price task created successfully');
          } else {
            toast.error('Oracle price task request failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Error requesting oracle price task:', error);
          toast.error(error instanceof Error ? error.message : 'Request failed');
          throw error;
        }
      }
    });
    
    const {
      data: taskReceipt,
      isLoading: isTaskConfirming,
      isSuccess: isTaskConfirmed,
    } = useWaitForTransactionReceipt({
      hash: taskHash,
    });
    
    return {
      requestOraclePriceTask,
      isRequestPending,
      isTaskConfirming,
      isTaskConfirmed,
      isRequestError,
      taskHash,
      requestError,
      taskReceipt
    };
  };
  
  /**
   * Request a new oracle task with custom sources
   */
  const useRequestNewOracleTask = () => {
    const [taskHash, setTaskHash] = useState<HexAddress | undefined>(undefined);
    
    const {
      mutateAsync: requestNewOracleTask,
      isPending: isRequestPending,
      isError: isRequestError,
      error: requestError,
    } = useMutation({
      mutationFn: async (params: {
        tokenAddress: HexAddress;
        tokenAddress2: HexAddress;
        tokenPair: string;
        sources: OracleSource[];
      }) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }
        
        try {
          console.log('Requesting new oracle task with parameters:', params);
          
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'requestNewOracleTask',
            args: [
              params.tokenAddress,
              params.tokenAddress2,
              params.tokenPair,
              params.sources
            ]
          });
          
          setTaskHash(hash);
          toast.success('New oracle task request submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('New oracle task created successfully');
          } else {
            toast.error('New oracle task request failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Error requesting new oracle task:', error);
          
          // Extract error message for better feedback
          let errorMessage = 'Failed to create new oracle task';
          if (error instanceof Error) {
            if (error.message.includes('SourcesAlreadyExist')) {
              errorMessage = 'Sources already exist for this token';
            } else if (error.message.includes('SourcesEmpty')) {
              errorMessage = 'No sources provided for the token';
            } else {
              errorMessage = error.message;
            }
          }
          
          toast.error(errorMessage);
          throw error;
        }
      }
    });
    
    const {
      data: taskReceipt,
      isLoading: isTaskConfirming,
      isSuccess: isTaskConfirmed,
    } = useWaitForTransactionReceipt({
      hash: taskHash,
    });
    
    return {
      requestNewOracleTask,
      isRequestPending,
      isTaskConfirming,
      isTaskConfirmed,
      isRequestError,
      taskHash,
      requestError,
      taskReceipt
    };
  };
  
  /**
   * Set price manually (admin only)
   */
  const useSetPrice = () => {
    const [setPriceHash, setSetPriceHash] = useState<HexAddress | undefined>(undefined);
    
    const {
      mutateAsync: setPrice,
      isPending: isSetPricePending,
      isError: isSetPriceError,
      error: setPriceError,
    } = useMutation({
      mutationFn: async (params: {
        tokenAddress: HexAddress;
        price: bigint;
      }) => {
        if (!address) {
          throw new Error("Wallet not connected");
        }
        
        try {
          console.log('Setting price for token:', params);
          
          const hash = await writeContract(wagmiConfig, {
            address: ORACLE_ADDRESS,
            abi: GTXOracleServiceManagerABI,
            functionName: 'setPrice',
            args: [
              params.tokenAddress,
              params.price
            ]
          });
          
          setSetPriceHash(hash);
          toast.success('Price update submitted');
          
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
          
          if (receipt.status === 'success') {
            toast.success('Price updated successfully');
          } else {
            toast.error('Price update failed on-chain');
            throw new Error('Transaction failed on-chain');
          }
          
          return receipt;
        } catch (error) {
          console.error('Error setting price:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to set price');
          throw error;
        }
      }
    });
    
    const {
      data: setPriceReceipt,
      isLoading: isSetPriceConfirming,
      isSuccess: isSetPriceConfirmed,
    } = useWaitForTransactionReceipt({
      hash: setPriceHash,
    });
    
    return {
      setPrice,
      isSetPricePending,
      isSetPriceConfirming,
      isSetPriceConfirmed,
      isSetPriceError,
      setPriceHash,
      setPriceError,
      setPriceReceipt
    };
  };
  
  return {
    useGetPrice,
    useGetSources,
    useRequestOraclePriceTask,
    useRequestNewOracleTask,
    useSetPrice
  };
};

export default useOracleServiceManager;