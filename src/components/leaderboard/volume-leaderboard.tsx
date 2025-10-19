"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { analyticsApi } from '@/lib/analytics-api'
import TimeframeSelector from '../stats/timeframe-selector'

interface VolumeLeaderboardProps {}

interface VolumeLeaderEntry {
  userId: string
  value: number
  tradeCount?: number
  rank: number
}

const VolumeLeaderboard = ({}: VolumeLeaderboardProps) => {
  const [data, setData] = useState<VolumeLeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("30d")

  useEffect(() => {
    const fetchVolumeLeaderboard = async () => {
      setLoading(true)
      try {
        const apiData = await analyticsApi.getVolumeLeaderboard(timeframe, 20)
        console.log('Volume Leaderboard API Response:', apiData)
        
        const leaderboardData = apiData.data || []
        setData(leaderboardData)
        setError(null)
      } catch (error) {
        console.error('Error fetching volume leaderboard:', error)
        setError('Failed to load volume leaderboard. Please check if the analytics service is running at http://localhost:42090')
      } finally {
        setLoading(false)
      }
    }

    fetchVolumeLeaderboard()
  }, [timeframe])

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`
    return `$${volume.toFixed(2)}`
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
        <h3 className="text-lg font-semibold text-white">Volume Leaderboard</h3>
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
          <div>Volume</div>
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
                <div className="text-green-400 font-medium">
                  {formatVolume(entry.value)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

export default VolumeLeaderboard