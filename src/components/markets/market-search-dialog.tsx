"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, X, ChevronRight, Hexagon } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface MarketItem {
  id: string
  name: string
  pair: string
  age: string
  volume: string
  liquidity: string
  verified: boolean
  iconBg: string
  hasTokenImage: boolean
  tokenImagePath: string | null
  starred?: boolean
}

interface MarketSearchDialogProps {
  isOpen: boolean
  onClose: () => void
  marketData: MarketItem[]
  onSelectMarket?: (marketId: string) => void
  onToggleStarred?: (marketId: string) => void
}

export default function MarketSearchDialog({
  isOpen,
  onClose,
  marketData,
  onSelectMarket,
  onToggleStarred,
}: MarketSearchDialogProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMarkets, setFilteredMarkets] = useState<MarketItem[]>([])
  const [showWatchlist, setShowWatchlist] = useState(false)

  // Reset search query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setShowWatchlist(false)
    }
  }, [isOpen])

  // Filter markets when search query changes or watchlist filter changes or when marketData changes
  useEffect(() => {
    let filtered = marketData

    // Apply watchlist filter if enabled
    if (showWatchlist) {
      filtered = filtered.filter((market) => market.starred)
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (market) =>
          market.name.toLowerCase().includes(lowercaseQuery) ||
          market.pair.toLowerCase().includes(lowercaseQuery) ||
          market.id.toLowerCase().includes(lowercaseQuery),
      )
    }

    setFilteredMarkets(filtered)
  }, [searchQuery, marketData, showWatchlist])

  // Handle market selection
  const handleMarketSelect = (marketId: string) => {
    if (onSelectMarket) {
      onSelectMarket(marketId)
    } else {
      router.push(`/spot/${marketId}`)
    }
    onClose()
  }

  // Handle star toggle
  const handleToggleStar = (marketId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click

    // Call the parent component's handler
    if (onToggleStarred) {
      onToggleStarred(marketId)

      // Also update the local filtered markets for immediate UI feedback
      setFilteredMarkets((prevFiltered) =>
        prevFiltered.map((market) => (market.id === marketId ? { ...market, starred: !market.starred } : market)),
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] bg-black border-white/10 p-0 gap-0 flex flex-col">
        <div className="p-4 pb-0 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Market Search</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
            <Input
              placeholder="Search token or paste contract address"
              className="pl-10 py-4 bg-white/5 border-white/10 text-white h-10 text-base rounded-lg focus-visible:ring-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 bg-black/60 border border-white/20 p-1 rounded-lg mb-4">
            <button
              onClick={() => setShowWatchlist(false)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showWatchlist ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              All Markets
            </button>
            <button
              onClick={() => setShowWatchlist(true)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showWatchlist ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Watchlist
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 flex-shrink-0">
          <h3 className="text-base font-medium text-white">{showWatchlist ? "Watchlist" : "All Markets"}</h3>
          <ChevronRight className="h-4 w-4 text-white/50" />
        </div>

        <div className="flex-grow overflow-y-auto">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                onClick={() => handleMarketSelect(market.id)}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        className="text-white/50 hover:text-yellow-400 transition-colors mr-2"
                        onClick={(e) => handleToggleStar(market.id, e)}
                        aria-label={market.starred ? "Remove from watchlist" : "Add to watchlist"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={market.starred ? "currentColor" : "none"}
                          stroke="currentColor"
                          className={`w-5 h-5 ${market.starred ? "text-yellow-400" : "text-white/40"}`}
                          strokeWidth={market.starred ? "0" : "2"}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      </button>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden border border-white/10 bg-white/5">
                        {market.hasTokenImage ? (
                          <img
                            src={market.tokenImagePath || ""}
                            alt={market.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Hexagon size={20} className="text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-base font-medium">{market.name}</span>
                          <span className="text-white/50">{market.pair}</span>
                        </div>
                        <div className="text-white/30 text-sm mt-1">{market.age}</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <div className="text-white/50 text-xs">Vol</div>
                        <div className="text-white">{market.volume}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/50 text-xs">Liq</div>
                        <div className="text-white">{market.liquidity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-white/50">
              {showWatchlist
                ? "Your watchlist is empty. Star some markets to add them here."
                : "No markets found matching your search."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
