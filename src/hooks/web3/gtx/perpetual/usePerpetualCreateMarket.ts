import RouterABI from "@/abis/gtx/perpetual/RouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { MARKET_FACTORY_ADDRESS, ROUTER_ADDRESS } from "@/constants/contract/contract-address";
import { getTokenAddresses } from "@/helper/token-helper";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { HexAddress } from "@/types/general/address";

// Match the exact structure expected by the ABI
export type OracleSource = {
  name: string;
  identifier: string;
  network: string;
};

export interface CreateMarketParams {
  longToken: HexAddress;
  tokenPair: string;
  sources?: OracleSource[];
}

export const usePerpetualCreateMarket = () => {
  const { address } = useAccount();
  const [marketTxHash, setMarketTxHash] = useState<HexAddress | undefined>(undefined);
  const [createdMarketAddress, setCreatedMarketAddress] = useState<HexAddress | undefined>(undefined);

  const {
    mutateAsync: createMarket,
    isPending: isMarketCreationPending,
    isError: isMarketCreationError,
    error: marketCreationError,
  } = useMutation({
    mutationFn: async (params: CreateMarketParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        // Log parameters for debugging
        console.log('Create Market Parameters:', {
          longToken: params.longToken,
          shortToken: getTokenAddresses().USDC,
          tokenPair: params.tokenPair,
          sources: params.sources
        });

        // Use different methods based on whether sources are provided
        let hash: HexAddress;
        
        if (params.sources && params.sources.length > 0) {
          // Use Router.createMarket if oracle sources are provided
          // Call directly to avoid TypeScript checking of args
          const result = await writeContract(wagmiConfig, {
            address: ROUTER_ADDRESS,
            abi: RouterABI,
            functionName: 'createMarket',
            // @ts-ignore - Bypass TypeScript checking for the args
            args: [
              params.longToken,
              getTokenAddresses().USDC,
              params.tokenPair,
              params.sources
            ]
          });
          hash = result;
        } else {
          // Use MarketFactory.createMarket if no oracle sources
          const result = await writeContract(wagmiConfig, {
            address: MARKET_FACTORY_ADDRESS,
            abi: RouterABI,
            functionName: 'createMarket',
            // @ts-ignore - Bypass TypeScript checking for the args
            args: [
              params.longToken,
              getTokenAddresses().USDC
            ]
          });
          hash = result;
        }

        setMarketTxHash(hash);
        toast.success('Market creation submitted. Waiting for confirmation...');

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === 'success') {
          // Parse logs to find the created market address
          // For a proper implementation, we should decode logs to find the MarketCreated event
          // This is a simplification for now
          console.log('Transaction receipt:', receipt);
          
          toast.success('Market created successfully!');
        } else {
          toast.error('Transaction failed on-chain');
          throw new Error('Transaction failed on-chain');
        }

        return receipt;
      } catch (error) {
        console.error('Market creation error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create market');
        throw error;
      }
    },
  });
  
  // Transaction confirmation state
  const {
    data: marketTxReceipt,
    isLoading: isMarketTxConfirming,
    isSuccess: isMarketTxConfirmed,
  } = useWaitForTransactionReceipt({
    hash: marketTxHash,
  });
  
  // Helper function for creating market with binance and okx as sources
  const createMarketWithDefaultOracles = async (
    longToken: HexAddress,
    symbol: string
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    // Create default sources like in the script
    const tokenSymbol = symbol.replace(/USDC$|USDT$|USD$/, '');
    const sources: OracleSource[] = [
      {
        name: "binance",
        identifier: `${tokenSymbol}USDT`,
        network: ""
      },
      {
        name: "okx",
        identifier: `${tokenSymbol}-USDT`,
        network: ""
      }
    ];
    
    const tokenPair = `${tokenSymbol}/USDT`;
    
    return createMarket({
      longToken,
      tokenPair,
      sources
    });
  };
  
  // Helper for creating a market with custom sources
  const createMarketWithCustomOracles = async (
    longToken: HexAddress,
    tokenPair: string,
    sources: OracleSource[]
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    // Validate sources
    if (!sources || sources.length === 0) {
      toast.error('At least one oracle source is required');
      return;
    }
    
    return createMarket({
      longToken,
      tokenPair,
      sources
    });
  };
  
  // Helper for creating a market using internal oracle (no sources)
  const createMarketWithInternalOracle = async (
    longToken: HexAddress
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    return createMarket({
      longToken,
      tokenPair: "" // Not used for internal oracle
    });
  };

  return {
    createMarketWithDefaultOracles,
    createMarketWithCustomOracles,
    createMarketWithInternalOracle,
    isMarketCreationPending,
    isMarketTxConfirming,
    isMarketTxConfirmed,
    isMarketCreationError,
    marketTxHash,
    marketCreationError,
    marketTxReceipt,
    createdMarketAddress
  };
};

export default usePerpetualCreateMarket;