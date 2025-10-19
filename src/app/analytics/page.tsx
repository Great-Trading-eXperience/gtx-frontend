"use client"

import { Suspense } from 'react'
import AnalyticsDashboard from '@/components/stats/analytics-dashboard'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">GTX Stats</h1>
        <Suspense fallback={<div className="text-center">Loading analytics...</div>}>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </div>
  )
}