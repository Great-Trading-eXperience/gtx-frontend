"use client"

import { useState, useEffect } from "react"
import { Search, CheckCircle, Hexagon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MarketSearchDialog from "./market-search-dialog"
import { MarketListSkeleton } from "./market-list-skeleton"
import { useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { poolsQuery, tradesQuery } from "@/graphql/gtx/gtx.query"
import { formatUnits } from "viem"
import { DotPattern } from "../magicui/dot-pattern"
import { useRouter } from "next/navigation"

// Define interfaces for the data
interface PoolItem {
  baseCurrency: string
  coin: string
  id: string
  lotSize: string
  maxOrderAmount: string
  orderBook: string
  quoteCurrency: string
  timestamp: number
}

interface TradeItem {
  id: string
  orderId: string
  poolId: string
  price: string
  quantity: string
  timestamp: number
  transactionId: string
  order?: {
    expiry: number
    filled: string
    id: string
    orderId: string
    poolId: string
    price: string
    type: string
    timestamp: number
    status: string
    side: string
    quantity: string
    user: {
      amount: string
      currency: string
      lockedAmount: string
      name: string
      symbol: string
      user: string
    }
    pool: PoolItem
  }
}

interface PoolsResponse {
  poolss: {
    items: PoolItem[]
    totalCount: number
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
  }
}

interface TradesResponse {
  tradess: {
    items: TradeItem[]
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
    totalCount: number
  }
}

interface MarketData {
  id: string
  name: string
  pair: string
  starred: boolean
  iconInfo: {
    hasImage: boolean
    imagePath: string | null
    bg: string
  }
  age: string
  timestamp: number
  price: string
  volume: string
  liquidity: string
}

export default function MarketList() {
  const router = useRouter() // Add the router
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<{ id: string; name: string } | null>(null)

  // Fetch pools data
  const { data: poolsData } = useQuery<PoolsResponse>({
    queryKey: ["pools"],
    queryFn: async () => request(GTX_GRAPHQL_URL, poolsQuery),
    staleTime: 60000, // 1 minute - pools don't change often
  })

  // Fetch trades data
  const { data: tradesData } = useQuery<TradesResponse>({
    queryKey: ["trades"],
    queryFn: async () => request(GTX_GRAPHQL_URL, tradesQuery),
    refetchInterval: 30000, // 30 seconds
    staleTime: 0,
  })

  // Format large numbers with K, M, B suffixes
  const formatNumber = (value: bigint | number, decimals = 6) => {
    const num = typeof value === "bigint" ? Number(formatUnits(value, decimals)) : value

    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K"
    return num.toFixed(decimals).replace(/\.?0+$/, "") // Remove trailing zeros
  }

  // Calculate age directly from timestamp
  const calculateAge = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000)
    const ageInSeconds = now - timestamp

    // Convert to appropriate time unit
    if (ageInSeconds < 60) {
      return `${ageInSeconds}s`
    } else if (ageInSeconds < 3600) {
      return `${Math.floor(ageInSeconds / 60)}m`
    } else if (ageInSeconds < 86400) {
      return `${Math.floor(ageInSeconds / 3600)}h`
    } else {
      return `${Math.floor(ageInSeconds / 86400)}d`
    }
  }

  // Process data from API to display format
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (poolsData?.poolss?.items && tradesData?.tradess?.items) {
      // Sort pools by timestamp (newest first) for better user experience
      const sortedPools = [...poolsData.poolss.items].sort((a, b) => {
        // Check if either pool has WETH
        const aHasWETH = a.coin?.toLowerCase().includes("weth") || a.coin?.toLowerCase().includes("eth")
        const bHasWETH = b.coin?.toLowerCase().includes("weth") || b.coin?.toLowerCase().includes("eth")

        // If a has WETH and b doesn't, a comes first
        if (aHasWETH && !bHasWETH) return -1
        // If b has WETH and a doesn't, b comes first
        if (!aHasWETH && bHasWETH) return 1
        // Otherwise sort by timestamp (newest first)
        return b.timestamp - a.timestamp
      })

      const processedData: MarketData[] = sortedPools.map((pool) => {
        // Extract token name and pair from coin property
        let tokenName = "Unknown"
        let tokenPair = "USDC"

        if (pool.coin) {
          const parts = pool.coin.split("/")
          if (parts.length === 2) {
            tokenName = parts[0]
            tokenPair = parts[1]
          }
        }

        // Filter trades for this pool
        const poolTrades = tradesData.tradess.items.filter((trade) => trade.poolId === pool.id)

        // Sort trades by timestamp (newest first)
        const sortedTrades = [...poolTrades].sort((a, b) => b.timestamp - a.timestamp)

        // Calculate various metrics
        const latestPrice = sortedTrades.length > 0 ? Number(formatUnits(BigInt(sortedTrades[0].price), 12)) : 0

        // Calculate volumes
        let volume = BigInt(0)
        const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60

        // Go through trades to calculate volumes
        sortedTrades.forEach((trade) => {
          if (trade.timestamp >= twentyFourHoursAgo) {
            // Add to 24h volume
            volume += BigInt(trade.quantity)
          }
        })

        // Determine icons based on token name from coin property
        const iconInfo = getIconInfo(tokenName)

        // Format the final data
        return {
          id: pool.id,
          name: tokenName,
          pair: tokenPair,
          starred: false, // Could be user preference, default false
          iconInfo: iconInfo,
          age: calculateAge(pool.timestamp),
          timestamp: pool.timestamp,
          price: latestPrice.toFixed(4),
          volume: formatNumber(volume),
          liquidity: formatNumber(BigInt(pool.maxOrderAmount || "0")),
        }
      })

      setMarketData(processedData)

      // Add a small delay to make skeleton noticeable during fast loads
      timer = setTimeout(() => {
        setIsLoading(false)
      }, 800)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [poolsData, tradesData])

  // Filter data based on search query
  useEffect(() => {
    if (marketData.length > 0) {
      if (!searchQuery) {
        setFilteredData(marketData)
      } else {
        const lowercaseQuery = searchQuery.toLowerCase()
        const filtered = marketData.filter(
          (item) =>
            item.name.toLowerCase().includes(lowercaseQuery) || item.pair.toLowerCase().includes(lowercaseQuery),
        )
        setFilteredData(filtered)
      }
    }
  }, [searchQuery, marketData])

  // Set loading state
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (poolsData && tradesData) {
      // Add a small delay to make skeleton noticeable during fast loads
      timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
    } else {
      setIsLoading(true)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [poolsData, tradesData])
  useEffect(() => {
    if (marketData.length > 0) {
      if (!searchQuery) {
        setFilteredData(marketData)
      } else {
        const lowercaseQuery = searchQuery.toLowerCase()
        const filtered = marketData.filter(
          (item) =>
            item.name.toLowerCase().includes(lowercaseQuery) || item.pair.toLowerCase().includes(lowercaseQuery),
        )
        setFilteredData(filtered)
      }
    }
  }, [searchQuery, marketData])

  // Helper to determine icon and background color based on token name
  function getIconInfo(tokenName: string) {
    const name = tokenName.toLowerCase()
    const availableTokenImages = [
      "bitcoin",
      "btc",
      "wbtc",
      "doge",
      "eth",
      "weth",
      "floki",
      "link",
      "pepe",
      "shiba",
      "shib",
      "trump",
      "usdc",
      "usdt",
    ]

    // Determine which image file to use
    let tokenImageName = ""

    if (name.includes("btc") || name.includes("bitcoin")) {
      tokenImageName = "bitcoin"
    } else if (name.includes("doge")) {
      tokenImageName = "doge"
    } else if (name.includes("eth")) {
      tokenImageName = "eth"
    } else if (name.includes("floki")) {
      tokenImageName = "floki"
    } else if (name.includes("link")) {
      tokenImageName = "link"
    } else if (name.includes("pepe")) {
      tokenImageName = "pepe"
    } else if (name.includes("shib")) {
      tokenImageName = "shiba"
    } else if (name.includes("trump")) {
      tokenImageName = "trump"
    } else if (name.includes("usdc") || name.includes("usdt")) {
      tokenImageName = "usdc"
    }

    // Background colors for tokens
    const getBgColor = () => {
      if (name.includes("eth") || name.includes("weth")) return "#3b82f6"
      if (name.includes("btc") || name.includes("wbtc") || name.includes("bitcoin")) return "#f59e0b"
      if (name.includes("usdc") || name.includes("usdt")) return "#10b981"
      if (name.includes("link")) return "#2563eb"
      if (name.includes("pepe")) return "#65a30d"
      if (name.includes("sol")) return "#9333ea"
      if (name.includes("ada")) return "#0891b2"
      if (name.includes("shib") || name.includes("shiba")) return "#f97316"
      if (name.includes("doge")) return "#d97706"
      if (name.includes("floki")) return "#7c3aed"

      const backgrounds = ["#8b5cf6", "#eab308", "#f59e0b", "#ef4444", "#10b981"]
      return backgrounds[Math.floor(Math.random() * backgrounds.length)]
    }

    // Determine if we need to use an image or the fallback Hexagon icon
    const hasTokenImage = availableTokenImages.some((token) => name.includes(token))

    return {
      hasImage: hasTokenImage,
      imagePath: hasTokenImage ? `/tokens/${tokenImageName}.png` : null,
      bg: getBgColor(),
    }
  }

  // Prepare data for market search dialog
  const getSearchDialogData = () => {
    return marketData.map((market) => ({
      id: market.id,
      name: market.name,
      pair: market.pair,
      age: market.age,
      timestamp: market.timestamp,
      volume: market.volume,
      liquidity: market.liquidity,
      verified: Math.random() > 0.7, // Randomize for demo
      iconBg: market.iconInfo?.bg || "#374151",
      hasTokenImage: market.iconInfo?.hasImage || false,
      tokenImagePath: market.iconInfo?.imagePath || null,
    }))
  }

  // Handle market selection from the dialog
  const handleMarketSelect = (marketId: string) => {
    setSelectedMarketId(marketId)
    const selectedMarket = marketData.find((m) => m.id === marketId)
    if (selectedMarket) {
      console.log(`Selected market: ${selectedMarket.name}/${selectedMarket.pair}`)
      // Navigate to the spot page with the pool ID
      router.push(`/spot/${marketId}`)
    }
  }

  // Handle row click to navigate to spot trading page
  const handleRowClick = (poolId: string) => {
    router.push(`/spot/${poolId}`)
  }

  return (
    <div className="px-4 py-3 mx-auto bg-black">
      <DotPattern />
      <div className="flex flex-col gap-3">
        {/* Search and Watchlist */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search markets"
              className="pl-10 bg-[#121212] border-white/20 text-gray-300 h-9"
              onClick={() => setIsSearchDialogOpen(true)}
              readOnly
            />
          </div>
          <Button variant="outline" className="border-white/20 text-gray-300 h-9 hover:bg-[#1A1A1A]">
            Watchlist
          </Button>
        </div>

        {/* Market Table */}
        <div className="overflow-x-auto bg-black/80 border border-white/20 p-2 rounded-lg z-30">
          {isLoading ? (
            <MarketListSkeleton rowCount={5} />
          ) : (
            <table className="w-full min-w-[800px] border-separate border-spacing-y-1">
              <thead>
                <tr className="text-gray-300 text-xs">
                  <th className="text-left p-3 font-medium underline text-base">Market</th>
                  <th className="text-left p-3 font-medium underline text-base">Age</th>
                  <th className="text-left p-3 font-medium underline text-base">Price</th>
                  <th className="text-left p-3 font-medium underline text-base">Volume</th>
                  <th className="text-left p-3 font-medium underline text-base">Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-[#1A1A1A] cursor-pointer rounded-lg" 
                      onClick={() => handleRowClick(item.id)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="relative group">
                            <button
                              className="w-5 h-5 flex items-center justify-center border border-gray-600 rounded-sm hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent row click when copying address
                                navigator.clipboard.writeText(item.id)
                                setCopiedToken({ id: item.id, name: item.name })
                                setTimeout(() => setCopiedToken(null), 2000) // Clear after 2 seconds
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            <div className="absolute left-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                              Copy token {item.name}
                            </div>
                          </div>
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: item.iconInfo?.bg || "#374151" }}
                          >
                            {item.iconInfo?.hasImage ? (
                              <img
                                src={item.iconInfo?.imagePath || ""}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Hexagon size={16} className="text-white" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-400">/ {item.pair}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div
                          className="flex items-center gap-1 text-gray-300"
                          title={new Date(item.timestamp * 1000).toLocaleString()}
                        >
                          <Clock className="w-4 h-4" />
                          {item.age}
                        </div>
                      </td>
                      <td className="p-2">{item.price}</td>
                      <td className="p-2">{item.volume}</td>
                      <td className="p-2">{item.liquidity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-400">
                      No markets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Market Search Dialog */}
        <MarketSearchDialog
          isOpen={isSearchDialogOpen}
          onClose={() => setIsSearchDialogOpen(false)}
          marketData={getSearchDialogData()}
          onSelectMarket={handleMarketSelect}
        />
      </div>
      {/* Copy Notification */}
      {copiedToken && (
        <div className="fixed bottom-4 right-4 bg-blue-800/25 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 z-50">
          <CheckCircle className="h-5 w-5" />
          <span>Copied {copiedToken.name} token to clipboard!</span>
        </div>
      )}
    </div>
  )
}