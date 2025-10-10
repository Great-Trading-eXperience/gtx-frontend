import { TradesPonderResponse, TradesResponse } from "@/graphql/gtx/clob";
import { ProcessedTrade } from "./types";

/**
 * Process raw trades data from GraphQL into a more usable format
 * @param tradesData Raw trades data from GraphQL query
 * @returns Array of processed trade objects
 */
export function processTrades(
  tradesData: TradesPonderResponse | TradesResponse | null | undefined
): ProcessedTrade[] {
  if (!tradesData) return [];

  const trades =
    (tradesData as TradesPonderResponse)?.tradess?.items ||
    (tradesData as TradesResponse)?.trades;
  
  if (!trades) return [];

  return trades.map((trade) => ({
    poolId: trade.poolId,
    pool: trade.pool,
    price: trade.price,
    quantity: trade.quantity,
    timestamp: trade.timestamp,
  }));
} 