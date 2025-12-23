'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

type Session = {
  id: string
  created_at: string
  mission_title: string
  dog_response: string
  owner_feeling: string
  steps_completed: number
  steps_total: number
  outcome: string
  notes: string
}

type Dog = {
  id: string
  name: string
  created_at: string
}

export default function ProgressPage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dogData) {
      setDog(dogData)

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', dogData.id)
        .order('created_at', { ascending: false })

      if (sessionData) {
        setSessions(sessionData)
        calculateStreak(sessionData)
      }
    }
    setLoading(false)
  }

  const calculateStreak = (sessions: Session[]) => {
    if (sessions.length === 0) {
      setStreak(0)
      return
    }

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionDates = sessions.map(s => {
      const d = new Date(s.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })

    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      expectedDate.setHours(0, 0, 0, 0)

      if (uniqueDates[i] === expectedDate.getTime()) {
        currentStreak++
      } else if (i === 0 && uniqueDates[i] === expectedDate.getTime() - 86400000) {
        // Allow for yesterday if no session today yet
        currentStreak++
      } else {
        break
      }
    }

    setStreak(currentStreak)
  }

  const getWeekNumber = (date: Date, startDate: Date) => {
    const diff = date.getTime() - startDate.getTime()
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  }

  const getAnxietyScore = (sessions: Session[]) => {
    if (sessions.length === 0) return null
    const recentSessions = sessions.slice(0, 5)
    const scores = recentSessions.map(s => {
      if (s.dog_response === 'great') return 2
      if (s.dog_response === 'okay') return 5
      return 8
    })
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  const getProgressMessage = () => {
    if (sessions.length === 0) return "Complete your first mission to start tracking progress!"
    if (sessions.length < 5) return "Keep going! We need a few more sessions to show trends."
    
    const recentScore = getAnxietyScore(sessions.slice(0, 5))
    const olderScore = getAnxietyScore(sessions.slice(5, 10))
    
    if (!olderScore) return "Great start! Keep building consistency."
    if (recentScore && recentScore < olderScore) return `${dog?.name} is improving! Anxiety score dropped from ${olderScore} to ${recentScore}.`
    if (recentScore === olderScore) return "Holding steady. Consistency is key — keep it up!"
    return "Some ups and downs are normal. Check the tips below."
  }

  const getLast14Days = () => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const daySession = sessions.find(s => {
        const sessionDate = new Date(s.created_at)
        sessionDate.setHours(0, 0, 0, 0)
        return sessionDate.getTime() === date.getTime()
      })

      days.push({
        date,
        hasSession: !!daySession,
        response: daySession?.dog_response || null
      })
    }
    return days
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    )
  }

  const anxietyScore = getAnxietyScore(sessions)
  const last14Days = getLast14Days()
  const completionRate = sessions.length > 0
    ? Math.round((sessions.filter(s => s.outcome === 'success').length / sessions.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <h1 className="text-3xl font-bold text-amber-950 mb-2">{dog?.name}'s Progress</h1>
        <p className="text-amber-800/70 mb-8">{getProgressMessage()}</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-sm">
            <p className="text-3xl font-bold text-amber-600">{streak}</p>
            <p className="text-sm text-amber-800/70">Day Streak 🔥</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-sm">
            <p className="text-3xl font-bold text-amber-600">{sessions.length}</p>
            <p className="text-sm text-amber-800/70">Sessions</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-sm">
            <p className="text-3xl font-bold text-amber-600">{anxietyScore || '—'}</p>
            <p className="text-sm text-amber-800/70">Anxiety Score</p>
          </div>
        </div>

        {/* 14-Day Activity */}
        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm mb-8">
          <h2 className="font-bold text-amber-950 mb-4">Last 14 Days</h2>
          <div className="flex gap-1 justify-between">
            {last14Days.map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs ${
                    day.hasSession
                      ? day.response === 'great'
                        ? 'bg-green-500 text-white'
                        : day.response === 'okay'
                        ? 'bg-amber-400 text-white'
                        : 'bg-red-400 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.hasSession ? (
                    day.response === 'great' ? '★' : day.response === 'okay' ? '•' : '~'
                  ) : ''}
                </div>
                <span className="text-xs text-amber-700/50 mt-1">
                  {day.date.getDate()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs text-amber-700/70">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Great</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded"></span> Okay</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded"></span> Struggled</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded"></span> No session</span>
          </div>
        </div>

        {/* Why Setbacks Are Normal */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-blue-900 mb-3">💙 Why Setbacks Are Normal</h2>
          <div className="space-y-3 text-blue-800 text-sm">
            <p>
              <strong>Dog anxiety isn't linear.</strong> Your dog might do great for 5 days, then have a rough day. This is completely normal and expected.
            </p>
            <p>
              <strong>Common setback triggers:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Changes in routine (guests, travel, new schedule)</li>
              <li>Weather changes or loud noises</li>
              <li>Your own stress (dogs pick up on it!)</li>
              <li>Pushing too fast too soon</li>
            </ul>
            <p>
              <strong>What to do:</strong> When setbacks happen, go back one step in difficulty. Rebuild confidence, then progress again. Two steps forward, one step back is still progress!
            </p>
          </div>
        </div>

        {/* Session History */}
        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
          <h2 className="font-bold text-amber-950 mb-4">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-amber-700/70 text-center py-8">No sessions yet. Complete your first mission!</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    session.dog_response === 'great' ? 'bg-green-100' :
                    session.dog_response === 'okay' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    {session.dog_response === 'great' ? '🌟' :
                     session.dog_response === 'okay' ? '😐' : '😰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-amber-950 truncate">{session.mission_title || 'Training Session'}</p>
                    <p className="text-sm text-amber-700/70">
                      {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {session.steps_total > 0 && ` • ${session.steps_completed}/${session.steps_total} steps`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/mission"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
          >
            Start Today's Mission →
          </Link>
        </div>
      </div>
    </div>
  )
}