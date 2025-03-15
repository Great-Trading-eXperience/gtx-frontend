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
  } else if (lowerPair.includes("doge")) {
    return "/icon/doge-usdc.png"
  } else if (lowerPair.includes("trump")) {
    return "/icon/trump-usdc.png"
  }
  
  // Default icon
  return "/icon/eth-usdc.png"
}

// Specific allowed pairs
const ALLOWED_PAIRS = [
  'WETH-USDC',
  'WBTC-USDC',
  'LINK-USDC',
  'PEPE-USDC',
  'TRUMP-USDC'
];

// Helper function to get unique pairs (filtering to only allowed pairs)
const getUniquePairs = (pairs: Array<{ id: string; symbol: string; name: string }>) => {
  const uniquePairMap = new Map<string, { id: string; symbol: string; name: string }>()
  
  // Filter to only include the specific allowed pairs
  const validPairs = pairs.filter(pair => {
    const normalizedSymbol = pair.symbol.toUpperCase();
    return ALLOWED_PAIRS.includes(normalizedSymbol);
  });
  
  validPairs.forEach(pair => {
    // Use lowercase symbol as key to identify duplicates regardless of case
    const key = pair.symbol.toLowerCase()
    
    // If we haven't seen this pair before, or if this is the more recent version (usually higher ID), add it
    if (!uniquePairMap.has(key) || Number(pair.id) > Number(uniquePairMap.get(key)!.id)) {
      uniquePairMap.set(key, pair)
    }
  })
  
  // Convert map values back to array
  const uniquePairs = Array.from(uniquePairMap.values())
  
  // Priority order matching the allowed pairs order
  const priorityOrder = [
    'weth',
    'wbtc',
    'link',
    'pepe',
    'trump'
  ]
  
  // Custom sort function based on the priorityOrder
  return uniquePairs.sort((a, b) => {
    const aLower = a.symbol.toLowerCase()
    const bLower = b.symbol.toLowerCase()
    
    // Get priority index
    const aIndex = priorityOrder.findIndex(p => aLower.includes(p))
    const bIndex = priorityOrder.findIndex(p => bLower.includes(p))
    
    // Sort by priority order
    return aIndex - bIndex
  })
}

export function PerpetualPairDropdown({ pairs, selectedPairId, onPairSelect }: PerpetualPairDropdownProps) {
  const [open, setOpen] = React.useState(false)
  
  // Get unique pairs
  const uniquePairs = getUniquePairs(pairs)
  
  // Find the currently selected pair
  let selectedPair = uniquePairs.find(pair => pair.id === selectedPairId)
  
  // If selected pair is not in the allowed list, default to first allowed pair
  if (!selectedPair && uniquePairs.length > 0) {
    selectedPair = uniquePairs[0]
    // Update selected ID to match first pair (could be done with a useEffect)
    setTimeout(() => onPairSelect(uniquePairs[0].id), 0)
  }

  // If no valid pairs after filtering, show an empty state
  if (uniquePairs.length === 0) {
    return (
      <Button
        variant="outline"
        className="w-[200px] justify-between bg-transparent border-none text-white hover:bg-gray-800/50 hover:text-white"
        disabled
      >
        <div className="flex items-center gap-2">
          <div className="w-[40px] h-[25px] relative">
            <img 
              src="/icon/eth-usdc.png" 
              alt="No pairs available" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-medium text-sm truncate">
            No pairs available
          </span>
          <span className="text-emerald-600 dark:text-emerald-500 text-xs p-1 bg-emerald-100 dark:bg-emerald-500/10 rounded">Perp</span>
        </div>
      </Button>
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