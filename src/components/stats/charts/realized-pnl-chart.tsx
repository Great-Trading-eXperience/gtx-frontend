"use client"

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Cell, CartesianGrid } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../timeframe-selector'

interface RealizedPnLChartProps {}

// Generate mock data for realized PnL
const generateMockRealizedPnLData = (timeframe: string) => {
  const now = new Date()
  const dataPoints = []
  
  let intervals = 24
  let intervalMinutes = 60
  
  if (timeframe === '7d') {
    intervals = 168 // 7 days * 24 hours
    intervalMinutes = 60
  } else if (timeframe === '30d') {
    intervals = 30
    intervalMinutes = 1440 // 24 hours
  }
  
  for (let i = intervals; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000))
    
    // Generate realistic PnL values (mix of positive and negative)
    // More variation during certain hours to simulate trading patterns
    const volatility = Math.sin(i * 0.4) * 500 + Math.random() * 1000 - 500
    const trend = Math.cos(i * 0.1) * 200
    const realizedPnl = Math.round(volatility + trend)
    
    dataPoints.push({
      date: date.toISOString(),
      realizedPnl: realizedPnl
    })
  }
  
  return dataPoints
}

const RealizedPnLChart = ({}: RealizedPnLChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchPnLData = async () => {
      setLoading(true)
      
      // For now, always use mock data for testing
      console.log('Generating mock realized PnL data for timeframe:', timeframe)
      const mockData = generateMockRealizedPnLData(timeframe)
      console.log('Mock realized PnL data generated:', mockData.length, 'data points')
      setData(mockData)
      setError(null)
      setLoading(false)
      return
      
      try {
        const apiData = await analyticsApi.getPnL(timeframe)
        console.log('Realized PnL API Response:', apiData)
        
        const pnlData = apiData.pnlOverTime || []
        console.log('Realized PnL Data Points:', pnlData.length)
        
        setData(pnlData)
        setError(null)
      } catch (error) {
        console.error('Error fetching realized PnL data:', error)
        
        // Generate mock data for development/demo purposes
        const mockData = generateMockRealizedPnLData(timeframe)
        setData(mockData)
        setError(null)
        console.log('Using mock realized PnL data:', mockData.length, 'data points')
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
  const values = data.map(d => Number(d.realizedPnl));
  const minValue = values.length > 0 ? Math.min(...values) : -1000;
  const maxValue = values.length > 0 ? Math.max(...values) : 1000;
  
  // Add 20% padding to both ends
  const padding = Math.max(Math.abs(minValue), Math.abs(maxValue)) * 0.2;
  const yAxisDomain = [minValue - padding, maxValue + padding];

  console.log('Realized PnL chart data:', data.length, 'points, Y-axis domain:', yAxisDomain);

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
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Realized PnL']}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Bar dataKey="realizedPnl">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={Number(entry.realizedPnl) >= 0 ? '#10b981' : '#ef4444'} 
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

export default RealizedPnLChart