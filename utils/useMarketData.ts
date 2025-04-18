import { useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { marketsQuery } from "@/graphql/gtx/perpetual"
import type { HexAddress } from "@/types/general/address"

// Interfaces
interface Market {
  id: string
  marketToken: HexAddress
  longToken: HexAddress
  shortToken: HexAddress
  timestamp: number
  blockNumber: number
  transactionHash: string
}

interface MarketsResponse {
  markets?: {
    items?: Market[]
    pageInfo?: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
    totalCount?: number
  }
}

// Token name mapping
const tokenNameMap: Record<string, string> = {
  // Add known token addresses and their names
  "0x97f3d75FcC683c8F557D637196857FA303f7cebd": "WETH",
  "0x37e9b288c56B734c0291d37af478F60cE58a9Fc6": "USDC"
}

// Hook to fetch markets data
export const useMarketData = () => {
  return useQuery<MarketsResponse>({
    queryKey: ["marketData"],
    queryFn: async () => {
      return await request<MarketsResponse>(PERPETUAL_GRAPHQL_URL, marketsQuery)
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
  })
}

// Get market name from market token address
export const getMarketName = (marketToken: string | null, markets?: Market[]): string => {
  if (!marketToken) return "Unknown"
  
  if (markets && markets.length > 0) {
    const market = markets.find(m => m.marketToken.toLowerCase() === marketToken.toLowerCase())
    if (market) {
      const longTokenName = tokenNameMap[market.longToken] || getShortAddress(market.longToken)
      const shortTokenName = tokenNameMap[market.shortToken] || getShortAddress(market.shortToken)
      return `${longTokenName}-${shortTokenName}`
    }
  }
  
  return getShortAddress(marketToken)
}

// Get token name from token address
export const getTokenName = (tokenAddress: string | null): string => {
  if (!tokenAddress) return "Unknown"
  return tokenNameMap[tokenAddress] || getShortAddress(tokenAddress)
}

// Utility to get shortened address
export const getShortAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}