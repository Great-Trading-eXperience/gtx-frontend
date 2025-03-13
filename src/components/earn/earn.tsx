'use client'

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import { getCuratorVaultsQuery } from "@/graphql/gtx/gtx.query"
import { useQuery } from "@tanstack/react-query"
import request from 'graphql-request'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import GradientLoader from "../gradient-loader/gradient-loader"
import { VaultRow } from "./vault-row"

// Allocation model
interface Allocation {
  allocation: string;
  blockNumber: number | null;
  curator: string;
  id: string;
  marketToken: string;
  timestamp: number;
  transactionHash: string;
}

// Collection of Allocations
interface AllocationConnection {
  items: Allocation[];
}

// Curator model
interface Curator {
  blockNumber: number | null;
  contractAddress: string;
  curator: string;
  id: string;
  name: string;
  timestamp: number;
  transactionHash: string | null;
  uri: string | null;
}

// AssetVault model
interface CuratorVault {
  asset: string;
  blockNumber: number | null;
  id: string;
  name: string;
  tvl: string;
  token: string | null;
  timestamp: number;
  tokenName: string | null;
  tokenSymbol: string | null;
  transactionHash: string | null;
  allocations: AllocationConnection;
  curator: Curator;
}

// Collection of AssetVaults
interface CuratorVaults {
  items: CuratorVault[];
}

// Root response structure
interface GetCuratorVaultsResponse {
  assetVaults: CuratorVaults;
}

export default function GTXEarn() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showConnectionLoader, setShowConnectionLoader] = useState(false)
  const { isConnected } = useAccount()
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected)

  // Fetch pools data
  const { data: curatorVaultsData, isLoading: curatorVaultsLoading } = useQuery<GetCuratorVaultsResponse>({
    queryKey: ['curatorVaults'],
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

  // Handle wallet connection state changes
  useEffect(() => {
    if (mounted) {
      // Only handle connection changes after mounting
      if (isConnected && !previousConnectionState) {
        setShowConnectionLoader(true)
        const timer = setTimeout(() => {
          setShowConnectionLoader(false)
        }, 3000) // Show for 3 seconds
        return () => clearTimeout(timer)
      }
      setPreviousConnectionState(isConnected)
    }
  }, [isConnected, previousConnectionState, mounted])

  const handleRowClick = (vaultAddress: string) => {
    router.push(`/earn/${vaultAddress}`)
  }

  // Show connection loading state when transitioning from disconnected to connected
  if (showConnectionLoader) {
    return <GradientLoader />
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white">
      <main className="flex-1 flex items-center justify-start p-8">
        <div className="space-y-6 w-full max-w-7xl mx-auto">
          <div className="text-start space-y-4">
            <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              GTX Earn
            </h1>
            <p className="text-xl text-gray-300 mx-auto">
              Maximize your crypto assets potential. <br />
              Deposit with our curators and watch your investments grow across
              diverse trading pairs.
            </p>
          </div>

          <div className="w-full bg-black/30 backdrop-blur-sm rounded-lg border border-blue-500/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-blue-500/20">
                  <TableHead className="text-blue-300">Asset</TableHead>
                  <TableHead className="text-blue-300">Vault</TableHead>
                  <TableHead className="text-blue-300">Curator</TableHead>
                  <TableHead className="text-blue-300">Market</TableHead>
                  <TableHead className="text-right text-blue-300">APY</TableHead>
                  <TableHead className="text-right text-blue-300">TVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {curatorVaultsData?.assetVaults.items.map((vault) => (
                  <VaultRow
                    key={vault.id}
                    vault={vault}
                    onClick={handleRowClick}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-4">
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