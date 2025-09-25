import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  PoolsPonderResponse,
  PoolsResponse,
  TradesPonderResponse,
  TradesResponse,
  poolsPonderQuery,
  poolsQuery,
  tradesPonderQuery,
  tradesQuery,
} from '@/graphql/gtx/clob';
import { getUseSubgraph } from '@/utils/env';
import request from 'graphql-request';
import { processPools } from './process-pools';
import { processTrades } from './process-trades';
import { createMarketData } from '.';
import { MarketData } from './types';

/**
 * Fetch pools data from the GraphQL API
 * @param chainId - The chain ID to fetch data for
 * @returns Raw pools data response
 */
export async function fetchPoolsData(
  chainId: number = Number(DEFAULT_CHAIN)
): Promise<PoolsPonderResponse | PoolsResponse> {
  try {
    const url = GTX_GRAPHQL_URL(chainId);
    console.log('url', url);
    console.log('chainId', chainId)
    if (!url) throw new Error('GraphQL URL not found');

    return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
  } catch (error) {
    console.error('Error fetching pools data:', error);
    throw error;
  }
}

/**
 * Fetch trades data from the GraphQL API
 * @param chainId - The chain ID to fetch data for
 * @returns Raw trades data response
 */
export async function fetchTradesData(
  chainId: number = Number(DEFAULT_CHAIN)
): Promise<TradesPonderResponse | TradesResponse> {
  try {
    const url = GTX_GRAPHQL_URL(chainId);
    if (!url) throw new Error('GraphQL URL not found');

    return await request(url, getUseSubgraph() ? tradesQuery : tradesPonderQuery, {
      limit: 1,
    });
  } catch (error) {
    console.error('Error fetching trades data:', error);
    throw error;
  }
}

/**
 * Fetch and process all market data needed for the markets page
 *
 * @param chainId - The chain ID to fetch data for
 * @returns Processed market data ready for display
 */
export async function fetchAndProcessMarketData(
  chainId: number = Number(DEFAULT_CHAIN)
): Promise<MarketData[]> {
  try {
    const [poolsData, tradesData] = await Promise.all([
      fetchPoolsData(chainId),
      fetchTradesData(chainId),
    ]);

    const processedPools = await processPools(poolsData);
    const processedTrades = processTrades(tradesData);

    return createMarketData(processedPools, processedTrades);
  } catch (error) {
    console.error('Error processing market data:', error);
    return [];
  }
}
