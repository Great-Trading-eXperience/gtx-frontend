'use client'

import * as React from 'react'
import { Check, ChevronDown, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

// Define props interface
interface PairDropdownProps {
  pairs: Array<{
    id: string
    coin: string
  }>
  selectedPairId: string | null
  onPairSelect: (pairId: string) => void
}

// Get tokens from a trading pair
const getTokensFromPair = (pair: string | null): { base: string; quote: string } => {
  if (!pair) return { base: 'eth', quote: 'usdc' }
  
  const parts = pair.split('/')
  if (parts.length === 2) {
    return {
      base: parts[0].toLowerCase(),
      quote: parts[1].toLowerCase()
    }
  }
  
  return { base: 'eth', quote: 'usdc' }
}

// Define exactly which tokens we have images for (no assumptions)
const TOKENS_WITH_IMAGES = [
  'bitcoin',
  'doge',
  'eth',
  'floki',
  'link',
  'pepe',
  'shiba',
  'trump',
  'usdc'
]

// Get token image path only if we're sure it exists
const getTokenImagePath = (token: string): string | null => {
  const normalizedToken = token.toLowerCase()
  
  // Check for Bitcoin variants
  if (normalizedToken === 'btc' || normalizedToken === 'wbtc' || normalizedToken === 'bitcoin') {
    return '/tokens/bitcoin.png'
  }
  
  // Check for Ethereum variants
  if (normalizedToken === 'eth' || normalizedToken === 'weth') {
    return '/tokens/eth.png'
  }
  
  // Check for stablecoins
  if (normalizedToken === 'usdc' || normalizedToken === 'usdt') {
    return '/tokens/usdc.png'
  }
  
  // Check for Shiba variants
  if (normalizedToken === 'shib' || normalizedToken === 'shiba') {
    return '/tokens/shiba.png'
  }
  
  // Direct matches for other tokens
  if (TOKENS_WITH_IMAGES.includes(normalizedToken)) {
    return `/tokens/${normalizedToken}.png`
  }
  
  // No match found
  return null
}

export function PairDropdown({ pairs, selectedPairId, onPairSelect }: PairDropdownProps) {
  const [open, setOpen] = React.useState(false)
  
  // Priority order for common pairs
  const priorityOrder = [
    'weth/usdc',
    'wbtc/usdc',
    'eth/usdc',
    'btc/usdc',
    'sol/usdc',
    'link/usdc'
  ]
  
  // Sort pairs but don't filter out duplicates
  const sortedPairs = [...pairs].sort((a, b) => {
    const aLower = a.coin?.toLowerCase() || ''
    const bLower = b.coin?.toLowerCase() || ''
    
    // Get priority index (-1 if not in priority list)
    const aIndex = priorityOrder.findIndex(p => aLower.includes(p))
    const bIndex = priorityOrder.findIndex(p => bLower.includes(p))
    
    // If both have priority, sort by priority order
    if (aIndex >= 0 && bIndex >= 0) {
      return aIndex - bIndex
    }
    
    // If only a has priority, it comes first
    if (aIndex >= 0) return -1
    
    // If only b has priority, it comes first
    if (bIndex >= 0) return 1
    
    // Regular alphabetical sort for other pairs
    return a.coin?.localeCompare(b.coin || '') || 0
  })
  
  // Find the currently selected pair
  const [selectedPair, setSelectedPair] = React.useState(
    sortedPairs.find(pair => pair.id === selectedPairId) || sortedPairs[0]
  )

  // Update selected pair when selectedPairId changes - this is crucial for URL syncing
  useEffect(() => {
    const pair = sortedPairs.find(pair => pair.id === selectedPairId)
    if (pair && pair.id !== selectedPair?.id) {
      console.log(`PairDropdown: Updating selected pair to ${pair.id} (${pair.coin})`)
      setSelectedPair(pair)
    } else if (!pair && sortedPairs.length > 0 && !selectedPair) {
      // If no match but we have pairs, set the first one
      setSelectedPair(sortedPairs[0])
    }
  }, [selectedPairId, sortedPairs, selectedPair])

  // Render token icons with overlap
  const renderTokenIcons = (pair: string | null) => {
    const { base, quote } = getTokensFromPair(pair)
    const baseImagePath = getTokenImagePath(base)
    const quoteImagePath = getTokenImagePath(quote)
    
    // Get token initials for fallback
    const baseInitial = base.charAt(0).toUpperCase()
    const quoteInitial = quote.charAt(0).toUpperCase()
    
    // Determine background colors based on token type
    const getBaseColor = () => {
      if (base === 'weth' || base === 'eth') return 'bg-blue-600'
      if (base === 'wbtc' || base === 'btc' || base === 'bitcoin') return 'bg-orange-500'
      if (base === 'link') return 'bg-blue-700'
      if (base === 'sol') return 'bg-purple-600'
      if (base === 'ada') return 'bg-cyan-600'
      if (base === 'pepe') return 'bg-green-600'
      return 'bg-indigo-600'
    }
    
    return (
      <div className="relative w-[50px] h-[25px]">
        {/* Base token (appears on the left, slightly overlapped) */}
        <div className="absolute top-0 left-0 w-[20px] h-[20px] rounded-full bg-gray-800 z-10 overflow-hidden flex items-center justify-center">
          {baseImagePath ? (
            <img 
              src={baseImagePath} 
              alt={base}
              className="w-full h-full object-cover" 
              onError={(e) => {
                // If image fails to load, replace with initial
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.classList.add(getBaseColor());
                  const span = document.createElement('span');
                  span.className = 'text-xs font-bold text-white';
                  span.textContent = baseInitial;
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${getBaseColor()}`}>
              <span className="text-xs font-bold text-white">{baseInitial}</span>
            </div>
          )}
        </div>
        
        {/* Quote token (appears on the right, slightly overlapped) */}
        <div className="absolute top-0 left-[15px] w-[20px] h-[20px] rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
          {quoteImagePath ? (
            <img 
              src={quoteImagePath} 
              alt={quote}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, replace with initial
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.classList.add('bg-green-600');
                  const span = document.createElement('span');
                  span.className = 'text-xs font-bold text-white';
                  span.textContent = quoteInitial;
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-green-600">
              <span className="text-xs font-bold text-white">{quoteInitial}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between bg-transparent border-none text-white hover:bg-gray-800/50 hover:text-white"
        >
          <div className="flex items-center gap-2">
            {renderTokenIcons(selectedPair?.coin || null)}
            <span className="font-medium text-sm truncate">
              {selectedPair?.coin || "Select pair"}
            </span>
          </div>
          {/* <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-gray-900 border border-gray-700/50 text-white">
        <Command>
          <CommandInput placeholder="Search pair..." className="h-9 bg-transparent text-white" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No pair found.</CommandEmpty>
            <CommandGroup>
              {sortedPairs.map((pair) => (
                <CommandItem
                  key={pair.id}
                  value={pair.coin}
                  onSelect={() => {
                    onPairSelect(pair.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-2 hover:bg-gray-800/50",
                    selectedPairId === pair.id ? "bg-gray-800" : "transparent"
                  )}
                >
                  {renderTokenIcons(pair.coin)}
                  <span>{pair.coin}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedPairId === pair.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}