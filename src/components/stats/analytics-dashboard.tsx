"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import VolumeChart from './charts/volume-chart'
import TradeCountChart from './charts/trade-count-chart'
import CumulativeUsersChart from './charts/cumulative-users-chart'
import RealizedPnLChart from './charts/realized-pnl-chart'
import UnrealizedPnLChart from './charts/unrealized-pnl-chart'
import InflowChart from './charts/inflow-chart'
import OutflowChart from './charts/outflow-chart'
import LiquidityChart from './charts/liquidity-chart'
// import SlippageChart from './charts/slippage-chart'

const AnalyticsDashboard = () => {

  // Summary statistics - will be populated from API
  const summaryStats = [
    { label: "Total Trades", value: "Loading..." },
    { label: "Total Volume", value: "Loading..." },
    { label: "Data Processing", value: "Loading..." }
  ]

  return (
    <div className="space-y-6">

      {/* Summary Statistics */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="bg-gray-800 border-gray-600 p-4">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </Card>
        ))}
      </div> */}

      {/* Charts Grid - 2 charts per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflow Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Capital Inflows</h3>
          <InflowChart />
        </Card>

        {/* Outflow Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Capital Outflows</h3>
          <OutflowChart />
        </Card>

        {/* Volume Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Total Volume</h3>
          <VolumeChart />
        </Card>

        {/* Number of Trades Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Number Of Trades</h3>
          <TradeCountChart />
        </Card>

        {/* Realized PnL Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Realized PnL</h3>
          <RealizedPnLChart />
        </Card>

        {/* Unrealized PnL Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Unrealized PnL</h3>
          <UnrealizedPnLChart />
        </Card>

        {/* Cumulative Users Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cumulative New Users</h3>
          <CumulativeUsersChart />
        </Card>

        {/* Liquidity Chart */}
        <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Liquidity</h3>
          <LiquidityChart />
        </Card>

        {/* Slippage Chart */}
        {/* <Card className="bg-gray-800 border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Slippage</h3>
          <SlippageChart />
        </Card> */}

      </div>
    </div>
  )
}

export default AnalyticsDashboard