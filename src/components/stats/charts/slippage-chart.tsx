"use client"

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface SlippageChartProps {}

const SlippageChart = ({}: SlippageChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchSlippageData = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getSlippage(timeframe)
        console.log('Slippage API Response:', apiData)
        
        const slippageData = apiData.slippageOverTime || apiData.data || []
        console.log('Slippage Data Points:', slippageData.length)
        
        setData(slippageData)
        setError(null)
      } catch (error) {
        console.error('Error fetching slippage data:', error)
        setError('Failed to load slippage data. Please check if the analytics service is running at http://localhost:42090')
      } finally {
        setLoading(false)
      }
    }

    fetchSlippageData()
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

  // Calculate min and max for proper domain
  const values = data.map(d => Number(d.averageSlippage || d.average_slippage || d.slippage || 0));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Add 10% padding to both ends
  const padding = (maxValue - minValue) * 0.1;
  const yAxisDomain = [Math.max(0, minValue - padding), maxValue + padding];

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
            domain={yAxisDomain}
            tickFormatter={(value) => {
              return `${(value * 100).toFixed(2)}%`;
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any, name: string) => [
              name === 'averageSlippage' || name === 'average_slippage' || name === 'slippage' ? `${(Number(value) * 100).toFixed(4)}%` : value,
              name === 'averageSlippage' ? 'Average Slippage' : 
              name === 'average_slippage' ? 'Average Slippage' :
              name === 'slippage' ? 'Slippage' : name
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="averageSlippage"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="average_slippage"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="slippage"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default SlippageChart