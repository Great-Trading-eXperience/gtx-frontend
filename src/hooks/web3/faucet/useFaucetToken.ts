import TokenABI from "@/abis/tokens/TokenABI";
import { wagmiConfig } from "@/configs/wagmi";
import { HexAddress } from "@/types/general/address";
import { readContract } from "@wagmi/core";
import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import { useMemo } from "react";

interface Token {
    address: HexAddress;
    name: string;
    symbol: string;
    decimals: number;
}

interface FaucetTokenItem {
    token: HexAddress;
}

interface FaucetTokensData {
    faucetTokenss: {
        items: FaucetTokenItem[];
    };
}

interface TokenMetadata {
    name: string;
    symbol: string;
    decimals: number;
}

interface UseFaucetTokensOptions {
    enabled?: boolean;
    staleTime?: number;
    retry?: number;
}

interface UseFaucetTokensResult {
    availableTokens: Record<string, Token>;
    loading: boolean;
    error: boolean;
    hasErrors: boolean;
    refetchAll: () => Promise<void>;
}

const fetchTokenMetadata = async (
    tokenAddress: HexAddress, 
    chainId: number
): Promise<TokenMetadata> => {
    try {
        // Fetch all metadata in parallel instead of sequentially
        const [nameResult, symbolResult, decimalsResult] = await Promise.all([
            readContract(wagmiConfig, {
                address: tokenAddress,
                abi: TokenABI,
                functionName: "name",
                args: [],
                chainId,
            }).catch(() => ""), // Return empty string on error
            
            readContract(wagmiConfig, {
                address: tokenAddress,
                abi: TokenABI,
                functionName: "symbol", 
                args: [],
                chainId,
            }).catch(() => ""), // Return empty string on error
            
            readContract(wagmiConfig, {
                address: tokenAddress,
                abi: TokenABI,
                functionName: "decimals",
                args: [],
                chainId,
            }).catch(() => 18) // Return default 18 on error
        ]);

        // Process results
        const name = (nameResult && nameResult !== "0x") ? nameResult as string : "";
        const symbol = (symbolResult && symbolResult !== "0x") ? symbolResult as string : "";
        const decimals = decimalsResult ? decimalsResult as number : 18;

        return { name, symbol, decimals };
        
    } catch (err: unknown) {
        return {
            name: "",
            symbol: "",
            decimals: 18
        };
    }
};

export const useFaucetTokens = (
    faucetTokensData: FaucetTokensData | null | undefined,
    actualChainId: number,
    mounted: boolean,
    hasFaucetContract: boolean,
    options: UseFaucetTokensOptions = {}
): UseFaucetTokensResult => {
    const {
        enabled = true,
        staleTime = 10 * 60 * 1000, // 10 minutes - token metadata rarely changes
        retry = 2
    } = options;

    // Extract token addresses for queries
    const tokenAddresses = useMemo(() => {
        if (!faucetTokensData?.faucetTokenss?.items) return [];
        return faucetTokensData.faucetTokenss.items.map(item => item.token);
    }, [faucetTokensData]);

    // Create parallel queries for all tokens
    const queries = useQueries({
        queries: tokenAddresses.map((tokenAddress) => ({
            queryKey: ['tokenMetadata', tokenAddress, actualChainId],
            queryFn: () => fetchTokenMetadata(tokenAddress, actualChainId),
            enabled: enabled && mounted && hasFaucetContract && !!tokenAddress,
            staleTime,
            retry,
            // Don't refetch in background for metadata (it rarely changes)
            refetchOnWindowFocus: false,
            refetchInterval: false,
        } as UseQueryOptions<TokenMetadata, Error>))
    });

    // Process results
    const availableTokens = useMemo(() => {
        const tokens: Record<string, Token> = {};
        
        queries.forEach((query, index) => {
            const tokenAddress = tokenAddresses[index];
            if (query.data && tokenAddress) {
                const tokenData: Token = {
                    address: tokenAddress,
                    name: query.data.name,
                    symbol: query.data.symbol,
                    decimals: query.data.decimals,
                };
                
                tokens[tokenAddress] = tokenData;
            }
        });
        
        return tokens;
    }, [queries, tokenAddresses]);

    // Calculate loading and error states
    const loading = queries.some(query => query.isLoading);
    const hasErrors = queries.some(query => query.isError);
    const error = hasErrors;

    // Refetch function
    const refetchAll = async (): Promise<void> => {
        await Promise.all(queries.map(query => query.refetch()));
    };

    return {
        availableTokens,
        loading,
        error,
        hasErrors,
        refetchAll,
    };
};