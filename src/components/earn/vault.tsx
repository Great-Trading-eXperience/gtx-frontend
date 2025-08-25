"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { PrivyAuthButton } from "../auth/privy-auth-button"

interface Pool {
  collateral: string
  borrow: string
  oracle: string
  irm: string
}

const pools: Pool[] = [
  {
    collateral: "ETH/USDT",
    borrow: "USDC",
    oracle: "0xe9c1de5ea494219b965652",
    irm: "0x8c23c8",
  },
  {
    collateral: "BTC/USDT",
    borrow: "USDC",
    oracle: "0xe9c1de5ea494219b965652",
    irm: "0x8c23c8",
  },
]

export default function Vault({ params }: { params: { vault: string } }) {

  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="px-2 py-3 dark:bg-gray-900 shadow-xl transition-colors duration-200">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="w-full flex items-center justify-between space-x-2">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-1">
                <img src="/logo/gtx-white.png" className="h-8" alt="GTX Logo" />
                <span className="text-xl text-[#0064A7] dark:text-white font-bold pl-1">GTX</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/spot"
                className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
              >
                Spot
              </Link>
              <Link
                href="/perpetual"
                className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
              >
                Perpetual
              </Link>
              <Link
                href="/earn"
                className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
              >
                Earn
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <PrivyAuthButton showFullProfile={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid md:grid-cols-[2fr,1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Curator 3</h2>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="border-gray-800">
                  QuickWrite <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="sm" className="border-gray-800">
                  Governance Forum <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                <div className="text-sm text-gray-400">TVL</div>
                <div className="text-xl font-bold">$1.2M</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                <div className="text-sm text-gray-400">APY</div>
                <div className="text-xl font-bold">12.5%</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                <div className="text-sm text-gray-400">Utilization Rate</div>
                <div className="text-xl font-bold">0%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance</h3>
              <div className="h-48 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">
                <span className="text-gray-400">Coming Soon</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Allocation</h3>
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-4 text-sm text-gray-400">Trading Pair</th>
                      <th className="text-left p-4 text-sm text-gray-400">Asset</th>
                      <th className="text-left p-4 text-sm text-gray-400">Oracle</th>
                      <th className="text-left p-4 text-sm text-gray-400">IRM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((pool, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="p-4">{pool.collateral}</td>
                        <td className="p-4">{pool.borrow}</td>
                        <td className="p-4">
                          <code className="text-sm">{pool.oracle}</code>
                        </td>
                        <td className="p-4">
                          <code className="text-sm">{pool.irm}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Your Deposit</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Deposit:</span>
                <span>0</span>
              </div>
            </div>

            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>
              <TabsContent value="deposit" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Deposit</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="0.00" className="w-24 text-right" />
                      <Button size="sm">Max</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Gas Fee</span>
                      <span>-</span>
                    </div>
                  </div>
                  <Button className="w-full">Deposit</Button>
                </div>
              </TabsContent>
              <TabsContent value="withdraw" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Withdraw</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="0.00" className="w-24 text-right" />
                      <Button size="sm">Max</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Gas Fee</span>
                      <span>-</span>
                    </div>
                  </div>
                  <Button className="w-full">Withdraw</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

