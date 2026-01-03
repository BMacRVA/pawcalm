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

type UserAnalytics = {
  overview: {
    totalUsers: number
    usersToday: number
    usersThisWeek: number
    usersThisMonth: number
    activeThisWeek: number
    activeThisMonth: number
    churnRisk: number
  }
  funnel: {
    signedUp: number
    createdDog: number
    practicedOnce: number
    usedJournal: number
    activationRate: number
    practiceRate: number
    journalRate: number
  }
  growth: {
    signupsByDay: { date: string; count: number }[]
  }
  cohorts: {
    week: string
    signups: number
    activationRate: number
    practiceRate: number
    week1RetentionRate: number
  }[]
  recentUsers: {
    email: string
    signupDate: string
    hasDog: boolean
    dogCount: number
    practiceCount: number
    journalCount: number
    lastActivity: string | null
    daysSinceSignup: number
  }[]
  featureUsage: {
    totalPractices: number
    totalJournalMessages: number
    totalCheckins: number
    avgPracticesPerUser: number
    avgJournalPerUser: number
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState<'insights' | 'users'>('insights')
  const [error, setError] = useState('')

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }),
        fetch('/api/admin/user-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }),
      ])

      if (statsResponse.ok && analyticsResponse.ok) {
        const [statsData, analyticsData] = await Promise.all([
          statsResponse.json(),
          analyticsResponse.json(),
        ])
        setAuthenticated(true)
        setStats(statsData.stats)
        setInsights(statsData.insights)
        setUserAnalytics(analyticsData)
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

  if (!stats || !insights || !userAnalytics) {
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">🔬 PawCalm Admin Dashboard</h1>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('insights')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'insights'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Product Insights
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            User Analytics
          </button>
        </div>

        {activeTab === 'insights' && (
          <>
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
          </>
        )}

        {activeTab === 'users' && (
          <>
            {/* User Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <MetricCard label="Total Users" value={userAnalytics.overview.totalUsers} />
              <MetricCard label="Today" value={userAnalytics.overview.usersToday} color="blue" />
              <MetricCard label="This Week" value={userAnalytics.overview.usersThisWeek} color="blue" />
              <MetricCard label="This Month" value={userAnalytics.overview.usersThisMonth} color="blue" />
              <MetricCard label="Active (Week)" value={userAnalytics.overview.activeThisWeek} color="green" />
              <MetricCard label="Active (Month)" value={userAnalytics.overview.activeThisMonth} color="green" />
              <MetricCard label="Churn Risk" value={userAnalytics.overview.churnRisk} color="red" />
            </div>

            {/* User Funnel */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">👥 User Activation Funnel</h2>
              <div className="space-y-4">
                <FunnelStep
                  label="Signed Up"
                  value={userAnalytics.funnel.signedUp}
                  total={userAnalytics.funnel.signedUp}
                  isFirst
                />
                <FunnelStep
                  label="Created Dog Profile"
                  value={userAnalytics.funnel.createdDog}
                  total={userAnalytics.funnel.signedUp}
                  percent={userAnalytics.funnel.activationRate}
                />
                <FunnelStep
                  label="Completed First Practice"
                  value={userAnalytics.funnel.practicedOnce}
                  total={userAnalytics.funnel.signedUp}
                  percent={userAnalytics.funnel.practiceRate}
                />
                <FunnelStep
                  label="Used AI Coach"
                  value={userAnalytics.funnel.usedJournal}
                  total={userAnalytics.funnel.signedUp}
                  percent={userAnalytics.funnel.journalRate}
                />
              </div>
            </div>

            {/* Growth Chart & Cohorts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📈 Signups (Last 30 Days)</h3>
                <div className="h-48 flex items-end justify-between gap-1">
                  {userAnalytics.growth.signupsByDay.slice(-14).map((day, i) => {
                    const maxCount = Math.max(...userAnalytics.growth.signupsByDay.map(d => d.count), 1)
                    const height = (day.count / maxCount) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-amber-500 rounded-t hover:bg-amber-400 transition-colors"
                          style={{ height: `${height}%` }}
                          title={`${day.date}: ${day.count} signups`}
                        />
                        <span className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Feature Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Practices</span>
                    <span className="text-white font-semibold">{userAnalytics.featureUsage.totalPractices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coach Messages</span>
                    <span className="text-white font-semibold">{userAnalytics.featureUsage.totalJournalMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Check-ins</span>
                    <span className="text-white font-semibold">{userAnalytics.featureUsage.totalCheckins}</span>
                  </div>
                  <div className="h-px bg-gray-700 my-3" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Practices/User</span>
                    <span className="text-amber-400 font-semibold">{userAnalytics.featureUsage.avgPracticesPerUser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Coach Messages/User</span>
                    <span className="text-amber-400 font-semibold">{userAnalytics.featureUsage.avgJournalPerUser}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort Analysis */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">📅 Cohort Analysis (Last 12 Weeks)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-3 pr-4">Week</th>
                      <th className="text-right pb-3 pr-4">Signups</th>
                      <th className="text-right pb-3 pr-4">Activation %</th>
                      <th className="text-right pb-3 pr-4">Practice %</th>
                      <th className="text-right pb-3 pr-4">Week 1 Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAnalytics.cohorts.map((cohort, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className="py-3 pr-4 text-gray-300">{cohort.week}</td>
                        <td className="py-3 pr-4 text-right text-white">{cohort.signups}</td>
                        <td className="py-3 pr-4 text-right">
                          <span className={cohort.activationRate >= 70 ? 'text-green-400' : cohort.activationRate >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                            {cohort.activationRate}%
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={cohort.practiceRate >= 50 ? 'text-green-400' : cohort.practiceRate >= 30 ? 'text-yellow-400' : 'text-red-400'}>
                            {cohort.practiceRate}%
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={cohort.week1RetentionRate >= 40 ? 'text-green-400' : cohort.week1RetentionRate >= 20 ? 'text-yellow-400' : 'text-red-400'}>
                            {cohort.week1RetentionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">🆕 Recent Signups</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-3 pr-4">Email</th>
                      <th className="text-center pb-3 pr-4">Days Ago</th>
                      <th className="text-center pb-3 pr-4">Has Dog</th>
                      <th className="text-right pb-3 pr-4">Practices</th>
                      <th className="text-right pb-3 pr-4">Coach</th>
                      <th className="text-right pb-3 pr-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAnalytics.recentUsers.map((user, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className="py-3 pr-4 text-gray-300 truncate max-w-xs">{user.email}</td>
                        <td className="py-3 pr-4 text-center text-white">{user.daysSinceSignup}d</td>
                        <td className="py-3 pr-4 text-center">
                          {user.hasDog ? <span className="text-green-400">✓</span> : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="py-3 pr-4 text-right text-white">{user.practiceCount}</td>
                        <td className="py-3 pr-4 text-right text-white">{user.journalCount}</td>
                        <td className="py-3 pr-4 text-right text-gray-400 text-xs">
                          {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FunnelStep({
  label,
  value,
  total,
  percent,
  isFirst,
}: {
  label: string
  value: number
  total: number
  percent?: number
  isFirst?: boolean
}) {
  const width = total > 0 ? (value / total) * 100 : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">{value}</span>
          {!isFirst && percent !== undefined && (
            <span className={`text-xs font-medium ${percent >= 50 ? 'text-green-400' : percent >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {percent}%
            </span>
          )}
        </div>
      </div>
      <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFirst ? 'bg-amber-500' : 'bg-blue-500'}`}
          style={{ width: `${width}%` }}
        />
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
