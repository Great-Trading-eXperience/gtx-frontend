import TokenABI from "@/abis/tokens/TokenABI";
import { wagmiConfig } from "@/configs/wagmi";
import { PoolsPonderResponse, PoolsResponse } from "@/graphql/gtx/clob";
import { getUseSubgraph } from "@/utils/env";
import { readContract } from "@wagmi/core";
import { ProcessedPool } from "./types";

/**
 * Process raw pools data from GraphQL into a more usable format
 * @param poolsData Raw pools data from GraphQL query
 * @returns Array of processed pool objects
 */
export async function processPools(
  poolsData: PoolsPonderResponse | PoolsResponse | null | undefined
): Promise<ProcessedPool[]> {
  if (!poolsData) return [];

  const pools =
    (poolsData as PoolsPonderResponse)?.poolss?.items ||
    (poolsData as PoolsResponse)?.pools;
  
  if (!pools) return [];

  const processedPools = getUseSubgraph()
    ? await Promise.all(
        pools.map(async (pool) => {
          const [baseTokenAddress, quoteTokenAddress] = [
            pool.baseCurrency,
            pool.quoteCurrency,
          ];

          let baseSymbol = baseTokenAddress;
          let quoteSymbol = quoteTokenAddress;
          let baseDecimals = 18;
          let quoteDecimals = 6;

          // Get base token info
          if (baseTokenAddress !== "Unknown") {
            try {
              const [baseSymbolResult, baseDecimalsResult] =
                await Promise.all([
                  readContract(wagmiConfig, {
                    address: baseTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "symbol",
                  }),
                  readContract(wagmiConfig, {
                    address: baseTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "decimals",
                  }),
                ]);
              baseSymbol = baseSymbolResult as string;
              baseDecimals = baseDecimalsResult as number;
            } catch (error) {
              console.error(
                `Error fetching base token info for ${baseTokenAddress}:`,
                error
              );
            }
          }

          // Get quote token info
          if (quoteTokenAddress !== "USDC") {
            try {
              const [quoteSymbolResult, quoteDecimalsResult] =
                await Promise.all([
                  readContract(wagmiConfig, {
                    address: quoteTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "symbol",
                  }),
                  readContract(wagmiConfig, {
                    address: quoteTokenAddress as `0x${string}`,
                    abi: TokenABI,
                    functionName: "decimals",
                  }),
                ]);
              quoteSymbol = quoteSymbolResult as string;
              quoteDecimals = quoteDecimalsResult as number;
            } catch (error) {
              console.error(
                `Error fetching quote token info for ${quoteTokenAddress}:`,
                error
              );
            }
          }

          return {
            id: pool.id,
            baseToken: baseTokenAddress,
            quoteToken: quoteTokenAddress,
            orderBook: pool.orderBook,
            baseSymbol,
            quoteSymbol,
            baseDecimals,
            quoteDecimals,
            timestamp: pool.timestamp,
            maxOrderAmount: pool.maxOrderAmount || "0",
          };
        })
      )
    : pools.map((pool) => ({
        id: pool.id,
        baseToken: pool.baseCurrency,
        quoteToken: pool.quoteCurrency,
        orderBook: pool.orderBook,
        baseSymbol: pool.coin.split("/")[0],
        quoteSymbol: pool.coin.split("/")[1],
        baseDecimals: pool.baseDecimals,
        quoteDecimals: pool.quoteDecimals,
        timestamp: pool.timestamp,
        maxOrderAmount: pool.maxOrderAmount || "0",
      }));

  return processedPools.sort((a, b) => {
    const aHasWETH =
      a.baseSymbol.toLowerCase().includes("weth") ||
      a.baseSymbol.toLowerCase().includes("eth");
    const bHasWETH =
      b.baseSymbol.toLowerCase().includes("weth") ||
      b.baseSymbol.toLowerCase().includes("eth");
    if (aHasWETH && !bHasWETH) return -1;
    if (!aHasWETH && bHasWETH) return 1;
    return b.timestamp - a.timestamp;
  });
} 