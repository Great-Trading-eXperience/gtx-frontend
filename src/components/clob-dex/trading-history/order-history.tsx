"use client"

import { useState } from "react"
import { ArrowDownUp, ChevronDown, Clock, Loader2, Wallet2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAccount, useChainId } from "wagmi"
import request from "graphql-request"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { formatDate } from "../../../../helper"
import { formatUnits } from "viem"
import { orderHistorysQuery, poolsQuery } from "@/graphql/gtx/gtx.query"
import type { HexAddress } from "@/types/web3/general/address"
import { useMarketStore } from "@/store/market-store"

// Interfaces remain the same...
interface UserInfo {
  amount: string
  currency: HexAddress
  lockedAmount: string
  name: string
  symbol: string
  user: HexAddress
}

interface OrderItem {
  expiry: number
  filled: string
  id: string
  orderId: string
  poolId: string
  price: string
  quantity: string
  side: string
  status: string
  timestamp: number
  type: string
  user: UserInfo
}

interface Pool {
  id: string
  coin: string
}

interface OrdersResponse {
  orderss?: {
    items?: OrderItem[]
    pageInfo?: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
    totalCount?: number
  }
}

interface PoolsResponse {
  poolss?: {
    items?: Pool[]
  }
}

const formatPrice = (price: string): string => {
  return Number(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const calculateFillPercentage = (filled: string, quantity: string): string => {
  if (!filled || !quantity || filled === "0" || quantity === "0") return "0"

  const filledBN = BigInt(filled)
  const quantityBN = BigInt(quantity)

  if (quantityBN === 0n) return "0"

  const percentage = (filledBN * 10000n) / quantityBN
  return (Number(percentage) / 100).toFixed(2)
}

const OrderHistoryTable = () => {
  const { address } = useAccount()
  type SortDirection = "asc" | "desc"
  type SortableKey = "timestamp" | "filled" | "orderId" | "price"

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: "timestamp",
    direction: "desc",
  })

  const chainId = useChainId()
  const defaultChain = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN)

  const { quoteDecimals } = useMarketStore()

  const { data: poolsData } = useQuery<PoolsResponse>({
    queryKey: ["pools"],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request<PoolsResponse>(url, poolsQuery)
    },
    staleTime: 60000,
  })

  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ["orderHistory", address],
    queryFn: async () => {
      if (!address) {
        throw new Error("Wallet address not available")
      }

      const userAddress = address.toLowerCase() as HexAddress
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request<OrdersResponse>(url, orderHistorysQuery, { userAddress })
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
          <p className="text-lg text-gray-200">Connect your wallet to view order history</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-lg text-gray-200">Loading your order history...</p>
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

  const orders = data?.orderss?.items || []

  const getPoolName = (poolId: string): string => {
    if (!poolsData?.poolss?.items) return "Unknown"
    const pool = poolsData.poolss.items.find((p) => p.id === poolId)
    return pool ? pool.coin : "Unknown"
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const key = sortConfig.key

    if (key === "timestamp") {
      return sortConfig.direction === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    }
    if (key === "filled") {
      const aPercentage = Number(calculateFillPercentage(a.filled, a.quantity))
      const bPercentage = Number(calculateFillPercentage(b.filled, b.quantity))
      return sortConfig.direction === "asc" ? aPercentage - bPercentage : bPercentage - aPercentage
    }
    if (key === "orderId") {
      const aValue = Number.parseInt(a.orderId || "0")
      const bValue = Number.parseInt(b.orderId || "0")
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
    }
    if (key === "price") {
      const aValue = BigInt(a.price || "0")
      const bValue = BigInt(b.price || "0")
      return sortConfig.direction === "asc"
        ? aValue < bValue
          ? -1
          : aValue > bValue
            ? 1
            : 0
        : bValue < aValue
          ? -1
          : bValue > aValue
            ? 1
            : 0
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
            className={`h-4 w-4 transition-transform ${sortConfig.key === "timestamp" && sortConfig.direction === "asc" ? "rotate-180" : ""
              }`}
          />
        </button>
        <div className="text-sm font-medium text-gray-200">Pool</div>
        <button
          onClick={() => handleSort("price")}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Price</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${sortConfig.key === "price" && sortConfig.direction === "asc" ? "rotate-180" : ""
              }`}
          />
        </button>
        <div className="text-sm font-medium text-gray-200">Side</div>
        <button
          onClick={() => handleSort("filled")}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
        >
          <span>Filled</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${sortConfig.key === "filled" && sortConfig.direction === "asc" ? "rotate-180" : ""
              }`}
          />
        </button>
        <div className="text-sm font-medium text-gray-200">Status</div>
      </div>

      {/* Table Body */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
        {sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-6 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
            >
              <div className="text-gray-200">{formatDate(order.timestamp.toString())}</div>
              <div className="text-gray-200">{getPoolName(order.poolId)}</div>
              <div className="font-medium text-white">${formatPrice(formatUnits(BigInt(order.price), quoteDecimals))}</div>
              <div className={order.side === "Buy" ? "text-emerald-400" : "text-rose-400"}>{order.side}</div>
              <div className="font-medium text-white">{calculateFillPercentage(order.filled, order.quantity)}%</div>
              <div
                className={
                  order.status === "FILLED"
                    ? "text-emerald-400"
                    : order.status === "CANCELLED"
                      ? "text-rose-400"
                      : "text-amber-400"
                }
              >
                {order.status}
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[200px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <ArrowDownUp className="h-8 w-8 text-gray-400" />
              <p className="text-gray-200">No orders found for your wallet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistoryTable

