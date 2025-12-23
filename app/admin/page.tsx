'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type Stats = {
  totalUsers: number
  totalDogs: number
  totalSessions: number
  signupsToday: number
  signupsThisWeek: number
  signupsThisMonth: number
  sessionsToday: number
  sessionsThisWeek: number
  activeUsersThisWeek: number
  avgSessionsPerDog: number
  dogsImproving: number
  dogsStuck: number
  dogsNew: number
  churnRisk: number
  greatResponses: number
  okayResponses: number
  struggledResponses: number
  completionRate: number
  avgStreak: number
  topDogs: { name: string; sessions: number; trend: string }[]
  recentSignups: { email: string; created_at: string; has_dog: boolean; sessions: number }[]
  recentSessions: { dog_name: string; mission_title: string; dog_response: string; created_at: string }[]
  dailySignups: { date: string; count: number }[]
  dailySessions: { date: string; count: number }[]
  conversionFunnel: { step: string; count: number; rate: number }[]
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''

  const authenticate = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      sessionStorage.setItem('adminAuth', 'true')
    } else {
      alert('Wrong password')
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchStats()
    }
  }, [authenticated])

  const fetchStats = async () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all data
    const [
      { data: users },
      { data: dogs },
      { data: sessions },
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('dogs').select('*'),
      supabase.from('sessions').select('*'),
    ])

    // If no users table, use auth users via dogs
    const allDogs = dogs || []
    const allSessions = sessions || []

    // Calculate signups (using dogs as proxy for active users)
    const signupsToday = allDogs.filter(d => new Date(d.created_at) >= today).length
    const signupsThisWeek = allDogs.filter(d => new Date(d.created_at) >= weekAgo).length
    const signupsThisMonth = allDogs.filter(d => new Date(d.created_at) >= monthAgo).length

    // Sessions stats
    const sessionsToday = allSessions.filter(s => new Date(s.created_at) >= today).length
    const sessionsThisWeek = allSessions.filter(s => new Date(s.created_at) >= weekAgo).length

    // Active users (dogs with sessions this week)
    const activeDogsThisWeek = new Set(
      allSessions
        .filter(s => new Date(s.created_at) >= weekAgo)
        .map(s => s.dog_id)
    ).size

    // Response breakdown
    const greatResponses = allSessions.filter(s => s.dog_response === 'great').length
    const okayResponses = allSessions.filter(s => s.dog_response === 'okay').length
    const struggledResponses = allSessions.filter(s => s.dog_response === 'struggled').length

    // Dogs by status
    const dogStats = allDogs.map(dog => {
      const dogSessions = allSessions
        .filter(s => s.dog_id === dog.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      const recentSessions = dogSessions.slice(0, 5)
      const olderSessions = dogSessions.slice(5, 10)

      const recentScore = recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + (s.dog_response === 'great' ? 1 : s.dog_response === 'okay' ? 0 : -1), 0) / recentSessions.length
        : null

      const olderScore = olderSessions.length > 0
        ? olderSessions.reduce((sum, s) => sum + (s.dog_response === 'great' ? 1 : s.dog_response === 'okay' ? 0 : -1), 0) / olderSessions.length
        : null

      let trend = 'new'
      if (recentScore !== null && olderScore !== null) {
        if (recentScore > olderScore + 0.2) trend = 'improving'
        else if (recentScore < olderScore - 0.2) trend = 'declining'
        else trend = 'stable'
      } else if (dogSessions.length >= 3) {
        trend = 'stable'
      }

      const lastSession = dogSessions[0]
      const daysSinceLastSession = lastSession
        ? Math.floor((now.getTime() - new Date(lastSession.created_at).getTime()) / (24 * 60 * 60 * 1000))
        : 999

      return {
        ...dog,
        sessionCount: dogSessions.length,
        trend,
        daysSinceLastSession,
        recentScore
      }
    })

    const dogsImproving = dogStats.filter(d => d.trend === 'improving').length
    const dogsStuck = dogStats.filter(d => d.trend === 'declining' || d.trend === 'stable').length
    const dogsNew = dogStats.filter(d => d.trend === 'new').length
    const churnRisk = dogStats.filter(d => d.daysSinceLastSession >= 7 && d.sessionCount > 0).length

    // Top dogs by sessions
    const topDogs = dogStats
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 5)
      .map(d => ({ name: d.name, sessions: d.sessionCount, trend: d.trend }))

    // Recent signups with activity
    const recentSignups = allDogs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(d => ({
        email: d.name + "'s owner",
        created_at: d.created_at,
        has_dog: true,
        sessions: allSessions.filter(s => s.dog_id === d.id).length
      }))

    // Recent sessions
    const recentSessions = allSessions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(s => {
        const dog = allDogs.find(d => d.id === s.dog_id)
        return {
          dog_name: dog?.name || 'Unknown',
          mission_title: s.mission_title || 'Training Session',
          dog_response: s.dog_response || 'unknown',
          created_at: s.created_at
        }
      })

    // Daily signups (last 14 days)
    const dailySignups: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = allDogs.filter(d => d.created_at.startsWith(dateStr)).length
      dailySignups.push({ date: dateStr, count })
    }

    // Daily sessions (last 14 days)
    const dailySessions: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = allSessions.filter(s => s.created_at.startsWith(dateStr)).length
      dailySessions.push({ date: dateStr, count })
    }

    // Conversion funnel
    const totalVisitors = allDogs.length * 10 // Rough estimate
    const conversionFunnel = [
      { step: 'Visited Site', count: totalVisitors, rate: 100 },
      { step: 'Started Signup', count: Math.round(totalVisitors * 0.3), rate: 30 },
      { step: 'Completed Signup', count: allDogs.length, rate: Math.round((allDogs.length / totalVisitors) * 100) },
      { step: 'Generated Mission', count: allDogs.filter(d => allSessions.some(s => s.dog_id === d.id)).length, rate: 0 },
      { step: 'Logged Session', count: new Set(allSessions.map(s => s.dog_id)).size, rate: 0 },
      { step: 'Returned (2+ sessions)', count: dogStats.filter(d => d.sessionCount >= 2).length, rate: 0 },
    ]
    conversionFunnel.forEach((step, i) => {
      if (i > 0) {
        step.rate = conversionFunnel[0].count > 0 ? Math.round((step.count / conversionFunnel[0].count) * 100) : 0
      }
    })

    // Avg sessions per dog
    const avgSessionsPerDog = allDogs.length > 0
      ? Math.round((allSessions.length / allDogs.length) * 10) / 10
      : 0

    // Completion rate (sessions with 'great' or 'okay')
    const completionRate = allSessions.length > 0
      ? Math.round(((greatResponses + okayResponses) / allSessions.length) * 100)
      : 0

    // Avg streak (rough calculation)
    const avgStreak = dogStats.length > 0
      ? Math.round(dogStats.reduce((sum, d) => sum + Math.min(d.sessionCount, 7), 0) / dogStats.length * 10) / 10
      : 0

    setStats({
      totalUsers: allDogs.length,
      totalDogs: allDogs.length,
      totalSessions: allSessions.length,
      signupsToday,
      signupsThisWeek,
      signupsThisMonth,
      sessionsToday,
      sessionsThisWeek,
      activeUsersThisWeek: activeDogsThisWeek,
      avgSessionsPerDog,
      dogsImproving,
      dogsStuck,
      dogsNew,
      churnRisk,
      greatResponses,
      okayResponses,
      struggledResponses,
      completionRate,
      avgStreak,
      topDogs,
      recentSignups,
      recentSessions,
      dailySignups,
      dailySessions,
      conversionFunnel,
    })

    setLoading(false)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <form onSubmit={authenticate} className="bg-gray-800 p-8 rounded-xl max-w-sm w-full">
          <h1 className="text-xl font-bold text-white mb-4">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 mb-4"
          />
          <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold">
            Enter
          </button>
        </form>
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">📊 PawCalm Admin</h1>
          <button
            onClick={() => { sessionStorage.removeItem('adminAuth'); setAuthenticated(false) }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total Dogs" value={stats.totalDogs} />
          <MetricCard label="Total Sessions" value={stats.totalSessions} />
          <MetricCard label="Active This Week" value={stats.activeUsersThisWeek} color="green" />
          <MetricCard label="Churn Risk" value={stats.churnRisk} color="red" />
        </div>

        {/* Growth Metrics */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          <MetricCard label="Signups Today" value={stats.signupsToday} small />
          <MetricCard label="Signups This Week" value={stats.signupsThisWeek} small />
          <MetricCard label="Signups This Month" value={stats.signupsThisMonth} small />
          <MetricCard label="Sessions Today" value={stats.sessionsToday} small />
          <MetricCard label="Sessions This Week" value={stats.sessionsThisWeek} small />
          <MetricCard label="Avg Sessions/Dog" value={stats.avgSessionsPerDog} small />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Signups Chart */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Signups (14 days)</h2>
            <div className="flex items-end gap-1 h-32">
              {stats.dailySignups.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-amber-600 rounded-t"
                    style={{ height: `${Math.max(day.count * 20, 4)}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">{day.date.slice(-2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions Chart */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Sessions (14 days)</h2>
            <div className="flex items-end gap-1 h-32">
              {stats.dailySessions.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-600 rounded-t"
                    style={{ height: `${Math.max(day.count * 15, 4)}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">{day.date.slice(-2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dog Outcomes & Response Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Dog Outcomes */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dog Outcomes</h2>
            <div className="space-y-3">
              <OutcomeBar label="Improving" count={stats.dogsImproving} total={stats.totalDogs} color="bg-green-500" />
              <OutcomeBar label="Stable/Stuck" count={stats.dogsStuck} total={stats.totalDogs} color="bg-amber-500" />
              <OutcomeBar label="New (< 5 sessions)" count={stats.dogsNew} total={stats.totalDogs} color="bg-blue-500" />
            </div>
          </div>

          {/* Response Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Session Responses</h2>
            <div className="space-y-3">
              <OutcomeBar label="Great 🌟" count={stats.greatResponses} total={stats.totalSessions} color="bg-green-500" />
              <OutcomeBar label="Okay 😐" count={stats.okayResponses} total={stats.totalSessions} color="bg-amber-500" />
              <OutcomeBar label="Struggled 😰" count={stats.struggledResponses} total={stats.totalSessions} color="bg-red-500" />
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Success Rate: <span className="text-white font-semibold">{stats.completionRate}%</span>
            </p>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h2>
          <div className="space-y-2">
            {stats.conversionFunnel.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-40 text-gray-400 text-sm">{step.step}</div>
                <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full"
                    style={{ width: `${step.rate}%` }}
                  />
                </div>
                <div className="w-20 text-right text-white text-sm">{step.count} ({step.rate}%)</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top Dogs */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🏆 Top Dogs</h2>
            <div className="space-y-2">
              {stats.topDogs.map((dog, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">#{i + 1}</span>
                    <span className="text-white">{dog.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      dog.trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                      dog.trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {dog.trend}
                    </span>
                  </div>
                  <span className="text-amber-500 font-semibold">{dog.sessions} sessions</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
            <div className="space-y-2">
              {stats.recentSessions.slice(0, 5).map((session, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                  <div>
                    <span className="text-white">{session.dog_name}</span>
                    <span className="text-gray-400 text-sm ml-2">{session.mission_title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{session.dog_response === 'great' ? '🌟' : session.dog_response === 'okay' ? '😐' : '😰'}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Signups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="pb-3">Dog/Owner</th>
                  <th className="pb-3">Signed Up</th>
                  <th className="pb-3">Sessions</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {stats.recentSignups.map((signup, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="py-3">{signup.email}</td>
                    <td className="py-3 text-gray-400">{new Date(signup.created_at).toLocaleDateString()}</td>
                    <td className="py-3">{signup.sessions}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        signup.sessions === 0 ? 'bg-red-500/20 text-red-400' :
                        signup.sessions < 3 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {signup.sessions === 0 ? 'No activity' : signup.sessions < 3 ? 'Getting started' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, small }: { label: string; value: number | string; color?: string; small?: boolean }) {
  return (
    <div className={`bg-gray-800 rounded-xl ${small ? 'p-4' : 'p-6'}`}>
      <p className={`text-gray-400 ${small ? 'text-xs' : 'text-sm'}`}>{label}</p>
      <p className={`font-bold ${small ? 'text-xl' : 'text-3xl'} ${
        color === 'green' ? 'text-green-500' :
        color === 'red' ? 'text-red-500' :
        'text-white'
      }`}>
        {value}
      </p>
    </div>
  )
}

function OutcomeBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{count} ({percent}%)</span>
      </div>
      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}