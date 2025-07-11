import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { writeContract, readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import RouterABI from "@/abis/gtx/perpetual/RouterABI";
import GTXOracleServiceManagerABI from "@/abis/gtx/perpetual/GTXOracleServiceManagerABI";

// Import crypto-js instead of ethers and bs58
import { SHA3 } from "crypto-js";
import { ORACLE_ADDRESS, ROUTER_ADDRESS } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";

export type OracleSource = {
  name: string;
  identifier: string;
  network: string;
};

export type CreateMarketParams = {
  longToken: HexAddress;
  shortToken: HexAddress;
  tokenPair: string;
  sources?: OracleSource[];
  isSolanaToken?: boolean;
  solanaAddress?: string;
};

/**
 * Convert a Solana address to an EVM-compatible address
 * Simple version using a placeholder function since we can't use bs58
 */
const solanaToEvmAddress = (solanaAddress: string): HexAddress => {
  try {
    // This is a simplified placeholder. In production, use proper bs58 decoding and keccak256
    // For now, we'll just derive a deterministic address from the input
    const hash = SHA3(solanaAddress).toString();
    const evmAddress = `0x${hash.slice(-40)}`;
    return evmAddress as HexAddress;
  } catch (error) {
    console.error("Error converting Solana address:", error);
    throw new Error("Failed to convert Solana address to EVM format");
  }
};

/**
 * Generate default sources based on token and token pair
 */
const generateDefaultSources = (
  tokenAddress: HexAddress,
  tokenPair: string,
  isSolanaToken: boolean = false,
  solanaAddress?: string
): OracleSource[] => {
  const [baseSymbol, quoteSymbol] = tokenPair.split('/');
  
  if (isSolanaToken && solanaAddress) {
    // Solana token format
    return [
      {
        name: "geckoterminal",
        identifier: solanaAddress,
        network: "solana"
      },
      {
        name: "dexscreener",
        identifier: solanaAddress,
        network: "solana"
      },
      {
        name: "binance",
        identifier: `${baseSymbol}${quoteSymbol}`,
        network: ""
      },
      {
        name: "okx",
        identifier: `${baseSymbol}-${quoteSymbol}`,
        network: ""
      }
    ];
  } else {
    // Ethereum token format
    return [
      {
        name: "geckoterminal",
        identifier: tokenAddress,
        network: "eth"
      },
      {
        name: "dexscreener",
        identifier: tokenAddress,
        network: "ethereum"
      },
      {
        name: "binance",
        identifier: `${baseSymbol}${quoteSymbol}`,
        network: ""
      },
      {
        name: "okx",
        identifier: `${baseSymbol}-${quoteSymbol}`,
        network: ""
      }
    ];
  }
};

export const useCreateMarket = () => {
  const { address } = useAccount();
  const [createMarketHash, setCreateMarketHash] = useState<HexAddress | undefined>(undefined);
  const [createdMarketAddress, setCreatedMarketAddress] = useState<HexAddress | undefined>(undefined);

  // Check if sources already exist for a token
  const checkExistingSources = async (tokenAddress: HexAddress) => {
    try {
      const result = await readContract(wagmiConfig, {
        address: ORACLE_ADDRESS,
        abi: GTXOracleServiceManagerABI,
        functionName: 'getSources',
        args: [tokenAddress]
      });
      
      return result && Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error("Error checking existing sources:", error);
      return false;
    }
  };

  // Request new oracle task with sources
  const requestNewOracleTask = async (
    tokenAddress: HexAddress,
    tokenAddress2: HexAddress,
    tokenPair: string,
    sources: OracleSource[]
  ) => {
    try {
      const hash = await writeContract(wagmiConfig, {
        address: ORACLE_ADDRESS,
        abi: GTXOracleServiceManagerABI,
        functionName: 'requestNewOracleTask',
        args: [tokenAddress, tokenAddress2, tokenPair, sources]
      });

      toast.success('Oracle data sources registered');
      
      return await waitForTransactionReceipt(wagmiConfig, { hash });
    } catch (error) {
      console.error("Error requesting new oracle task:", error);
      throw error;
    }
  };

  // Request oracle price update for existing token
  const requestOraclePriceTask = async (tokenAddress: HexAddress) => {
    try {
      const hash = await writeContract(wagmiConfig, {
        address: ORACLE_ADDRESS,
        abi: GTXOracleServiceManagerABI,
        functionName: 'requestOraclePriceTask',
        args: [tokenAddress]
      });

      toast.success('Price update requested');
      
      return await waitForTransactionReceipt(wagmiConfig, { hash });
    } catch (error) {
      console.error("Error requesting price update:", error);
      throw error;
    }
  };

  const {
    mutateAsync: handleCreateMarket,
    isPending: isCreateMarketPending,
    isError: isCreateMarketError,
    error: createMarketSimulateError,
  } = useMutation({
    mutationFn: async (params: CreateMarketParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        // Process Solana token if needed
        let finalLongToken = params.longToken;
        
        if (params.isSolanaToken && params.solanaAddress) {
          finalLongToken = solanaToEvmAddress(params.solanaAddress);
          toast.info('Converting Solana address to EVM format');
        }

        // Generate sources if not provided
        const sources = params.sources || generateDefaultSources(
          finalLongToken, 
          params.tokenPair, 
          params.isSolanaToken, 
          params.solanaAddress
        );
        
        // Check if oracle sources already exist
        const hasExistingSources = await checkExistingSources(finalLongToken);
        
        // If no sources exist, register them first
        if (!hasExistingSources) {
          toast.info('Registering new oracle sources...');
          await requestNewOracleTask(
            finalLongToken,
            params.shortToken,
            params.tokenPair,
            sources
          );
        } else {
          // Request a price update for existing sources
          toast.info('Requesting price update for existing sources...');
          await requestOraclePriceTask(finalLongToken);
        }

        // Log the parameters for debugging
        console.log('Creating market with parameters:', {
          longToken: finalLongToken,
          shortToken: params.shortToken,
          tokenPair: params.tokenPair,
          sources: sources,
          address: ROUTER_ADDRESS
        });

        // Execute the createMarket transaction
        const hash = await writeContract(wagmiConfig, {
          address: ROUTER_ADDRESS,
          abi: RouterABI,
          functionName: 'createMarket',
          args: [
            finalLongToken,
            params.shortToken,
            params.tokenPair,
            sources
          ]
        });

        setCreateMarketHash(hash);
        toast.success('Market creation submitted. Waiting for confirmation...');

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === 'success') {
          try {
            // Parse transaction logs to find the market address
            const marketAddress = extractMarketAddressFromReceipt(receipt);
            if (marketAddress) {
              setCreatedMarketAddress(marketAddress);
              toast.success(`Market ${params.tokenPair} created at address ${marketAddress}`);
            } else {
              toast.success(`Market ${params.tokenPair} created successfully!`);
            }
          } catch (error) {
            console.error('Failed to parse market address from receipt:', error);
            toast.success(`Market ${params.tokenPair} created successfully!`);
          }
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

  // Helper function to extract market address from transaction receipt
  const extractMarketAddressFromReceipt = (receipt: any): HexAddress | undefined => {
    // This is a placeholder implementation
    // You'll need to adjust this based on your contract's event structure
    
    // Example implementation:
    try {
      // Look for logs from your contract
      const relevantLog = receipt.logs.find((log: any) => 
        log.address.toLowerCase() === ROUTER_ADDRESS.toLowerCase()
      );
      
      if (relevantLog && relevantLog.topics && relevantLog.topics.length > 1) {
        // If the market address is the second topic (index 1)
        // This is just an example, adjust based on your actual event structure
        const marketAddress = `0x${relevantLog.topics[1].slice(26)}`;
        return marketAddress as HexAddress;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting market address:', error);
      return undefined;
    }
  };

  // Transaction confirmation state
  const {
    data: createMarketReceipt,
    isLoading: isCreateMarketConfirming,
    isSuccess: isCreateMarketConfirmed,
  } = useWaitForTransactionReceipt({
    hash: createMarketHash,
  });

  // Main function to create a market
  const createMarket = async (params: CreateMarketParams) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    // Basic validation
    if (!params.longToken && !params.solanaAddress) {
      toast.error('Either long token address or Solana address is required');
      return;
    }

    if (!params.shortToken) {
      toast.error('Short token address is required');
      return;
    }

    if (!params.tokenPair) {
      toast.error('Token pair name is required');
      return;
    }

    // If sources provided, validate them
    if (params.sources && params.sources.length > 0) {
      // Filter out any sources with empty identifiers
      const validSources = params.sources.filter(source => 
        source.identifier && source.identifier.trim() !== ""
      );

      if (validSources.length === 0) {
        toast.error('At least one valid oracle source with an identifier must be provided');
        return;
      }
      
      params.sources = validSources;
    }

    return handleCreateMarket(params);
  };

  return {
    createMarket,
    handleCreateMarket,
    isCreateMarketPending,
    isCreateMarketConfirming,
    isCreateMarketConfirmed,
    isCreateMarketError,
    createMarketHash,
    createMarketSimulateError,
    createMarketReceipt,
    createdMarketAddress,
    // Utility functions exposed for other components
    solanaToEvmAddress,
    generateDefaultSources
  };
};

export default useCreateMarket;