'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

type Session = {
  id: string
  created_at: string
  dog_response: string
  mission_title: string
}

type CuePractice = {
  id: string
  created_at: string
  cues: { cue_id: string; cue_name: string; response: string }[]
}

export default function ProgressPage() {
  const [dogName, setDogName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [cuePractices, setCuePractices] = useState<CuePractice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dog) {
      setDogName(dog.name)

      const [sessionsRes, cuesRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('dog_id', dog.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('cue_practices')
          .select('*')
          .eq('dog_id', dog.id)
          .order('created_at', { ascending: false })
      ])

      if (sessionsRes.data) setSessions(sessionsRes.data)
      if (cuesRes.data) setCuePractices(cuesRes.data)
    }

    setLoading(false)
  }

  // Combined activity for timeline
  const getTimeline = () => {
    const items: { type: 'session' | 'cue'; date: string; data: any }[] = []
    
    sessions.forEach(s => {
      items.push({ type: 'session', date: s.created_at, data: s })
    })
    
    cuePractices.forEach(c => {
      items.push({ type: 'cue', date: c.created_at, data: c })
    })
    
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Calculate stats
  const totalSessions = sessions.length
  const totalCuePractices = cuePractices.length
  const totalActivities = totalSessions + totalCuePractices

  const greatSessions = sessions.filter(s => s.dog_response === 'great').length
  const okSessions = sessions.filter(s => s.dog_response === 'okay').length
  const struggledSessions = sessions.filter(s => s.dog_response === 'struggled').length

  const totalCuesTested = cuePractices.reduce((sum, cp) => sum + (cp.cues?.length || 0), 0)
  const calmCues = cuePractices.reduce((sum, cp) => 
    sum + (cp.cues?.filter(c => c.response === 'calm').length || 0), 0)
  const anxiousCues = cuePractices.reduce((sum, cp) => 
    sum + (cp.cues?.filter(c => c.response === 'anxious').length || 0), 0)

  // Calculate streak (sessions only for now)
  const calculateStreak = () => {
    if (sessions.length === 0) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sessionDates = sessions.map(s => {
      const d = new Date(s.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)
    let streak = 0
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      expected.setHours(0, 0, 0, 0)
      
      if (uniqueDates[i] === expected.getTime()) {
        streak++
      } else if (i === 0 && uniqueDates[i] === expected.getTime() - 86400000) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const streak = calculateStreak()
  const timeline = getTimeline()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-950 mb-1">{dogName}'s Progress</h1>
          <p className="text-amber-800/70">All your training in one place</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-amber-600">{streak}</p>
            <p className="text-xs text-amber-700/70">Day Streak 🔥</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-amber-950">{totalSessions}</p>
            <p className="text-xs text-amber-700/70">Sessions</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-amber-950">{totalCuePractices}</p>
            <p className="text-xs text-amber-700/70">Cue Practices</p>
          </div>
        </div>

        {/* Session Breakdown */}
        {totalSessions > 0 && (
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm mb-4">
            <h2 className="font-semibold text-amber-950 mb-3">Session Results</h2>
            <div className="flex gap-2">
              <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{greatSessions}</p>
                <p className="text-xs text-green-700">Great 🌟</p>
              </div>
              <div className="flex-1 bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{okSessions}</p>
                <p className="text-xs text-amber-700">Okay 👍</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{struggledSessions}</p>
                <p className="text-xs text-red-700">Struggled 💪</p>
              </div>
            </div>
          </div>
        )}

        {/* Cue Progress */}
        {totalCuesTested > 0 && (
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm mb-6">
            <h2 className="font-semibold text-amber-950 mb-3">Cue Desensitization</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-700">Calm responses</span>
                  <span className="font-medium text-green-600">{calmCues} / {totalCuesTested}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full"
                    style={{ width: `${totalCuesTested > 0 ? (calmCues / totalCuesTested) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            {anxiousCues > 0 && (
              <p className="text-sm text-amber-700/70 mt-3">
                {anxiousCues} cue{anxiousCues > 1 ? 's' : ''} still causing anxiety — keep practicing!
              </p>
            )}
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
          <h2 className="font-semibold text-amber-950 mb-4">Recent Activity</h2>
          
          {timeline.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-amber-700/70 mb-4">No activity yet</p>
              <Link 
                href="/mission"
                className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition"
              >
                Start First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-amber-100 last:border-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === 'session' 
                      ? item.data.dog_response === 'great' ? 'bg-green-100' 
                        : item.data.dog_response === 'okay' ? 'bg-amber-100' 
                        : 'bg-red-100'
                      : 'bg-blue-100'
                  }`}>
                    {item.type === 'session' ? '🎯' : '🚪'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-950">
                      {item.type === 'session' 
                        ? item.data.mission_title || 'Training Session'
                        : `Cue Practice (${item.data.cues?.length || 0} cues)`
                      }
                    </p>
                    <p className="text-sm text-amber-700/70">
                      {item.type === 'session' 
                        ? `${item.data.dog_response === 'great' ? '🌟 Great' : item.data.dog_response === 'okay' ? '👍 Okay' : '💪 Struggled'}`
                        : `${item.data.cues?.filter((c: any) => c.response === 'calm').length || 0} calm, ${item.data.cues?.filter((c: any) => c.response === 'anxious').length || 0} anxious`
                      }
                      {' • '}
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Link
            href="/mission"
            className="bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold text-center transition"
          >
            New Session
          </Link>
          <Link
            href="/departure-practice"
            className="bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-xl font-semibold text-center transition"
          >
            Practice Cues
          </Link>
        </div>
      </div>
    </div>
  )
}