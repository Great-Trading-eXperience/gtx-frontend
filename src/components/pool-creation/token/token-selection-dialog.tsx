"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Search, Clock, Star, Wallet, Hexagon, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"

// Token types
export interface Token {
  symbol: string
  name: string
  address: string
  balance?: string
  price?: string
  logo?: string
}

interface TokenSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: Token) => void
  tokens: Token[]
  recentSearches: Token[]
  popularTokens: Token[]
}

const TokenSelectionDialog: React.FC<TokenSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectToken,
  tokens,
  recentSearches,
  popularTokens,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle click outside dialog
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Filter tokens based on search query
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Helper to get token logo or fallback to Hexagon
  const renderTokenIcon = (token: Token) => {
    if (token.logo) {
      return <img src={token.logo} alt={token.symbol} className="w-full h-full" />
    }
    
    // Fallback to Hexagon for tokens without logos
    return <Hexagon className="w-6 h-6 text-white" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        ref={dialogRef}
        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Select a token</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search tokens"
              className="pl-10 pr-10 py-6 bg-[#0A0A0A] border-white/10 rounded-full text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <div className="flex space-x-1">
                <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                <div className="w-5 h-5 rounded-full bg-pink-500"></div>
                <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                <div className="w-5 h-5 rounded-full bg-red-500"></div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400 ml-1" />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {/* Your tokens section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-gray-400">
                <Wallet className="w-5 h-5" />
                <span className="text-lg font-medium">Your tokens</span>
              </div>

              {filteredTokens.map((token, index) => (
                <div
                  key={`token-${index}`}
                  className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  onClick={() => onSelectToken(token)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                      {renderTokenIcon(token)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{token.name}</div>
                      <div className="text-sm text-gray-400">
                        {token.symbol} {token.address.substring(0, 6)}...
                        {token.address.substring(token.address.length - 4)}
                      </div>
                    </div>
                  </div>
                  {token.price && token.balance && (
                    <div className="text-right">
                      <div className="font-bold text-white">{token.price}</div>
                      <div className="text-sm text-gray-400">{token.balance}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent searches section */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-medium">Recent searches</span>
                </div>

                {recentSearches.map((token, index) => (
                  <div
                    key={`recent-${index}`}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => onSelectToken(token)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                        {renderTokenIcon(token)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{token.name}</div>
                        <div className="text-sm text-gray-400">
                          {token.symbol} {token.address.substring(0, 6)}...
                          {token.address.substring(token.address.length - 4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tokens by 24H volume */}
            {popularTokens.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Star className="w-5 h-5" />
                  <span className="text-lg font-medium">Tokens by 24H volume</span>
                </div>

                {popularTokens.map((token, index) => (
                  <div
                    key={`popular-${index}`}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => onSelectToken(token)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                        {renderTokenIcon(token)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{token.name}</div>
                        <div className="text-sm text-gray-400">
                          {token.symbol} {token.address.substring(0, 6)}...
                          {token.address.substring(token.address.length - 4)}
                        </div>
                      </div>
                    </div>
                    {token.price && token.balance && (
                      <div className="text-right">
                        <div className="font-bold text-white">{token.price}</div>
                        <div className="text-sm text-gray-400">{token.balance}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenSelectionDialog