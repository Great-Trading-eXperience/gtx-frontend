"use client"

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, CartesianGrid } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface InflowChartProps {}

const InflowChart = ({}: InflowChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchInflowData = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getInflows(timeframe)
        console.log('Inflow API Response:', apiData)
        
        const inflowData = apiData.inflowsOverTime || []
        console.log('Inflow Data Points:', inflowData.length)
        
        setData(inflowData)
        setError(null)
      } catch (error) {
        console.error('Error fetching inflow data:', error)
        setError('Failed to load inflow data. Please check if the analytics service is running at http://localhost:42090')
      } finally {
        setLoading(false)
      }
    }

    fetchInflowData()
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
  const values = data.map(d => Number(d.totalInflow || d.total_inflow || 0));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Add 10% padding to both ends (less padding for inflows since they're typically positive)
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
        <AreaChart data={data}>
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
              if (value >= 1e27) return `$${(value / 1e27).toFixed(1)}O`;
              if (value >= 1e24) return `$${(value / 1e24).toFixed(1)}Y`;
              if (value >= 1e21) return `$${(value / 1e21).toFixed(1)}Z`;
              if (value >= 1e18) return `$${(value / 1e18).toFixed(1)}E`;
              if (value >= 1e15) return `$${(value / 1e15).toFixed(1)}P`;
              if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
              if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
              if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
              if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
              return `$${value}`;
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
              name === 'totalInflow' ? `$${Number(value).toFixed(2)}` : 
              name === 'deposits' ? `$${Number(value).toFixed(2)}` :
              name === 'netFlow' ? `$${Number(value).toFixed(2)}` : value,
              name === 'totalInflow' ? 'Total Inflow' : 
              name === 'deposits' ? 'Deposits' :
              name === 'netFlow' ? 'Net Flow' : name
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="totalInflow"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="deposits"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
            strokeWidth={1}
          />
        </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default InflowChart