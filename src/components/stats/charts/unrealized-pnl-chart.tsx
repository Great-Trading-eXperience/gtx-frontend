"use client"

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Cell, CartesianGrid } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface UnrealizedPnLChartProps {}

const UnrealizedPnLChart = ({}: UnrealizedPnLChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchPnLData = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getPnL(timeframe)
        console.log('Unrealized PnL API Response:', apiData)
        
        const pnlData = apiData.pnlOverTime || []
        console.log('Unrealized PnL Data Points:', pnlData.length)
        
        setData(pnlData)
        setError(null)
      } catch (error) {
        console.error('Error fetching unrealized PnL data:', error)
        setError('Failed to load unrealized PnL data. Please check if the analytics service is running at http://localhost:42090')
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

  // Calculate min and max for proper domain
  const values = data.map(d => Number(d.unrealizedPnl));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Add 20% padding to both ends
  const padding = Math.max(Math.abs(minValue), Math.abs(maxValue)) * 0.2;
  const yAxisDomain = [minValue - padding, maxValue + padding];

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
        <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            axisLine={{ stroke: '#6b7280' }}
            tickLine={{ stroke: '#6b7280' }}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            interval={Math.max(0, Math.floor(data.length / 3))}
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
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            domain={yAxisDomain}
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
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Unrealized PnL']}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Bar dataKey="unrealizedPnl">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={Number(entry.unrealizedPnl) >= 0 ? '#10b981' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default UnrealizedPnLChart