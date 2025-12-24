'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

type Dog = {
  id: string
  name: string
  breed: string
  age: string
  baseline: number
  behavior: string
  created_at: string
}

type Session = {
  id: string
  created_at: string
  dog_response: string
}

type CuePractice = {
  id: string
  created_at: string
  cues: { cue_id: string; cue_name: string; response: string }[]
}

export default function DashboardPage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [cuePractices, setCuePractices] = useState<CuePractice[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [todayComplete, setTodayComplete] = useState(false)
  const [readinessLevel, setReadinessLevel] = useState<'not-ready' | 'almost' | 'ready'>('not-ready')
  const [cueStats, setCueStats] = useState({ total: 0, mastered: 0, stressful: 0, needed: 3 })

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
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (dogData) {
      setDog(dogData)

      const [sessionRes, cueRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('dog_id', dogData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('cue_practices')
          .select('*')
          .eq('dog_id', dogData.id)
          .order('created_at', { ascending: false })
      ])

      if (sessionRes.data) {
        setSessions(sessionRes.data)
        calculateStreak(sessionRes.data)
      }

      if (cueRes.data) {
        setCuePractices(cueRes.data)
        calculateReadiness(cueRes.data)
      }
    }

    setLoading(false)
  }

  const calculateStreak = (sessions: Session[]) => {
    if (sessions.length === 0) {
      setStreak(0)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySession = sessions.find(s => {
      const sessionDate = new Date(s.created_at)
      sessionDate.setHours(0, 0, 0, 0)
      return sessionDate.getTime() === today.getTime()
    })
    setTodayComplete(!!todaySession)

    let currentStreak = 0
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
      } else if (i === 0) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (uniqueDates[i] === yesterday.getTime()) {
          currentStreak++
        } else {
          break
        }
      } else {
        break
      }
    }

    setStreak(currentStreak)
  }

  const calculateReadiness = (practices: CuePractice[]) => {
    if (practices.length === 0) {
      setReadinessLevel('not-ready')
      setCueStats({ total: 0, mastered: 0, stressful: 0, needed: 3 })
      return
    }

    const cueHistory: Record<string, { calm: number; total: number }> = {}

    practices.forEach(practice => {
      practice.cues?.forEach(cue => {
        if (!cueHistory[cue.cue_name]) {
          cueHistory[cue.cue_name] = { calm: 0, total: 0 }
        }
        cueHistory[cue.cue_name].total++
        if (cue.response === 'calm') {
          cueHistory[cue.cue_name].calm++
        }
      })
    })

    const cueNames = Object.keys(cueHistory)
    let masteredCount = 0
    let stressfulCount = 0

    cueNames.forEach(name => {
      const cue = cueHistory[name]
      const calmRate = cue.calm / cue.total
      if (cue.total >= 2 && calmRate >= 0.7) {
        masteredCount++
      } else if (calmRate < 0.3) {
        stressfulCount++
      }
    })

    const MASTERED_THRESHOLD = 3
    const needed = Math.max(0, MASTERED_THRESHOLD - masteredCount)

    setCueStats({
      total: cueNames.length,
      mastered: masteredCount,
      stressful: stressfulCount,
      needed: needed
    })

    if (masteredCount >= MASTERED_THRESHOLD) {
      setReadinessLevel('ready')
    } else if (masteredCount >= 1 || cueNames.length >= 2) {
      setReadinessLevel('almost')
    } else {
      setReadinessLevel('not-ready')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <span className="text-5xl mb-4 block">🐕</span>
            <p className="text-amber-800 text-lg mb-2">Welcome to PawCalm!</p>
            <p className="text-amber-700/70 mb-6">Let's set up your dog's profile to get started.</p>
            <Link
              href="/onboarding"
              className="inline-block bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition"
            >
              Add Your Dog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-amber-950 mb-1">
            {dog.name}'s Training
          </h1>
          <p className="text-amber-800/70 text-sm">
            Build confidence step by step
          </p>
        </div>

        {/* Training Path */}
        <div className="space-y-4 mb-6">

          {/* Step 1: Cues */}
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-400 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-amber-950">Departure Cues</h2>
                  {cueStats.total > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      {cueStats.mastered}/{cueStats.total} mastered
                    </span>
                  )}
                </div>
                <p className="text-amber-700/70 text-sm mt-1 mb-3">
  Desensitize {dog.name} to departure triggers — so these don't cause anxiety.
</p>
                <Link
                  href="/departure-practice"
                  className="inline-block bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-700 transition"
                >
                  Practice Cues →
                </Link>
              </div>
            </div>
          </div>

          {/* Step 2: Sessions */}
          <div className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${
            readinessLevel === 'ready'
              ? 'border-green-400'
              : readinessLevel === 'almost'
              ? 'border-amber-200'
              : 'border-gray-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                readinessLevel === 'ready'
                  ? 'bg-green-500 text-white'
                  : readinessLevel === 'almost'
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className={`font-bold ${
                    readinessLevel === 'ready' ? 'text-amber-950' : 'text-gray-500'
                  }`}>
                    Absence Training
                  </h2>
                  {readinessLevel === 'ready' && sessions.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {sessions.length} sessions
                    </span>
                  )}
                </div>

                {readinessLevel === 'not-ready' && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-sm mb-2">
                      🔒 Practice departure cues first — this helps {dog.name} build confidence before any real separations.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-800 text-xs">
                        <strong>Why?</strong> Jumping straight to leaving can make anxiety worse. Cue work builds a foundation of calm.
                      </p>
                    </div>
                  </div>
                )}

                {readinessLevel === 'almost' && (
                  <div className="mt-2">
                    <p className="text-amber-700 text-sm mb-2">
                      ⏳ Almost there! Master {cueStats.needed} more cue{cueStats.needed > 1 ? 's' : ''} to unlock.
                    </p>
                    <Link
                      href="/departure-practice"
                      className="inline-block bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      Continue Cue Practice →
                    </Link>
                  </div>
                )}

                {readinessLevel === 'ready' && (
                  <div className="mt-2">
                    <p className="text-amber-700/70 text-sm mb-3">
                      ✅ {dog.name} is ready! Start with short absences and build gradually.
                    </p>
                    <Link
                      href="/mission"
                      className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition"
                    >
                      {todayComplete ? 'Do Another Session →' : 'Start Session →'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Videos */}
          <div className="bg-white rounded-2xl p-5 border-2 border-purple-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-amber-950">Video Check-ins</h2>
                <p className="text-amber-700/70 text-sm mt-1 mb-3">
                  Upload videos of {dog.name} alone to see what's really happening and track improvement.
                </p>
                <Link
                  href="/videos"
                  className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-purple-200 transition"
                >
                  Upload Video →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <Link
          href="/progress"
          className="block bg-white rounded-2xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-950">View Full Progress</h3>
              <p className="text-amber-700/70 text-sm">
                See {dog.name}'s complete training history
              </p>
            </div>
            <div className="text-amber-400 text-2xl">→</div>
          </div>
        </Link>

        {/* Streak (if they have sessions) */}
        {sessions.length > 0 && (
          <div className="mt-4 bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-amber-800">
              <span className="text-2xl font-bold">{streak}</span> day streak 🔥
              <span className="text-amber-600 text-sm ml-2">• {sessions.length} total sessions</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}