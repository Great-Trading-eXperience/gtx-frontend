"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Database } from "lucide-react"
import Link from "next/link"
import { ThemeProvider } from "next-themes"
import { WagmiProvider } from "wagmi"
import { wagmiConfig } from "@/configs/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { ButtonConnectWallet } from "@/components/button-connect-wallet.tsx/button-connect-wallet"

interface Pool {
  collateral: string
  borrow: string
  oracle: string
}

const pools: Pool[] = [
  {
    collateral: "ETH/USDT",
    borrow: "USDC",
    oracle: "0xe9c1de5ea494219b965652",
  },
  {
    collateral: "BTC/USDT",
    borrow: "USDC",
    oracle: "0xe9c1de5ea494219b965652",
  },
]

const queryClient = new QueryClient()

function CuratorContent({ params }: { params: { wallet: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid md:grid-cols-[2fr,1fr] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                Curator 3
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-black/30 border border-blue-500/20 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300">TVL</span>
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-300">$1.2M</div>
              </div>
              <div className="p-6 rounded-xl bg-black/30 border border-blue-500/20 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300">APY</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">12.5%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-300">Performance</h3>
              <div className="h-64 rounded-xl bg-black/30 border border-blue-500/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-gray-400">Coming Soon</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-300">Allocation</h3>
              <div className="rounded-xl border border-blue-500/20 overflow-hidden backdrop-blur-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/50 border-b border-blue-500/20">
                      <th className="text-left p-4 text-sm text-blue-300">Trading Pair</th>
                      <th className="text-left p-4 text-sm text-blue-300">Asset</th>
                      <th className="text-left p-4 text-sm text-blue-300">Oracle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((pool, i) => (
                      <tr key={i} className="border-b border-blue-500/20 hover:bg-blue-500/5">
                        <td className="p-4 text-cyan-300">{pool.collateral}</td>
                        <td className="p-4">{pool.borrow}</td>
                        <td className="p-4">
                          <code className="text-sm text-blue-300">{pool.oracle}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-black/30 border border-blue-500/20 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Your Deposit</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Deposit:</span>
                <span className="text-2xl font-bold text-cyan-300">0</span>
              </div>
            </div>

            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-black/30 border border-blue-500/20 rounded-xl overflow-hidden">
                <TabsTrigger value="deposit" className="data-[state=active]:bg-blue-500/20">
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="data-[state=active]:bg-blue-500/20">
                  Withdraw
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="deposit"
                className="mt-4 p-6 rounded-xl bg-black/30 border border-blue-500/20 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300">Deposit</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue="0.00"
                        className="w-32 text-right bg-black/50 border-blue-500/50"
                      />
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        Max
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Gas Fee</span>
                    <span className="text-blue-300">-</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500">
                    Deposit
                  </Button>
                </div>
              </TabsContent>
              <TabsContent
                value="withdraw"
                className="mt-4 p-6 rounded-xl bg-black/30 border border-blue-500/20 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300">Withdraw</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue="0.00"
                        className="w-32 text-right bg-black/50 border-blue-500/50"
                      />
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        Max
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Gas Fee</span>
                    <span className="text-blue-300">-</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500">
                    Withdraw
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

const CuratorPage = ({ params }: { params: { wallet: string } }) => {
  return (
    <CuratorContent params={params} />
  )
}

export default CuratorPage

