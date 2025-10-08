"use client"

import { useContractRead } from "wagmi"
import { parseAbi } from "viem"
import { HexAddress } from "@/types/general/address"
interface AllocationRowProps {
  marketToken: string
  allocation: string
}

export function AllocationRow({ marketToken, allocation }: AllocationRowProps) {
  // Get market token symbol
  const { data: symbol } = useContractRead({
    address: marketToken as HexAddress,
    abi: parseAbi(["function symbol() view returns (string)"]),
    functionName: "symbol",
  })

  // Get token icon based on symbol
  const getTokenIcon = (symbol: string) => {
    const icons: { [key: string]: string } = {
      USDC: "/usdc.png",
      WETH: "/eth.png",
      WBTC: "/bitcoin.png",
      TRUMP: "/trump.png",
      LINK: "/link.png",
      PEPE: "/pepe.png",
      DOGE: "/doge.png",
      SHIBA: "/shiba.png",
      BONK: "/bonk.png",
      FLOKI: "/floki.png",
    }
    return icons[symbol.split("_")[1]] || "/tokens/eth.png"
  }

  // Format market name from GTX_TOKEN_USDC to TOKEN/USDC
  const formatMarketName = (symbol: string) => {
    const parts = symbol.split("_")
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`
    }
    return symbol
  }

  const formattedSymbol = (symbol ?? "") as string
  const marketName = formatMarketName(formattedSymbol) || `${marketToken.slice(0, 6)}...${marketToken.slice(-4)}`

  // Format allocation percentage
  const allocationPercentage = Number(allocation) / 100

  return (
    <tr className="border-b border-blue-500/20 hover:bg-blue-500/5 transition-colors duration-200">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 p-0.5">
            <img
              src={getTokenIcon(formattedSymbol) || "/placeholder.svg"}
              alt={marketName}
              className="w-full h-full rounded-full bg-black"
            />
          </div>
          <span className="text-blue-500 font-medium">{marketName}</span>
        </div>
      </td>
      <td className="p-4 font-medium">{allocationPercentage}%</td>
    </tr>
  )
}

