"use client"

import { useState } from "react"
import { ArrowDownUp, ChevronDown, Clock, Loader2, Wallet2, History } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import request from "graphql-request"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { formatDate } from "../../../../helper"
import { formatUnits } from "viem"
import { liquidationsQuery } from "@/graphql/gtx/perpetual.query"
import type { HexAddress } from "@/types/web3/general/address"
import { getMarketName, getTokenName, useMarketData } from "../../../../utils/useMarketData"

// Interfaces
interface Liquidation {
    id: string
    key: string
    account: HexAddress
    liquidator: HexAddress
    marketToken: HexAddress
    collateralToken: HexAddress
    collateralAmount: string
    liquidationPrice: string
    liquidationFee: string
    timestamp: number
    blockNumber: number
    transactionHash: string
  }
  
  interface LiquidationsResponse {
    liquidations?: {
      items?: Liquidation[]
      pageInfo?: {
        endCursor: string
        hasNextPage: boolean
        hasPreviousPage: boolean
        startCursor: string
      }
      totalCount?: number
    }
  }
  
  const formatUsd = (amount: string): string => {
    return Number(formatUnits(BigInt(amount), 18)).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  
  const formatAmount = (amount: string): string => {
    return Number(formatUnits(BigInt(amount), 18)).toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  }
  
  const TradeHistory = () => {
    const { address } = useAccount()
    type SortDirection = "asc" | "desc"
    type SortableKey = "timestamp" | "liquidationPrice" | "collateralAmount"
  
    const { data: marketData } = useMarketData()
    const markets = marketData?.markets?.items || []
  
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
      key: "timestamp",
      direction: "desc",
    })
  
    const { data, isLoading, error } = useQuery<LiquidationsResponse>({
      queryKey: ["tradeHistory", address],
      queryFn: async () => {
        if (!address) {
          throw new Error("Wallet address not available")
        }
  
        // Get liquidations from the API
        const response = await request<LiquidationsResponse>(PERPETUAL_GRAPHQL_URL, liquidationsQuery)
        
        return response
      },
      enabled: !!address,
      staleTime: 30000,
      refetchInterval: 30000,
    })
  
    const handleSort = (key: SortableKey) => {
      setSortConfig((prevConfig) => ({
        key: key,
        direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
      }))
    }
  
    if (!address) {
      return (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Wallet2 className="h-12 w-12 text-gray-400" />
            <p className="text-lg text-gray-200">Connect your wallet to view trade history</p>
          </div>
        </div>
      )
    }
  
    if (isLoading) {
      return (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-lg text-gray-200">Loading your trade history...</p>
          </div>
        </div>
      )
    }
  
    if (error) {
      return (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-rose-800/30 bg-rose-900/20 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            <p className="text-lg text-rose-200">{error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        </div>
      )
    }
  
    const liquidations = data?.liquidations?.items || []
  
    // Filter for trades related to the current user (either as account or liquidator)
    const userLiquidations = liquidations.filter(
      liq => liq.account.toLowerCase() === address.toLowerCase() || 
             liq.liquidator.toLowerCase() === address.toLowerCase()
    )
  
    const sortedLiquidations = [...userLiquidations].sort((a, b) => {
      const key = sortConfig.key
  
      if (key === "timestamp") {
        return sortConfig.direction === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
      }
      if (key === "liquidationPrice") {
        const aValue = BigInt(a.liquidationPrice || "0")
        const bValue = BigInt(b.liquidationPrice || "0")
        return sortConfig.direction === "asc"
          ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
          : bValue < aValue ? -1 : bValue > aValue ? 1 : 0
      }
      if (key === "collateralAmount") {
        const aValue = BigInt(a.collateralAmount || "0")
        const bValue = BigInt(b.collateralAmount || "0")
        return sortConfig.direction === "asc"
          ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
          : bValue < aValue ? -1 : bValue > aValue ? 1 : 0
      }
      return 0
    })
  
    return (
      <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => handleSort("timestamp")}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <Clock className="h-4 w-4" />
            <span>Time</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === "timestamp" && sortConfig.direction === "asc" ? "rotate-180" : ""
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Market</div>
          <div className="text-sm font-medium text-gray-200">Type</div>
          <button
            onClick={() => handleSort("liquidationPrice")}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Price</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === "liquidationPrice" && sortConfig.direction === "asc" ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={() => handleSort("collateralAmount")}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Size</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === "collateralAmount" && sortConfig.direction === "asc" ? "rotate-180" : ""
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Fee</div>
        </div>
  
        {/* Table Body */}
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
          {sortedLiquidations.length > 0 ? (
            sortedLiquidations.map((liquidation) => (
              <div
                key={liquidation.id}
                className="grid grid-cols-6 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
              >
                <div className="text-gray-200">{formatDate(liquidation.timestamp.toString())}</div>
                <div className="text-gray-200">{getMarketName(liquidation.marketToken, markets)}</div>
                <div className="text-rose-400">
                  {liquidation.account.toLowerCase() === address.toLowerCase() ? "Liquidated" : "Liquidator"}
                </div>
                <div className="font-medium text-white">{formatUsd(liquidation.liquidationPrice)}</div>
                <div className="font-medium text-white">
                  {formatAmount(liquidation.collateralAmount)} {getTokenName(liquidation.collateralToken)}
                </div>
                <div className="text-amber-400">{formatAmount(liquidation.liquidationFee)} {getTokenName(liquidation.collateralToken)}</div>
              </div>
            ))
          ) : (
            <div className="flex min-h-[200px] items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <History className="h-8 w-8 text-gray-400" />
                <p className="text-gray-200">No trade history found for your wallet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  export default TradeHistory