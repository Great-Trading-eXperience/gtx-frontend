"use client"

import TokenABI from "@/abis/tokens/TokenABI"
import { TableCell, TableRow } from "@/components/ui/table"
import { useContractRead, useContractReads } from "wagmi"
import { parseAbi } from "viem"
import { HexAddress } from "@/types/general/address"
interface VaultRowProps {
  vault: {
    id: string
    asset: string
    name: string
    tvl: string
    curator: {
      name: string
    }
    allocations: {
      items: {
        marketToken: string
        allocation: string
      }[]
    }
  }
  onClick: (vaultAddress: string) => void
}

export function VaultRow({ vault, onClick }: VaultRowProps) {
  // Read token symbol
  const { data: symbol } = useContractRead({
    address: vault.asset as HexAddress,
    abi: TokenABI,
    functionName: "symbol",
  })

  // Read token name
  const { data: name } = useContractRead({
    address: vault.asset as HexAddress,
    abi: TokenABI,
    functionName: "name",
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
      // Add more mappings as needed
    }
    return icons[symbol] || "/tokens/eth.png"
  }

  // Format market name from GTX_TOKEN_USDC to TOKEN/USDC
  const formatMarketName = (symbol: string) => {
    const parts = symbol.split("_")
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`
    }
    return symbol
  }

  const { data: marketNames } = useContractReads({
    contracts: vault.allocations.items.map((allocation) => ({
      address: allocation.marketToken as HexAddress,
      abi: parseAbi(["function symbol() view returns (string)"]),
      functionName: "symbol",
    })),
    query: {
      retry: false,
      enabled: vault.allocations.items.length > 0,
    },
  })

  const pairs = vault.allocations.items.map((allocation, i) => ({
    icon: getTokenIcon((marketNames?.[i]?.result as string)?.split("_")[1] || ""),
    name:
      formatMarketName((marketNames?.[i]?.result ?? "") as string) ||
      `${allocation.marketToken.slice(0, 6)}...${allocation.marketToken.slice(-4)}`,
  }))

  // Calculate APY (placeholder)
  const apy = "12.5%" // This should be calculated based on actual data

  // Format TVL with K/M suffix
  const formatTvl = (tvlString: string) => {
    const tvlValue = Number.parseFloat(tvlString) / 1e6
    if (tvlValue > 1_000_000) {
      return `$${(tvlValue / 1_000_000).toFixed(1)}M`
    } else if (tvlValue > 1_000) {
      return `$${(tvlValue / 1_000).toFixed(1)}K`
    }
    return `$${tvlValue.toFixed(2)}`
  }

  return (
    <TableRow
      className="hover:bg-blue-500/5 border-blue-500/20 cursor-pointer transition-colors duration-200"
      onClick={() => onClick(vault.id)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 p-0.5">
            <img
              src={getTokenIcon(symbol as string) || "/placeholder.svg"}
              alt={symbol as string}
              className="w-full h-full rounded-full bg-black"
            />
          </div>
          <span>{(symbol as string) || ""}</span>
        </div>
      </TableCell>
      <TableCell>{vault.name}</TableCell>
      <TableCell>{vault.curator.name}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {pairs.map((pair, j) => (
            <div key={j} className="flex items-center gap-2 bg-blue-500/10 rounded-full px-3 py-1">
              <img src={pair.icon || "/placeholder.svg"} alt={pair.name} className="w-4 h-4 rounded-full" />
              <span className="text-sm text-blue-300">{pair.name}</span>
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-right text-green-400 font-medium">{apy}</TableCell>
      <TableCell className="text-right text-cyan-300 font-medium">{formatTvl(vault.tvl)}</TableCell>
    </TableRow>
  )
}

