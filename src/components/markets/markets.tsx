"use client"

import TokenABI from "@/abis/tokens/TokenABI"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { wagmiConfig } from "@/configs/wagmi"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { poolsPonderQuery, PoolsPonderResponse, poolsQuery, PoolsResponse, tradesPonderQuery, TradesPonderResponse, tradesQuery, TradesResponse } from "@/graphql/gtx/clob"
import { calculateAge, formatNumber } from '@/lib/utils'
import { useMarketStore } from "@/store/market-store"
import { getUseSubgraph } from "@/utils/env"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import request from "graphql-request"
import { CheckCircle, Clock, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { formatUnits } from "viem"
import { useChainId } from "wagmi"
import { DotPattern } from "../magicui/dot-pattern"
import { MarketListSkeleton } from "./market-list-skeleton"
import MarketSearchDialog from "./market-search-dialog"
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address"

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

interface ProcessedPool {
  id: string
  baseToken: string
  quoteToken: string
  orderBook: string
  timestamp: number
  maxOrderAmount: string
  baseSymbol: string
  quoteSymbol: string
  baseDecimals: number
  quoteDecimals: number
}

interface ProcessedTrade {
  poolId: string
  pool: string
  price: string
  quantity: string
  timestamp: number
}

export default function MarketList() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [marketData, setMarkets] = useState<MarketData[]>([])
  const [filteredMarkets, setFilteredMarkets] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPools, setIsProcessingPools] = useState(true)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [copiedToken, setCopiedToken] = useState<{ id: string; name: string } | null>(null)
  const [processedPools, setProcessedPools] = useState<ProcessedPool[]>([])
  const [processedTrades, setProcessedTrades] = useState<ProcessedTrade[]>([])
  const [showWatchlist, setShowWatchlist] = useState(false)

  const chainId = useChainId()
  const defaultChain = Number(DEFAULT_CHAIN)

  const { quoteDecimals } = useMarketStore()

  // Fetch pools data
  const { data: poolsData, error: poolsError } = useQuery<PoolsPonderResponse | PoolsResponse>({
    queryKey: ["pools", String(chainId ?? defaultChain)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery)
    },
    refetchInterval: 30000,
    staleTime: 60000, 
  })

  // Fetch trades data
  const { data: tradesData } = useQuery<TradesPonderResponse | TradesResponse>({
    queryKey: ["trades", String(chainId ?? defaultChain)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request(url, getUseSubgraph() ? tradesQuery : tradesPonderQuery)
    },
    refetchInterval: 30000,
    staleTime: 60000,
  })

  // Process pools data
  const processPools = async (poolsData: any) => {
    setIsProcessingPools(true)
    if (!poolsData) return []

    const pools = (poolsData as PoolsPonderResponse)?.poolss?.items || (poolsData as PoolsResponse)?.pools
    if (!pools) return []

    const processedPools = await Promise.all(pools.map(async pool => {
      const [baseTokenAddress, quoteTokenAddress] = [pool.baseCurrency, pool.quoteCurrency]
      
      let baseSymbol = baseTokenAddress
      let quoteSymbol = quoteTokenAddress
      let baseDecimals = 18
      let quoteDecimals = 6

      // Get base token info
      if (baseTokenAddress !== 'Unknown') {
        try {
          const symbol = await readContract(wagmiConfig, {
            address: baseTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "symbol",
          })
          const decimals = await readContract(wagmiConfig, {
            address: baseTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "decimals",
          })
          baseSymbol = symbol as string
          baseDecimals = decimals as number
        } catch (error) {
          console.error(`Error fetching base token info for ${baseTokenAddress}:`, error)
        }
      }

      // Get quote token info
      if (quoteTokenAddress !== 'USDC') {
        try {
          const symbol = await readContract(wagmiConfig, {
            address: quoteTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "symbol",
          })
          const decimals = await readContract(wagmiConfig, {
            address: quoteTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "decimals",
          })
          quoteSymbol = symbol as string
          quoteDecimals = decimals as number
        } catch (error) {
          console.error(`Error fetching quote token info for ${quoteTokenAddress}:`, error)
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
        maxOrderAmount: pool.maxOrderAmount || '0'
      }
    }))

    setIsProcessingPools(false)
    return processedPools.sort((a, b) => {
      const aHasWETH = a.baseSymbol.toLowerCase().includes('weth') || a.baseSymbol.toLowerCase().includes('eth')
      const bHasWETH = b.baseSymbol.toLowerCase().includes('weth') || b.baseSymbol.toLowerCase().includes('eth')
      if (aHasWETH && !bHasWETH) return -1
      if (!aHasWETH && bHasWETH) return 1
      return b.timestamp - a.timestamp
    })
  }

  // Process trades data
  const processTrades = (tradesData: any) => {
    if (!tradesData) return []

    const trades = (tradesData as TradesPonderResponse)?.tradess?.items || (tradesData as TradesResponse)?.trades
    if (!trades) return []

    return trades.map(trade => ({
      poolId: trade.poolId,
      pool: trade.pool,
      price: trade.price,
      quantity: trade.quantity,
      timestamp: trade.timestamp
    }))
  }

  // Calculate market metrics for a pool
  const calculatePoolMetrics = (pool: ProcessedPool, trades: ProcessedTrade[]) => {
    const poolTrades = trades.filter(trade => trade.pool === pool.orderBook || trade.poolId === pool.orderBook)
    const sortedTrades = [...poolTrades].sort((a, b) => b.timestamp - a.timestamp)
    
    const latestPrice = sortedTrades.length > 0 
      ? Number(formatUnits(BigInt(sortedTrades[0].price), pool.quoteDecimals)) 
      : 0

    let volume = BigInt(0)
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60

    sortedTrades.forEach(trade => {
      if (trade.timestamp >= twentyFourHoursAgo) {
        volume += BigInt(trade.quantity) * BigInt(trade.price) / BigInt(10 ** pool.baseDecimals)
      }
    })

    return {
      latestPrice,
      volume
    }
  }

  // First effect to process raw data
  useEffect(() => {
    const processData = async () => {
      const pools = await processPools(poolsData)
      const trades = processTrades(tradesData)
      setProcessedPools(pools)
      setProcessedTrades(trades)
    }

    processData()
  }, [poolsData, tradesData])

  // Second effect to create market data
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (processedPools.length > 0 && processedTrades.length > 0) {
      const markets = processedPools.map((pool) => {
        const metrics = calculatePoolMetrics(pool, processedTrades)
        const iconInfo = getIconInfo(pool.baseSymbol)

        return {
          id: pool.id,
          name: pool.baseSymbol,
          pair: pool.quoteSymbol,
          starred: false,
          iconInfo,
          age: calculateAge(pool.timestamp),
          timestamp: pool.timestamp,
          price: metrics.latestPrice.toFixed(2),
          volume: formatNumber(Number(formatUnits(metrics.volume, pool.quoteDecimals)), { decimals: 0 }),
          liquidity: formatNumber(pool.maxOrderAmount),
        }
      })

      setMarkets(markets)
      timer = setTimeout(() => {
        setIsLoading(false)
      }, 800)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [processedPools, processedTrades])

  // Filter data based on search query
  useEffect(() => {
    if (marketData.length > 0) {
      let filtered = marketData

      // Apply watchlist filter if enabled
      if (showWatchlist) {
        filtered = filtered.filter((item) => item.starred)
      }

      // Apply search query filter
      if (searchQuery) {
        const lowercaseQuery = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(lowercaseQuery) || item.pair.toLowerCase().includes(lowercaseQuery),
        )
      }

      setFilteredMarkets(filtered)
    }
  }, [searchQuery, marketData, showWatchlist])

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

    // Background colors for tokens - now all black
    const getBgColor = () => {
      return "#000000" // All icons now have black background
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
    // Always use the most current market data to ensure starred status is in sync
    return marketData.map((market) => ({
      id: market.id,
      name: market.name,
      pair: market.pair,
      age: market.age,
      timestamp: market.timestamp,
      volume: market.volume,
      liquidity: market.liquidity,
      verified: Math.random() > 0.7, // Randomize for demo
      iconBg: "#000000", // Black background for all icons
      hasTokenImage: market.iconInfo?.hasImage || false,
      tokenImagePath: market.iconInfo?.imagePath || null,
      starred: market.starred,
    }))
  }

  // Handle market selection from the dialog
  const handleMarketSelect = (marketId: string) => {
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

  // Toggle star/favorite status for a market
  const toggleStarred = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setMarkets((prev) => prev.map((market) => (market.id === id ? { ...market, starred: !market.starred } : market)))
  }

  // Add a function to handle toggling starred status from the search dialog
  const handleToggleStarredFromDialog = (marketId: string) => {
    setMarkets((prev) =>
      prev.map((market) => (market.id === marketId ? { ...market, starred: !market.starred } : market)),
    )
  }

  // Ensure search dialog data is refreshed when dialog opens
  useEffect(() => {
    if (isSearchDialogOpen) {
      // This will trigger a re-render with the latest market data
      setFilteredMarkets([...filteredMarkets])
    }
  }, [isSearchDialogOpen])

  return (
    <div className="px-6 py-12 mx-auto bg-black max-w-7xl">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <DotPattern />
      </div>
      <div className="flex flex-col gap-8 relative z-10">
        <h2 className="text-white text-4xl font-bold tracking-tight text-start">
          Market Overview
          <br />
          <span className="text-white/70 text-base font-normal mt-2 block">
            Explore the latest market data and trading activity across all supported tokens.
          </span>
        </h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-7xl mx-auto w-full justify-between items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
            <Input
              placeholder="Search markets"
              className="pl-12 bg-black/50 border-white/20 text-white h-12 rounded-xl focus:ring-white/40 focus:border-white/40"
              onClick={() => setIsSearchDialogOpen(true)}
              readOnly
            />
          </div>
          <div className="flex items-center gap-2 bg-black/60 border border-white/20 p-1 rounded-xl">
            <button
              onClick={() => setShowWatchlist(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showWatchlist ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              All Markets
            </button>
            <button
              onClick={() => setShowWatchlist(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showWatchlist ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Watchlist
            </button>
          </div>
        </div>

        {/* Market Table */}
        <div className="overflow-x-auto bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm max-w-7xl mx-auto w-full">
          {isLoading || isProcessingPools ? (
            <MarketListSkeleton rowCount={5} />
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Market
                  </th>
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Age
                  </th>
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.length > 0 ? (
                  filteredMarkets.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-white/10 cursor-pointer transition-colors duration-200 border-b border-white/5 last:border-0"
                      onClick={() => handleRowClick(item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <button
                              className="w-6 h-6 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent row click when copying address
                                navigator.clipboard.writeText(item.id)
                                setCopiedToken({ id: item.id, name: item.name })
                                setTimeout(() => setCopiedToken(null), 2000) // Clear after 2 seconds
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-white/70"
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
                            <div className="absolute left-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-xs rounded-md py-1.5 px-2.5 whitespace-nowrap z-10">
                              Copy token {item.name}
                            </div>
                          </div>
                          <button
                            className="text-white/50 hover:text-yellow-400 transition-colors"
                            onClick={(e) => toggleStarred(item.id, e)}
                            aria-label={item.starred ? "Remove from watchlist" : "Add to watchlist"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={item.starred ? "currentColor" : "none"}
                              stroke="currentColor"
                              className={`w-5 h-5 ${item.starred ? "text-yellow-400" : "text-white/40"}`}
                              strokeWidth={item.starred ? "0" : "2"}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              />
                            </svg>
                          </button>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/30"
                            style={{ backgroundColor: "#000000" }}
                          >
                            {item.iconInfo?.hasImage && item.iconInfo?.imagePath ? (
                              <img
                                src={item.iconInfo.imagePath || "/placeholder.svg"}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-black text-white">
                                <span className="font-bold text-xs">{item.name.substring(0, 2).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{item.name}</span>
                            <span className="text-white/60">/ {item.pair}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className="flex items-center gap-2 text-white/80"
                          title={new Date(item.timestamp * 1000).toLocaleString()}
                        >
                          <Clock className="w-4 h-4 text-white/60" />
                          {item.age}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-white font-mono">${item.price}</td>
                      <td className="px-6 py-5 text-white/90 font-mono">${item.volume}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/50">
                      {showWatchlist
                        ? "Your watchlist is empty. Star some markets to add them here."
                        : "No markets found"}
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
          marketData={getSearchDialogData()} // This will always have the latest starred status
          onSelectMarket={handleMarketSelect}
          onToggleStarred={handleToggleStarredFromDialog}
        />
      </div>
      {/* Copy Notification */}
      {copiedToken && (
        <div className="fixed bottom-6 right-6 bg-white/15 text-white px-5 py-3 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] backdrop-blur-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50 border border-white/30">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="font-medium">Copied {copiedToken.name} token to clipboard</span>
        </div>
      )}
    </div>
  )
}