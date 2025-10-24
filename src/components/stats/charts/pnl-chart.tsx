"use client"

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface PnLChartProps {}

const PnLChart = ({}: PnLChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchPnLData = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getPnL(timeframe)
        console.log('PnL API Response:', apiData)
        
        const pnlData = apiData.pnlOverTime || []
        console.log('PnL Data Points:', pnlData.length)
        
        setData(pnlData)
        setError(null)
      } catch (error) {
        console.error('Error fetching PnL data:', error)
        setError('Failed to load PnL data. Please check if the analytics service is running at https://stats.gtxdex.xyz')
      } finally {
        setLoading(false)
      }
    }

    fetchPnLData()
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
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            interval={Math.max(0, Math.floor(data.length / 4))}
            tickFormatter={(value) => {
              const date = new Date(value)
              if (timeframe === '24h') {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
              } else if (timeframe === '7d') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
                       date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false })
              } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
            }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={(value) => {
              if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
              return `$${Number(value).toFixed(0)}`;
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: any, name: string) => {
              const displayName = name === 'totalPnl' ? 'Total PnL' : 
                                 name === 'realizedPnl' ? 'Realized PnL' : 'Unrealized PnL';
              return [`$${Number(value).toFixed(2)}`, displayName];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalPnl"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Total PnL"
          />
          <Line
            type="monotone"
            dataKey="realizedPnl"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Realized PnL"
          />
          <Line
            type="monotone"
            dataKey="unrealizedPnl"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Unrealized PnL"
          />
        </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default PnLChart