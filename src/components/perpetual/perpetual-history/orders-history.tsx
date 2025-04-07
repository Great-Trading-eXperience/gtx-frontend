"use client"

import { useState } from "react"
import { ArrowDownUp, ChevronDown, Clock, Loader2, Wallet2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import request from "graphql-request"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { formatDate } from "../../../../helper"
import { formatUnits } from "viem"
import { ordersQuery } from "@/graphql/gtx/perpetual.query"
import type { HexAddress } from "@/types/web3/general/address"
import { useMarketData } from "../../../../utils/useMarketData"

// Interfaces
interface Order {
    id: string
    key: string
    account: HexAddress
    receiver: HexAddress
    callbackContract: HexAddress
    marketToken: HexAddress
    initialCollateralToken: HexAddress
    orderType: string
    sizeDeltaUsd: string
    initialCollateralDeltaAmount: string
    triggerPrice: string
    acceptablePrice: string
    executionFee: string
    isLong: boolean
    isFrozen: boolean
    isExecuted: boolean
    isCancelled: boolean
    validFromTime: number
    updatedAtTime: number
    cancellationReceiver: HexAddress
    uiFeeReceiver: HexAddress
    timestamp: number
    blockNumber: number
    transactionHash: string
}

interface OrdersResponse {
    orders?: {
        items?: Order[]
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

const OrdersHistory = () => {
    const { address } = useAccount()
    type SortDirection = "asc" | "desc"
    type SortableKey = "timestamp" | "sizeDeltaUsd" | "initialCollateralDeltaAmount"

    const { data: marketData } = useMarketData()
    const markets = marketData?.markets?.items || []

    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: SortDirection }>({
        key: "timestamp",
        direction: "desc",
    })

    const { data, isLoading, error } = useQuery<OrdersResponse>({
        queryKey: ["ordersHistory", address],
        queryFn: async () => {
            if (!address) {
                throw new Error("Wallet address not available")
            }

            // Get all orders from the API
            const response = await request<OrdersResponse>(PERPETUAL_GRAPHQL_URL, ordersQuery)

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

    const orders = data?.orders?.items || []

    // Get market name from token address - in real app, you might have a mapping or API
    const getMarketName = (marketToken: string, markets: any[]): string => {
        // Try to find the market in the markets array
        const market = markets.find(m => m.marketToken === marketToken)

        // If found, return the market name, otherwise return the truncated address
        if (market && market.name) {
            return market.name
        }
        // This is a placeholder - in a real implementation, you'd lookup from a mapping
        const truncated = `${marketToken.substring(0, 6)}...${marketToken.substring(marketToken.length - 4)}`
        return truncated
    }

    const getOrderStatus = (order: Order): string => {
        if (order.isCancelled === true) return "CANCELLED"
        if (order.isExecuted === true) return "EXECUTED"
        if (order.isFrozen) return "FROZEN"
        return "PENDING"
    }

    const getOrderType = (order: Order): string => {
        // Map numeric order types to readable strings
        const orderTypes: Record<string, string> = {
            "0": "MARKET",
            "1": "LIMIT"
        }
        return orderTypes[order.orderType.toString()] || order.orderType.toString()
    }

    const sortedOrders = [...orders].sort((a, b) => {
        const key = sortConfig.key

        if (key === "timestamp") {
            return sortConfig.direction === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
        }
        if (key === "sizeDeltaUsd") {
            const aValue = BigInt(a.sizeDeltaUsd || "0")
            const bValue = BigInt(b.sizeDeltaUsd || "0")
            return sortConfig.direction === "asc"
                ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
                : bValue < aValue ? -1 : bValue > aValue ? 1 : 0
        }
        if (key === "initialCollateralDeltaAmount") {
            const aValue = BigInt(a.initialCollateralDeltaAmount || "0")
            const bValue = BigInt(b.initialCollateralDeltaAmount || "0")
            return sortConfig.direction === "asc"
                ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
                : bValue < aValue ? -1 : bValue > aValue ? 1 : 0
        }
        return 0
    })

    return (
        <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
            {/* Header */}
            <div className="grid grid-cols-7 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
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
                <div className="text-sm font-medium text-gray-200">Market</div>
                <div className="text-sm font-medium text-gray-200">Type</div>
                <div className="text-sm font-medium text-gray-200">Side</div>
                <button
                    onClick={() => handleSort("sizeDeltaUsd")}
                    className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
                >
                    <span>Size</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${sortConfig.key === "sizeDeltaUsd" && sortConfig.direction === "asc" ? "rotate-180" : ""
                            }`}
                    />
                </button>
                <button
                    onClick={() => handleSort("initialCollateralDeltaAmount")}
                    className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
                >
                    <span>Collateral</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${sortConfig.key === "initialCollateralDeltaAmount" && sortConfig.direction === "asc" ? "rotate-180" : ""
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
                            className="grid grid-cols-7 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
                        >
                            <div className="text-gray-200">{formatDate(order.timestamp.toString())}</div>
                            <div className="text-gray-200">{getMarketName(order.marketToken, markets)}</div>
                            <div className="text-gray-200">{getOrderType(order)}</div>
                            <div className={order.isLong ? "text-emerald-400" : "text-rose-400"}>
                                {order.isLong ? "Long" : "Short"}
                            </div>
                            <div className="font-medium text-white">{formatUsd(order.sizeDeltaUsd)}</div>
                            <div className="font-medium text-white">{formatAmount(order.initialCollateralDeltaAmount)}</div>
                            <div
                                className={
                                    getOrderStatus(order) === "EXECUTED"
                                        ? "text-emerald-400"
                                        : getOrderStatus(order) === "CANCELLED"
                                            ? "text-rose-400"
                                            : getOrderStatus(order) === "FROZEN"
                                                ? "text-amber-400"
                                                : "text-blue-400"
                                }
                            >
                                {getOrderStatus(order)}
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

export default OrdersHistory