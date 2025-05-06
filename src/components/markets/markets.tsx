"use client"

import TokenABI from "@/abis/tokens/TokenABI"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { wagmiConfig } from "@/configs/wagmi"
import { GTX_GRAPHQL_URL } from "@/constants/subgraph-url"
import { poolsPonderQuery, PoolsPonderResponse, poolsQuery, PoolsResponse, tradesPonderQuery, TradesPonderResponse, tradesQuery, TradesResponse } from "@/graphql/gtx/clob"
import { calculateAge, formatNumber } from '@/lib/utils'
import { getUseSubgraph } from "@/utils/env"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import request from "graphql-request"
import { CheckCircle, Clock, Hexagon, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { formatUnits } from "viem"
import { useChainId } from "wagmi"
import { DotPattern } from "../magicui/dot-pattern"
import { MarketListSkeleton } from "./market-list-skeleton"
import MarketSearchDialog from "./market-search-dialog"

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
  const router = useRouter() // Add the router
  const [searchQuery, setSearchQuery] = useState("")
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [filteredMarkets, setFilteredMarkets] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPools, setIsProcessingPools] = useState(true)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [copiedToken, setCopiedToken] = useState<{ id: string; name: string } | null>(null)
  const [processedPools, setProcessedPools] = useState<ProcessedPool[]>([])
  const [processedTrades, setProcessedTrades] = useState<ProcessedTrade[]>([])

  const chainId = useChainId()
  const defaultChain = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN)

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
      console.log(trade.timestamp, '-', twentyFourHoursAgo)
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

        if(pool.baseSymbol.toLowerCase().includes("eth")) {
          console.log(pool)
          console.log(metrics)
          console.log(processedTrades)
        }

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
    if (markets.length > 0) {
      if (!searchQuery) {
        setFilteredMarkets(markets)
      } else {
        const lowercaseQuery = searchQuery.toLowerCase()
        const filtered = markets.filter(
          (item) =>
            item.name.toLowerCase().includes(lowercaseQuery) || item.pair.toLowerCase().includes(lowercaseQuery),
        )
        setFilteredMarkets(filtered)
      }
    }
  }, [searchQuery, markets])

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
    return markets.map((market) => ({
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
    const selectedMarket = markets.find((m) => m.id === marketId)
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
          {(isLoading || isProcessingPools) ? (
            <MarketListSkeleton rowCount={5} />
          ) : (
            <table className="w-full min-w-[800px] border-separate border-spacing-y-1">
              <thead>
                <tr className="text-gray-300 text-xs">
                  <th className="text-left p-3 font-medium underline text-base">Market</th>
                  <th className="text-left p-3 font-medium underline text-base">Age</th>
                  <th className="text-left p-3 font-medium underline text-base">Price</th>
                  <th className="text-left p-3 font-medium underline text-base">Volume</th>
                  {/* <th className="text-left p-3 font-medium underline text-base">Liquidity</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.length > 0 ? (
                  filteredMarkets.map((item, index) => (
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
                      {/* <td className="p-2">{item.liquidity}</td> */}
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