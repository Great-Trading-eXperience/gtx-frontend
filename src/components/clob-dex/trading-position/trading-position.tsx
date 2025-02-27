'use client'

import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAccount } from 'wagmi'
import OrderHistoryTable from "./order-history"
import TradeHistoryTable from "./trade-history"
import { ButtonConnectWallet } from "@/components/button-connect-wallet.tsx/button-connect-wallet"
import BalancesHistoryTable from "./balances-history"

export default function TradingInterface() {
  const { isConnected } = useAccount()

  return (
    <div className="mt-[4px] bg-gray-100 rounded-lg dark:bg-gray-900 shadow-lg">
      <Card className="border-gray-200 dark:border-zinc-800 bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
        <Tabs defaultValue="open-orders" className="p-6">
          <div className="space-y-4">
            <TabsList className="h-auto flex gap-4 bg-transparent w-full justify-start rounded-none p-0">
              <TabsTrigger
                value="open-orders"
                className="text-2xl font-normal data-[state=active]:border-b-2 border-[#0064A7] data-[state=active]:text-[#0064A7] text-gray-700 dark:text-zinc-100 hover:text-gray-900 dark:hover:text-white rounded-none px-0 pb-2"
              >
                My Open Orders
              </TabsTrigger>
              <div className="text-2xl text-gray-400 dark:text-zinc-600 px-4">|</div>
              <TabsTrigger
                value="trades"
                className="text-2xl font-normal data-[state=active]:border-b-2 border-[#0064A7] data-[state=active]:text-[#0064A7] text-gray-700 dark:text-zinc-100 hover:text-gray-900 dark:hover:text-white rounded-none px-0 pb-2"
              >
                My Trades
              </TabsTrigger>
              <div className="text-2xl text-gray-400 dark:text-zinc-600 px-4">|</div>
              <TabsTrigger
                value="balances"
                className="text-2xl font-normal data-[state=active]:border-b-2 border-[#0064A7] data-[state=active]:text-[#0064A7] text-gray-700 dark:text-zinc-100 hover:text-gray-900 dark:hover:text-white rounded-none px-0 pb-2"
              >
                My Balances
              </TabsTrigger>
            </TabsList>
            <TabsContent value="open-orders" className="pt-6">
              <div className="space-y-8">
                {isConnected ? (
                  <OrderHistoryTable />
                ) : (
                  <>
                    <p className="text-xl text-gray-600 dark:text-zinc-400">
                      Connect your wallet to see your open orders.
                    </p>
                    <div className="flex gap-4">
                      <ButtonConnectWallet />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            <TabsContent value="trades" className="pt-6">
              <div className="space-y-8">
                {isConnected ? (
                  <TradeHistoryTable />
                ) : (
                  <>
                    <p className="text-xl text-gray-600 dark:text-zinc-400">
                      Connect your wallet to see your trades.
                    </p>
                    <div className="flex gap-4">
                      <ButtonConnectWallet />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            <TabsContent value="balances" className="pt-6">
              <div className="space-y-8">
                {isConnected ? (
                  <BalancesHistoryTable />
                ) : (
                  <>
                    <p className="text-xl text-gray-600 dark:text-zinc-400">
                      Connect your wallet to see your trades.
                    </p>
                    <div className="flex gap-4">
                      <ButtonConnectWallet />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
          </div>
        </Tabs>
      </Card>
    </div>
  )
}

