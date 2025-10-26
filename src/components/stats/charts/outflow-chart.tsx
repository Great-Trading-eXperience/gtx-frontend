"use client"

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, CartesianGrid } from 'recharts'
import { analyticsApi } from '@/lib/analytics-api'
import { createLogger } from '@/lib/logger'
import TimeframeSelector from '../timeframe-selector'

const logger = createLogger('outflow-chart')

interface OutflowChartProps {}

// Generate mock data for different timeframes
const generateMockOutflowData = (timeframe: string) => {
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
    
    // Generate realistic outflow values (very small, in tens range like deposits)
    const baseOutflow = 20 + Math.random() * 40
    const volatility = Math.sin(i * 0.3) * 15 + Math.random() * 10
    const totalOutflow = Math.max(0, baseOutflow + volatility)
    
    dataPoints.push({
      date: date.toISOString(),
      totalOutflow: Math.round(totalOutflow)
    })
  }
  
  return dataPoints
}

const OutflowChart = ({}: OutflowChartProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("24h")

  useEffect(() => {
    const fetchOutflowData = async () => {
      setLoading(true)
      
      // For now, always use mock data for testing
      logger.info('Generating mock outflow data for timeframe:', timeframe)
      const mockData = generateMockOutflowData(timeframe)
      logger.info('Mock outflow data generated:', { dataPoints: mockData.length })
      logger.debug('Sample data point:', mockData[0])
      setData(mockData)
      setError(null)
      setLoading(false)
      return
      
      try {
        const apiData = await analyticsApi.getOutflows(timeframe)
        logger.debug('Outflow API Response:', apiData)
        
        const outflowData = apiData.outflowsOverTime || []
        logger.info('Outflow Data Points:', { count: outflowData.length })
        
        setData(outflowData)
        setError(null)
      } catch (error) {
        logger.error('Error fetching outflow data:', error)
        
        // Generate mock data for development/demo purposes
        const mockData = generateMockOutflowData(timeframe)
        setData(mockData)
        setError(null)
        logger.info('Using mock outflow data:', { dataPoints: mockData.length })
      } finally {
        setLoading(false)
      }
    }

    fetchOutflowData()
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
  const values = data.map(d => Number(d.totalOutflow || d.total_outflow || 0));
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 100000;
  
  // Add 10% padding to both ends
  const padding = (maxValue - minValue) * 0.1;
  const yAxisDomain = [Math.max(0, minValue - padding), maxValue + padding];

  logger.debug('Outflow chart data:', { dataPoints: data.length, yAxisDomain });

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        No outflow data available
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
              if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
              if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
              if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
              if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
              return `$${Math.round(value)}`;
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
              name === 'totalOutflow' ? `$${Number(value).toFixed(2)}` : value,
              name === 'totalOutflow' ? 'Total Outflow' : name
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="totalOutflow"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="withdrawals"
            stroke="#f97316"
            fill="#f97316"
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

export default OutflowChart