'use client'

import { useState } from 'react'

type Hypothesis = {
  hypothesis: string
  status: string
  evidence: string
  recommendation: string
}

type Stats = {
  totalDogs: number
  totalPractices: number
  totalReps: number
  activeDogs: number
  inactiveDogs: number
  activeThisWeek: number
}

type Insights = {
  hypotheses: Hypothesis[]
  keyMetrics: {
    overallCalmRate: number
    activationRate: number
    avgPracticesPerActiveDog: number
    journalEngagementRate: number
    checkinCompletionRate: number
    activeThisWeek: number
  }
  topPerformers: any[]
  strugglingDogs: any[]
  cueAnalysis: {
    easiest: any[]
    hardest: any[]
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [error, setError] = useState('')

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const data = await response.json()
        setAuthenticated(true)
        setStats(data.stats)
        setInsights(data.insights)
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Failed to connect')
    }

    setLoading(false)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <form onSubmit={authenticate} className="bg-gray-800 p-8 rounded-xl max-w-sm w-full">
          <h1 className="text-xl font-bold text-white mb-4">Admin Access</h1>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 mb-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Enter'}
          </button>
        </form>
      </div>
    )
  }

  if (!stats || !insights) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading data...</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    if (status === 'VALIDATED') return 'text-green-400 bg-green-500/20'
    if (status === 'PROMISING') return 'text-blue-400 bg-blue-500/20'
    if (status === 'NEEDS_REVIEW') return 'text-yellow-400 bg-yellow-500/20'
    return 'text-gray-400 bg-gray-500/20'
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">🔬 PawCalm Research Dashboard</h1>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard label="Total Dogs" value={stats.totalDogs} />
          <MetricCard label="Active Dogs" value={stats.activeDogs} color="green" />
          <MetricCard label="Active This Week" value={stats.activeThisWeek} color="blue" />
          <MetricCard label="Total Practices" value={stats.totalPractices} />
          <MetricCard label="Overall Calm Rate" value={`${insights.keyMetrics.overallCalmRate}%`} color="green" />
          <MetricCard label="Avg Practices/Dog" value={insights.keyMetrics.avgPracticesPerActiveDog} />
        </div>

        {/* Hypotheses */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📊 Hypotheses & Insights</h2>
          <div className="space-y-6">
            {insights.hypotheses.map((h, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white flex-1">{h.hypothesis}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(h.status)}`}>
                    {h.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400 font-medium">Evidence:</span>
                    <p className="text-gray-300 mt-1">{h.evidence}</p>
                  </div>
                  <div>
                    <span className="text-amber-400 font-medium">💡 Recommendation:</span>
                    <p className="text-gray-300 mt-1">{h.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
            <div className="space-y-3">
              <EngagementBar
                label="Activation Rate"
                value={insights.keyMetrics.activationRate}
                total={100}
              />
              <EngagementBar
                label="Journal Usage"
                value={insights.keyMetrics.journalEngagementRate}
                total={100}
              />
              <EngagementBar
                label="Check-in Completion"
                value={insights.keyMetrics.checkinCompletionRate}
                total={100}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cue Difficulty Analysis</h3>
            <div className="mb-4">
              <p className="text-sm text-green-400 font-medium mb-2">✅ Easiest Cues:</p>
              {insights.cueAnalysis.easiest.slice(0, 3).map((cue, i) => (
                <div key={i} className="text-sm text-gray-300 ml-4">
                  • {cue.name} ({Math.round(cue.calmRate * 100)}% calm)
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm text-red-400 font-medium mb-2">⚠️ Hardest Cues:</p>
              {insights.cueAnalysis.hardest.slice(0, 3).map((cue, i) => (
                <div key={i} className="text-sm text-gray-300 ml-4">
                  • {cue.name} ({Math.round(cue.calmRate * 100)}% calm)
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Performers</h3>
            <div className="space-y-2">
              {insights.topPerformers.slice(0, 5).map((dog, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                  <div>
                    <span className="text-white font-medium">{dog.name}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      {dog.totalPractices} practices
                    </span>
                  </div>
                  <span className="text-green-400 font-semibold">{dog.calmRate}% calm</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">⚠️ Dogs Struggling (Need Support)</h3>
            {insights.strugglingDogs.length === 0 ? (
              <p className="text-gray-400 text-sm">No dogs struggling with low calm rates</p>
            ) : (
              <div className="space-y-2">
                {insights.strugglingDogs.slice(0, 5).map((dog, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                    <div>
                      <span className="text-white font-medium">{dog.name}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {dog.totalPractices} practices
                      </span>
                    </div>
                    <span className="text-red-400 font-semibold">{dog.calmRate}% calm</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color?: 'green' | 'red' | 'blue'
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-500'
      : color === 'red'
      ? 'text-red-500'
      : color === 'blue'
      ? 'text-blue-500'
      : 'text-white'

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-bold text-2xl ${colorClass}`}>{value}</p>
    </div>
  )
}

function EngagementBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.round((value / total) * 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{percent}%</span>
      </div>
      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
