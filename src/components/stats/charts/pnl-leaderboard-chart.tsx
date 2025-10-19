"use client"

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface PnLLeaderboardChartProps {}

const PnLLeaderboardChart = ({}: PnLLeaderboardChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchPnLLeaderboardData = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getPnLLeaderboard(timeframe, 10)
        setData(apiData.data || [])
        setError(null)
      } catch (error) {
        console.error('Error fetching PnL leaderboard data:', error)
        setError('Failed to load PnL leaderboard. Please check if the analytics service is running at http://localhost:42090')
      } finally {
        setLoading(false)
      }
    }

    fetchPnLLeaderboardData()
  }, [timeframe])

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading chart...</div>
  }

  if (error) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-gray-400 p-4">
        <div className="text-red-400 text-center mb-2">⚠️ API Error</div>
        <div className="text-sm text-center">{error}</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeframe Selector */}
      <div className="absolute top-0 right-0 z-10">
        <TimeframeSelector 
          timeframe={timeframe} 
          onTimeframeChange={setTimeframe}
        />
      </div>
      
      <div className="h-80">
        <div className="h-10"></div>
        <div style={{ height: 'calc(100% - 2.5rem)' }}>
          <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal">
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <YAxis 
            type="category"
            dataKey="trader"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            width={80}
            tickFormatter={(value) => `${value.slice(0, 6)}...${value.slice(-4)}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any, name: string) => [
              name === 'pnl' ? `$${(value / 1000).toFixed(1)}K` : `${value}%`,
              name === 'pnl' ? 'PnL' : 'Win Rate'
            ]}
            labelFormatter={(label) => `Trader: ${label}`}
          />
          <Bar
            dataKey="pnl"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default PnLLeaderboardChart