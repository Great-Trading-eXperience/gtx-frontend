"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../stats/timeframe-selector'

interface PnLLeaderboardProps {}

interface PnLLeaderEntry {
  userId: string
  value: number
  realizedPnl?: number
  unrealizedPnl?: number
  rank: number
}

const PnLLeaderboard = ({}: PnLLeaderboardProps) => {
  const [data, setData] = useState<PnLLeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("30d")

  useEffect(() => {
    const fetchPnLLeaderboard = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getPnLLeaderboard(timeframe, 20)
        console.log('PnL Leaderboard API Response:', apiData)
        
        const leaderboardData = apiData.data || []
        setData(leaderboardData)
        setError(null)
      } catch (error) {
        console.error('Error fetching PnL leaderboard:', error)
        setError('Failed to load PnL leaderboard. Please check if the analytics service is running at http://localhost:42090')
      } finally {
        setLoading(false)
      }
    }

    fetchPnLLeaderboard()
  }, [timeframe])

  const formatPnL = (pnl: number) => {
    const isNegative = pnl < 0
    const absValue = Math.abs(pnl)
    
    let formatted = ''
    if (absValue >= 1e9) formatted = `$${(absValue / 1e9).toFixed(2)}B`
    else if (absValue >= 1e6) formatted = `$${(absValue / 1e6).toFixed(2)}M`
    else if (absValue >= 1e3) formatted = `$${(absValue / 1e3).toFixed(2)}K`
    else formatted = `$${absValue.toFixed(2)}`
    
    return isNegative ? `-${formatted}` : `+${formatted}`
  }

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const truncateAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-600 p-6">
        <div className="h-96 flex items-center justify-center text-gray-400">Loading leaderboard...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-600 p-6">
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 p-4">
          <div className="text-red-400 text-center mb-2">⚠️ API Error</div>
          <div className="text-sm text-center">{error}</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">PnL Leaderboard</h3>
        <TimeframeSelector 
          timeframe={timeframe} 
          onTimeframeChange={setTimeframe}
        />
      </div>
      
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-400 pb-2 border-b border-gray-600">
          <div>Rank</div>
          <div>Address</div>
          <div>Total PnL</div>
        </div>
        
        {/* Leaderboard Entries */}
        <div className="max-h-80 overflow-y-auto">
          {data.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No data available</div>
          ) : (
            data.map((entry, index) => (
              <div key={entry.userId || index} className="grid grid-cols-3 gap-4 py-3 text-sm hover:bg-gray-700 rounded-lg px-2 transition-colors">
                <div className="text-white font-medium">
                  {entry.rank || index + 1}
                  {(entry.rank || index + 1) === 1 && <span className="ml-1 text-yellow-400">👑</span>}
                  {(entry.rank || index + 1) === 2 && <span className="ml-1 text-gray-300">🥈</span>}
                  {(entry.rank || index + 1) === 3 && <span className="ml-1 text-amber-600">🥉</span>}
                </div>
                <div className="text-gray-300 font-mono">
                  {truncateAddress(entry.userId)}
                </div>
                <div className={`font-medium ${getPnLColor(entry.value)}`}>
                  {formatPnL(entry.value)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

export default PnLLeaderboard