"use client"

import { DotPattern } from "@/components/magicui/dot-pattern"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { getCuratorVaultsQuery } from "@/graphql/gtx/perpetual"
import { useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { EarnSkeleton } from "./earn-skeleton"
import { VaultRow } from "./vault-row"

// Allocation model
interface Allocation {
  allocation: string
  blockNumber: number | null
  curator: string
  id: string
  marketToken: string
  timestamp: number
  transactionHash: string
}

// Collection of Allocations
interface AllocationConnection {
  items: Allocation[]
}

// Curator model
interface Curator {
  blockNumber: number | null
  contractAddress: string
  curator: string
  id: string
  name: string
  timestamp: number
  transactionHash: string | null
  uri: string | null
}

// AssetVault model
interface CuratorVault {
  asset: string
  blockNumber: number | null
  id: string
  name: string
  tvl: string
  token: string | null
  timestamp: number
  tokenName: string | null
  tokenSymbol: string | null
  transactionHash: string | null
  allocations: AllocationConnection
  curator: Curator
}

// Collection of AssetVaults
interface CuratorVaults {
  items: CuratorVault[]
}

// Root response structure
interface GetCuratorVaultsResponse {
  assetVaults: CuratorVaults
}

export default function GTXEarn() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()

  // Fetch pools data
  const { data: curatorVaultsData, isLoading: curatorVaultsLoading } = useQuery<GetCuratorVaultsResponse>({
    queryKey: ["curatorVaults"],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, getCuratorVaultsQuery)
    },
    staleTime: 60000, // 1 minute - pools don't change often
  })

  // Handle component mounting
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])


  const handleRowClick = (vaultAddress: string) => {
    router.push(`/earn/${vaultAddress}`)
  }

  // Show loading state when component is not mounted or data is loading
  if (!mounted || curatorVaultsLoading) {
    return <EarnSkeleton />
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <DotPattern />
      <main className="relative z-10 flex-1 flex items-center justify-start p-8">
        <div className="space-y-8 w-full max-w-7xl mx-auto">
          <div className="text-start space-y-4">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-800 to-blue-900 text-blue-100 font-semibold rounded-full">
              Earn Passively
            </div>
            <h1 className="text-5xl font-extrabold">
              <span className="mb-2">GTX </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">Earn</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Maximize your crypto assets potential. Deposit with our curators and watch your investments grow across
              diverse trading pairs.
            </p>
          </div>

          <div className="w-full bg-[#121212] backdrop-blur-sm rounded-xl border border-blue-500/20 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-blue-500/20">
                  <TableHead className="text-blue-300 font-medium">Asset</TableHead>
                  <TableHead className="text-blue-300 font-medium">Vault</TableHead>
                  <TableHead className="text-blue-300 font-medium">Curator</TableHead>
                  <TableHead className="text-blue-300 font-medium">Market</TableHead>
                  <TableHead className="text-right text-blue-300 font-medium">APY</TableHead>
                  <TableHead className="text-right text-blue-300 font-medium">TVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {curatorVaultsData?.assetVaults.items.map((vault) => (
                  <VaultRow key={vault.id} vault={vault} onClick={handleRowClick} />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full border-blue-500/50 bg-black/30 hover:bg-blue-500/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2 text-lg">
              <span className="px-4 py-2 bg-blue-500/10 rounded-lg">1</span>
              <span className="text-gray-400">of 1</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full border-blue-500/50 bg-black/30 hover:bg-blue-500/10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

