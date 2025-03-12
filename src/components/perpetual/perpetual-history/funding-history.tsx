"use client"

import { useState } from "react"
import { ArrowDownUp, ChevronDown, Clock, Loader2, Wallet2, DollarSign } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import request from "graphql-request"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { formatDate } from "../../../../helper"
import { formatUnits } from "viem"
import { fundingFeesQuery } from "@/graphql/gtx/perpetual.query"
import type { HexAddress } from "@/types/web3/general/address"
import { getMarketName, getTokenName, useMarketData } from "../../../../utils/useMarketData"

// Interfaces
interface FundingFee {
  id: string
  marketToken: HexAddress | null
  collateralToken: HexAddress | null
  fundingFee: string
  timestamp: number
  blockNumber: number | null
  transactionHash: string | null
}

interface FundingFeesResponse {
  fundingFees?: {
    items?: FundingFee[]
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

const FundingHistory = () => {
  const { address } = useAccount()
  type SortDirection = "asc" | "desc"
  type SortableKey = "timestamp" | "fundingFee"

  const { data: marketData } = useMarketData()
  const markets = marketData?.markets?.items || []

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: "timestamp",
    direction: "desc",
  })

  const { data, isLoading, error } = useQuery<FundingFeesResponse>({
    queryKey: ["fundingHistory", address],
    queryFn: async () => {
      if (!address) {
        throw new Error("Wallet address not available")
      }

      // Get all funding fees from the API
      const response = await request<FundingFeesResponse>(PERPETUAL_GRAPHQL_URL, fundingFeesQuery)
      
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
          <p className="text-lg text-gray-200">Connect your wallet to view funding history</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-lg text-gray-200">Loading your funding history...</p>
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

  const fundingFees = data?.fundingFees?.items || []



  const sortedFundingFees = [...fundingFees].sort((a, b) => {
    const key = sortConfig.key

    if (key === "timestamp") {
      return sortConfig.direction === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    }
    if (key === "fundingFee") {
      const aValue = BigInt(a.fundingFee || "0")
      const bValue = BigInt(b.fundingFee || "0")
      return sortConfig.direction === "asc"
        ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        : bValue < aValue ? -1 : bValue > aValue ? 1 : 0
    }
    return 0
  })

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
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
        <div className="text-sm font-medium text-gray-200">Collateral</div>
        <button
          onClick={() => handleSort("fundingFee")}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Funding Fee</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              sortConfig.key === "fundingFee" && sortConfig.direction === "asc" ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Table Body */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
        {sortedFundingFees.length > 0 ? (
          sortedFundingFees.map((fee) => (
            <div
              key={fee.id}
              className="grid grid-cols-4 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
            >
              <div className="text-gray-200">{formatDate(fee.timestamp.toString())}</div>
              <div className="text-gray-200">{getMarketName(fee.marketToken, markets)}</div>
              <div className="text-gray-200">{getTokenName(fee.collateralToken)}</div>
              <div className={BigInt(fee.fundingFee) >= 0n ? "text-emerald-400" : "text-rose-400"}>
                {formatUsd(fee.fundingFee)}
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[200px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <DollarSign className="h-8 w-8 text-gray-400" />
              <p className="text-gray-200">No funding fees found for your wallet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FundingHistory