import LeaderboardDashboard from '@/components/leaderboard/leaderboard-dashboard'

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400">Track top performers across volume and PnL metrics</p>
      </div>
      <LeaderboardDashboard />
    </div>
  )
}