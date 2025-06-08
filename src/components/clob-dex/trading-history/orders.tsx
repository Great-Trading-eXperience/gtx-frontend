"use client"

import { ClobDexComponentProps } from "../clob-dex"
import { OrderItem, PoolItem } from "@/graphql/gtx/clob"
import { formatPrice } from "@/lib/utils"
import { useMarketStore } from "@/store/market-store"
import { ArrowDownUp, ChevronDown, Clock, Loader2, Wallet2, BookOpen } from "lucide-react"
import { useState } from "react"
import { formatUnits } from "viem"
import { formatDate } from "../../../../helper"

export interface OrderHistoryTableProps extends ClobDexComponentProps {
  ordersData: OrderItem[];
  ordersLoading: boolean;
  ordersError: Error | null;
  selectedPool: PoolItem;
}

export default function OrderHistoryTable({
  address,
  chainId,
  defaultChainId,
  ordersData,
  ordersLoading,
  ordersError,
  selectedPool
}: OrderHistoryTableProps) {
  type SortDirection = "asc" | "desc"
  type SortableKey = "timestamp" | "filled" | "orderId" | "price"

  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: "timestamp",
    direction: "desc",
  })

  const handleSort = (key: SortableKey) => {
    setSortConfig((currentConfig) => ({
      key,
      direction: currentConfig.key === key && currentConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  const calculateFillPercentage = (filled: string, quantity: string): string => {
    if (!filled || !quantity) return "0"
    const filledBigInt = BigInt(filled)
    const quantityBigInt = BigInt(quantity)
    if (quantityBigInt === 0n) return "0"
    return ((filledBigInt * 100n) / quantityBigInt).toString()
  }

  const sortedOrders = [...(ordersData || [])].sort((a, b) => {
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

  const getPoolName = (poolId: string): string => {
    if (!selectedPool) return "Unknown"
    return selectedPool.coin || "Unknown"
  }

  if (ordersLoading)
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )

  if (ordersError)
    return (
      <div className="p-4 bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-xl border border-red-800/50 text-red-300">
        <p>Error loading orders: {ordersError.message}</p>
      </div>
    )

  if (!ordersData || ordersData.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2">
        <BookOpen className="h-8 w-8 text-gray-400" />
        <p className="text-gray-400">No orders found</p>
      </div>
    )

  return (
    <div className="relative overflow-x-auto">
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
      <div className="space-y-2 p-4">
        {sortedOrders.map((order) => (
          <div
            key={order.orderId}
            className="grid grid-cols-6 gap-4 rounded-lg bg-gray-900/20 p-4 transition-colors hover:bg-gray-900/40"
          >
            <div className="text-gray-200">{formatDate(order.timestamp.toString())}</div>
            <div className="text-gray-200">{getPoolName(order.poolId)}</div>
            <div className="font-medium text-white">${formatPrice(formatUnits(BigInt(order.price), selectedPool?.quoteDecimals || 6))}</div>
            <div className={order.side === "Buy" ? "text-emerald-400" : "text-rose-400"}>{order.side}</div>
            <div className="font-medium text-white">{calculateFillPercentage(order.filled, order.quantity)}%</div>
            <div className="text-gray-200">{order.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

