"use client"

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface TradeCountChartProps {}

const TradeCountChart = ({}: TradeCountChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchTradeCountData = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getTradesCount(timeframe)
        setData(apiData.data || [])
        setError(null)
      } catch (error) {
        console.error('Error fetching trade count data:', error)
        setError('Failed to load trade count data. Please check if the analytics service is running at http://localhost:42090')
      } finally {
        setLoading(false)
      }
    }

    fetchTradeCountData()
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            axisLine={{ stroke: '#6b7280' }}
            tickLine={{ stroke: '#6b7280' }}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
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
            axisLine={{ stroke: '#6b7280' }}
            tickLine={{ stroke: '#6b7280' }}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="tradeCount"
            fill="#10b981"
            name="Total Trades"
          />
        </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default TradeCountChart