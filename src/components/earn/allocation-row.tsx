'use client'

import { useContractRead } from "wagmi"
import { parseAbi } from 'viem'

interface AllocationRowProps {
  marketToken: string
  allocation: string
}

export function AllocationRow({ marketToken, allocation }: AllocationRowProps) {
  // Get market token symbol
  const { data: symbol } = useContractRead({
    address: marketToken as `0x${string}`,
    abi: parseAbi(['function symbol() view returns (string)']),
    functionName: 'symbol',
  })

  // Get token icon based on symbol
  const getTokenIcon = (symbol: string) => {
    const icons: { [key: string]: string } = {
      'USDC': '/usdc.png',
      'WETH': '/eth.png',
      'WBTC': '/bitcoin.png',
      'TRUMP': '/trump.png',
      'LINK': '/link.png',
      'PEPE': '/pepe.png',
      'DOGE': '/doge.png',
      'SHIBA': '/shiba.png',
      'BONK': '/bonk.png',
      'FLOKI': '/floki.png',
    }
    return icons[symbol.split('_')[1]] || '/default-token.png'
  }

  // Format market name from GTX_TOKEN_USDC to TOKEN/USDC
  const formatMarketName = (symbol: string) => {
    const parts = symbol.split('_')
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`
    }
    return symbol
  }

  return (
    <tr className="border-b border-blue-500/20 hover:bg-blue-500/5">
      <td className="p-4">
        <div className="flex items-center gap-2">
          <img 
            src={getTokenIcon((symbol ?? '') as string)} 
            alt={formatMarketName((symbol ?? '') as string)}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-cyan-300">
            {formatMarketName((symbol ?? '') as string) || 
              `${marketToken.slice(0,6)}...${marketToken.slice(-4)}`}
          </span>
        </div>
      </td>
      <td className="p-4">{Number(allocation) / 100}%</td>
    </tr>
  )
} 