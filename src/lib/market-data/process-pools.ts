import TokenABI from '@/abis/tokens/TokenABI';
import { wagmiConfig } from '@/configs/wagmi';
import { PoolsPonderResponse, PoolsResponse } from '@/graphql/gtx/clob';
import { getUseSubgraph } from '@/utils/env';
import { readContract } from '@wagmi/core';
import { ProcessedPool } from './types';

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

  console.log('pools', pools);

  if (!pools) return [];

  const processedPools = getUseSubgraph()
    ? await Promise.all(
        pools.map(async pool => {
          const [baseTokenAddress, quoteTokenAddress] = [
            pool.baseCurrency.address,
            pool.quoteCurrency.address,
          ];

          let baseSymbol = pool.baseCurrency.symbol || baseTokenAddress;
          let quoteSymbol = pool.quoteCurrency.symbol || quoteTokenAddress;
          let baseDecimals = pool.baseCurrency.decimals || 18;
          let quoteDecimals = pool.quoteCurrency.decimals || 6;

          // Get base token info if not already available
          if (typeof baseSymbol === 'string' && baseTokenAddress !== 'Unknown') {
            try {
              const [baseSymbolResult, baseDecimalsResult] = await Promise.all([
                readContract(wagmiConfig, {
                  address: baseTokenAddress as `0x${string}`,
                  abi: TokenABI,
                  functionName: 'symbol',
                }),
                readContract(wagmiConfig, {
                  address: baseTokenAddress as `0x${string}`,
                  abi: TokenABI,
                  functionName: 'decimals',
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

          // Get quote token info if not already available
          if (typeof quoteSymbol === 'string' && quoteTokenAddress !== 'USDC') {
            try {
              const [quoteSymbolResult, quoteDecimalsResult] = await Promise.all([
                readContract(wagmiConfig, {
                  address: quoteTokenAddress as `0x${string}`,
                  abi: TokenABI,
                  functionName: 'symbol',
                }),
                readContract(wagmiConfig, {
                  address: quoteTokenAddress as `0x${string}`,
                  abi: TokenABI,
                  functionName: 'decimals',
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
            maxOrderAmount: pool.maxOrderAmount || '0',
            volume: pool.volume || '0',
          };
        })
      )
    : pools.map(pool => ({
        id: pool.id,
        baseToken: pool.baseCurrency.address,
        quoteToken: pool.quoteCurrency.address,
        orderBook: pool.orderBook,
        baseSymbol: pool.coin.split('/')[0],
        quoteSymbol: pool.coin.split('/')[1],
        baseDecimals: pool.baseDecimals || pool.baseCurrency.decimals,
        quoteDecimals: pool.quoteDecimals || pool.quoteCurrency.decimals,
        timestamp: pool.timestamp,
        maxOrderAmount: pool.maxOrderAmount || '0',
        volume: pool.volume || '0',
      }));

  return processedPools.sort((a, b) => {
    const aHasWETH =
      typeof a.baseSymbol === 'string' && 
      (a.baseSymbol.toLowerCase().includes('weth') ||
       a.baseSymbol.toLowerCase().includes('eth'));
    const bHasWETH =
      typeof b.baseSymbol === 'string' && 
      (b.baseSymbol.toLowerCase().includes('weth') ||
       b.baseSymbol.toLowerCase().includes('eth'));
    if (aHasWETH && !bHasWETH) return -1;
    if (!aHasWETH && bHasWETH) return 1;
    return b.timestamp - a.timestamp;
  });
}
