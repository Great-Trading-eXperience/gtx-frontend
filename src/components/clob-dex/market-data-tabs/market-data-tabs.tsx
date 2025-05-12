"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PoolItem } from "@/graphql/gtx/clob"
import { HexAddress } from "@/types/general/address"
import { BarChart2, LineChart } from "lucide-react"
import { ClobDexComponentProps } from "../clob-dex"
import EnhancedOrderBookDex from "../orderbook-dex/orderbook-dex"
import RecentTradesComponent from "../recent-trade/recent-trade"

export interface MarketDataTabsProps extends ClobDexComponentProps {
    address: HexAddress | undefined
    chainId: number
    defaultChainId: number
    selectedPool: PoolItem
    poolsLoading: boolean
    poolsError: Error | null
}

const MarketDataTabs = ({ chainId, defaultChainId, selectedPool, poolsLoading, poolsError }: MarketDataTabsProps) => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 shadow-lg backdrop-blur-sm">
      {/* Decorative Elements */}
      {/* <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-gray-500/10 blur-3xl" />
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-gray-500/10 blur-3xl" /> */}

      <Tabs defaultValue="orderbook" className="w-full">
        <div className="relative border-b border-gray-800/30 backdrop-blur-sm">
          <TabsList className="flex w-full justify-start gap-1 bg-transparent px-4 py-1">
            <TabsTrigger
              value="orderbook"
              className="group w-1/2 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-gray-200 data-[state=active]:bg-gray-800/40 data-[state=active]:text-white"
            >
              <LineChart className="h-4 w-4" />
              <span>Order Book</span>
              <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="group w-1/2 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-gray-200 data-[state=active]:bg-gray-800/40 data-[state=active]:text-white"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Trades</span>
              <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-0">
          <TabsContent
            value="orderbook"
            className="mt-0 transition-all duration-300 data-[state=inactive]:opacity-0 data-[state=active]:animate-in data-[state=active]:fade-in-0"
          >
            <EnhancedOrderBookDex chainId={chainId} defaultChainId={defaultChainId} selectedPool={selectedPool} poolsLoading={poolsLoading} poolsError={poolsError} />
          </TabsContent>

          <TabsContent
            value="trades"
            className="mt-0 transition-all duration-300 data-[state=inactive]:opacity-0 data-[state=active]:animate-in data-[state=active]:fade-in-0"
          >
            <RecentTradesComponent chainId={chainId ?? defaultChainId} defaultChainId={defaultChainId} selectedPool={selectedPool} poolsLoading={poolsLoading} poolsError={poolsError} />
          </TabsContent>
        </div> 
      </Tabs>

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/50 to-transparent" />
    </div>
  )
}

export default MarketDataTabs

