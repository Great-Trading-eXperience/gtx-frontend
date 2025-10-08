"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { HexAddress } from '@/types/general/address'

// Define TypeScript interfaces
export interface Network {
  id: string
  name: string
  icon: string
}

export interface Token {
  id: string
  name: string
  symbol: string
  icon: string
  address: HexAddress
  description?: string
}

interface TokenNetworkSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  networks: Network[]
  tokens: Record<string, Token[]>
  initialNetwork: Network
  onSelect: (network: Network, token: Token) => void
  title?: string
}

export default function TokenNetworkSelector({
  open,
  onOpenChange,
  networks,
  tokens,
  initialNetwork,
  onSelect,
  title = "Select a token"
}: TokenNetworkSelectorProps): JSX.Element {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(initialNetwork)
  const [networkSearch, setNetworkSearch] = useState<string>("")
  const [tokenSearch, setTokenSearch] = useState<string>("")

  // Reset search and update selected network when dialog opens or initialNetwork changes
  useEffect(() => {
    if (open) {
      setSelectedNetwork(initialNetwork)
      setNetworkSearch("")
      setTokenSearch("")
    }
  }, [open, initialNetwork])

  // Filter networks based on search
  const filteredNetworks = networkSearch
    ? networks.filter((network) => network.name.toLowerCase().includes(networkSearch.toLowerCase()))
    : networks

  // Filter tokens based on search and ensure we have tokens for the selected network
  const availableTokens = tokens[selectedNetwork.id] || []
  const filteredTokens = tokenSearch
    ? availableTokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
          token.name.toLowerCase().includes(tokenSearch.toLowerCase()) ||
          token.address.toLowerCase().includes(tokenSearch.toLowerCase()),
      )
    : availableTokens

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    onSelect(selectedNetwork, token)
    onOpenChange(false)
  }

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    target.onerror = null
    target.src = "/tokens/eth.png"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-gray-800 bg-[#121212] p-0 text-white sm:rounded-2xl">
        <div className="flex h-[600px] max-h-[80vh]">
          {/* Network Selection (Left Panel) */}
          <div className="w-[300px] overflow-y-auto border-r border-white/10 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search network"
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="border-white/10 bg-[#1A1A1A] pl-9 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              {filteredNetworks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    selectedNetwork.id === network.id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <img
                    src={network.icon}
                    alt={network.name}
                    className="h-6 w-6 rounded-full"
                    onError={handleImageError}
                  />
                  <span className="font-medium">{network.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Token Selection (Right Panel) */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm text-gray-400">
                  Select a token from {selectedNetwork.name} network
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by token name or address"
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="border-white/10 bg-[#1A1A1A] pl-9 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Popular Tokens */}
            <div className="mb-6 grid grid-cols-4 gap-2">
              {filteredTokens.slice(0, 8).map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 hover:bg-white/20 transition-colors"
                >
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="h-6 w-6 rounded-full"
                    onError={handleImageError}
                  />
                  <span className="font-medium">{token.symbol}</span>
                </button>
              ))}
            </div>

            {/* All Tokens List */}
            <div>
              <h3 className="mb-2 text-lg font-medium">All Tokens</h3>
              {filteredTokens.length === 0 ? (
                <div className="py-4 text-center text-gray-400">
                  No tokens found. Try a different search term.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => handleTokenSelect(token)}
                      className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="h-8 w-8 rounded-full"
                          onError={handleImageError}
                        />
                        <div className="text-left">
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      {token.description && (
                        <div className="text-sm text-gray-400">{token.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}