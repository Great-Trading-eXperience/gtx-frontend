"use client"

import { useState } from 'react'
import VolumeLeaderboard from './volume-leaderboard'
import PnLLeaderboard from './pnl-leaderboard'

const LeaderboardDashboard = () => {
  const [activeTab, setActiveTab] = useState<'volume' | 'pnl'>('volume')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('volume')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'volume'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Volume Leaders
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pnl'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          PnL Leaders
        </button>
      </div>

      {/* Active Leaderboard */}
      <div className="w-full">
        {activeTab === 'volume' ? <VolumeLeaderboard /> : <PnLLeaderboard />}
      </div>
    </div>
  )
}

export default LeaderboardDashboard