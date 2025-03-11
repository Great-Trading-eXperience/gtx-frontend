'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
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

// Define props interface for PerpetualPairDropdown
interface PerpetualPairDropdownProps {
  pairs: Array<{
    id: string
    symbol: string
    name: string
  }>
  selectedPairId: string
  onPairSelect: (pairId: string) => void
}

// Get icon for a trading pair
const getCoinIcon = (pair: string | null) => {
  if (!pair) return "/icon/eth-usdc.png"
  
  const lowerPair = pair.toLowerCase()
  if (lowerPair.includes("eth")) {
    return "/icon/eth-usdc.png"
  } else if (lowerPair.includes("btc")) {
    return "/icon/btc-usdc.png" 
  } else if (lowerPair.includes("pepe")) {
    return "/icon/pepe-usdc.png"
  } else if (lowerPair.includes("link")) {
    return "/icon/link-usdc.png"
  } else if (lowerPair.includes("ada")) {
    return "/icon/ada-usdc.png"
  } else if (lowerPair.includes("sol")) {
    return "/icon/sol-usdc.png"
  } else if (lowerPair.includes("shib")) {
    return "/icon/shib-usdc.png"
  }
  
  // Default icon
  return "/icon/eth-usdc.png"
}

// Helper function to get unique pairs (filtering duplicates)
const getUniquePairs = (pairs: Array<{ id: string; symbol: string; name: string }>) => {
  const uniquePairMap = new Map<string, { id: string; symbol: string; name: string }>()
  
  pairs.forEach(pair => {
    // Use lowercase symbol as key to identify duplicates regardless of case
    const key = pair.symbol.toLowerCase()
    
    // If we haven't seen this pair before, or if this is the more recent version (usually higher ID), add it
    if (!uniquePairMap.has(key) || Number(pair.id) > Number(uniquePairMap.get(key)!.id)) {
      uniquePairMap.set(key, pair)
    }
  })
  
  // Convert map values back to array
  const uniquePairs = Array.from(uniquePairMap.values())
  
  // Priority order for common pairs
  const priorityOrder = [
    'eth',
    'btc',
    'sol',
    'link'
  ]
  
  // Custom sort function: prioritized pairs first, then alphabetical order
  return uniquePairs.sort((a, b) => {
    const aLower = a.symbol.toLowerCase()
    const bLower = b.symbol.toLowerCase()
    
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
    return a.symbol.localeCompare(b.symbol)
  })
}

export function PerpetualPairDropdown({ pairs, selectedPairId, onPairSelect }: PerpetualPairDropdownProps) {
  const [open, setOpen] = React.useState(false)
  
  // Get unique pairs
  const uniquePairs = getUniquePairs(pairs)
  
  // Find the currently selected pair
  const selectedPair = uniquePairs.find(pair => pair.id === selectedPairId) || uniquePairs[0]

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
            <div className="w-[40px] h-[25px] relative">
              <img 
                src={getCoinIcon(selectedPair?.symbol || null)} 
                alt={selectedPair?.name || 'Trading Pair'} 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-medium text-sm truncate">
              {selectedPair?.symbol || "Select pair"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-500 text-xs p-1 bg-emerald-100 dark:bg-emerald-500/10 rounded">Perp</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-gray-900 border border-gray-700/50 text-white">
        <Command>
          <CommandInput placeholder="Search pair..." className="h-9 bg-transparent text-white" />
          <CommandList>
            <CommandEmpty>No pair found.</CommandEmpty>
            <CommandGroup>
              {uniquePairs.map((pair) => (
                <CommandItem
                  key={pair.id}
                  value={pair.symbol}
                  onSelect={() => {
                    onPairSelect(pair.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-2 hover:bg-gray-800/50",
                    selectedPairId === pair.id ? "bg-gray-800" : "transparent"
                  )}
                >
                  <div className="w-[30px] h-[20px] relative">
                    <img 
                      src={getCoinIcon(pair.symbol)} 
                      alt={pair.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span>{pair.symbol}</span>
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