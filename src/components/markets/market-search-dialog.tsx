"use client"

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
}

interface MarketSearchDialogProps {
  isOpen: boolean
  onClose: () => void
  marketData: MarketItem[]
  onSelectMarket?: (marketId: string) => void
}

export default function MarketSearchDialog({ isOpen, onClose, marketData, onSelectMarket }: MarketSearchDialogProps) {
  const router = useRouter() // Add router for direct navigation
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMarkets, setFilteredMarkets] = useState<MarketItem[]>([])

  // Reset search query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  // Filter markets when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMarkets(marketData)
      return
    }

    const lowercaseQuery = searchQuery.toLowerCase()
    const filtered = marketData.filter(
      (market) =>
        market.name.toLowerCase().includes(lowercaseQuery) ||
        market.pair.toLowerCase().includes(lowercaseQuery) ||
        market.id.toLowerCase().includes(lowercaseQuery),
    )
    setFilteredMarkets(filtered)
  }, [searchQuery, marketData])

  // Handle market selection
  const handleMarketSelect = (marketId: string) => {
    if (onSelectMarket) {
      onSelectMarket(marketId)
    } else {
      // If no selection handler is provided, navigate directly
      router.push(`/spot/${marketId}`)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] bg-[#121212] border-white/20 p-0 gap-0 flex flex-col">
        <div className="p-4 pb-0 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Market Search</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search token or paste contract address"
              className="pl-10 py-4 bg-[#1A1A1A] border-white/20 text-gray-300 h-10 text-base rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 flex-shrink-0">
          <h3 className="text-base font-medium text-white">All Markets</h3>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-grow overflow-y-auto">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
              <div
                key={market.id}
                className="border-b border-white/10 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                onClick={() => handleMarketSelect(market.id)}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden"
                        style={{ backgroundColor: market.iconBg }}
                      >
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
                          <span className="text-gray-400">{market.pair}</span>
                        </div>
                        <div className="text-gray-500 text-sm mt-1">{market.age}</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">Vol</div>
                        <div className="text-white">{market.volume}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">Liq</div>
                        <div className="text-white">{market.liquidity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-400">No markets found matching your search.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}