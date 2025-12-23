'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import Celebration from '../components/Celebration'
import FeedbackButton from '../components/FeedbackButton'
import ShareProgress from '../components/ShareProgress'
import WeeklySummary from '../components/WeeklySummary'
import { useCelebrations } from '../hooks/useCelebrations'

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

export default function DashboardPage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [todayComplete, setTodayComplete] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState({ sessions: 0, greatCount: 0 })
  const [trend, setTrend] = useState<'improving' | 'stable' | 'declining' | 'new'>('new')
  
  const dog = dogs[0]
  const { celebration, clearCelebration } = useCelebrations(dog?.id || null)

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

    if (dogData && dogData.length > 0) {
      setDogs(dogData)

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', dogData[0].id)
        .order('created_at', { ascending: false })

      if (sessionData) {
        setSessions(sessionData)
        calculateStreak(sessionData)
        calculateWeeklyStats(sessionData)
        calculateTrend(sessionData)
      }
    } else {
      setDogs([])
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

  const calculateWeeklyStats = (sessions: Session[]) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const weeklySessions = sessions.filter(s => new Date(s.created_at) >= weekAgo)
    const greatCount = weeklySessions.filter(s => s.dog_response === 'great').length

    setWeeklyStats({
      sessions: weeklySessions.length,
      greatCount
    })
  }

  const calculateTrend = (sessions: Session[]) => {
    if (sessions.length < 5) {
      setTrend('new')
      return
    }

    const recent = sessions.slice(0, 5)
    const older = sessions.slice(5, 10)

    const recentScore = recent.reduce((sum, s) => 
      sum + (s.dog_response === 'great' ? 1 : s.dog_response === 'okay' ? 0 : -1), 0) / recent.length

    if (older.length === 0) {
      setTrend('new')
      return
    }

    const olderScore = older.reduce((sum, s) => 
      sum + (s.dog_response === 'great' ? 1 : s.dog_response === 'okay' ? 0 : -1), 0) / older.length

    if (recentScore > olderScore + 0.2) setTrend('improving')
    else if (recentScore < olderScore - 0.2) setTrend('declining')
    else setTrend('stable')
  }

  const getWeekProgress = () => {
    const days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const daySession = sessions.find(s => {
        const sessionDate = new Date(s.created_at)
        sessionDate.setHours(0, 0, 0, 0)
        return sessionDate.getTime() === date.getTime()
      })

      days.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        hasSession: !!daySession,
        isToday: i === 0,
        response: daySession?.dog_response
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

  const weekProgress = getWeekProgress()
  const improvementText = trend === 'improving' ? '📈 Trending up!' : 
                          trend === 'stable' ? '➡️ Holding steady' : 
                          trend === 'declining' ? '📉 Working through a tough patch' : '🌱 Just getting started'

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Celebration Modal */}
        {celebration && dog && (
          <Celebration type={celebration} dogName={dog.name} onClose={clearCelebration} />
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-950 mb-1">
            {dog ? `Hey, ${dog.name}'s human! 👋` : '🐾 PawCalm Dashboard'}
          </h1>
          <p className="text-amber-800/70">
            {todayComplete 
              ? "Great job completing today's mission!" 
              : "Ready for today's training?"}
          </p>
        </div>

        {/* Streak & Week Progress */}
        {dog && (
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-amber-700/70">Current Streak</p>
                <p className="text-4xl font-bold text-amber-600">
                  {streak} <span className="text-2xl">🔥</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-700/70">Sessions Total</p>
                <p className="text-4xl font-bold text-amber-950">{sessions.length}</p>
              </div>
            </div>

            {/* Week dots */}
            <div className="flex justify-between">
              {weekProgress.map((day, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      day.hasSession
                        ? day.response === 'great'
                          ? 'bg-green-500 text-white'
                          : day.response === 'okay'
                          ? 'bg-amber-400 text-white'
                          : 'bg-red-400 text-white'
                        : day.isToday
                        ? 'bg-amber-100 border-2 border-amber-400 text-amber-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {day.hasSession ? '✓' : day.label}
                  </div>
                  {day.isToday && (
                    <span className="text-xs text-amber-600 mt-1">Today</span>
                  )}
                </div>
              ))}
            </div>

            {!todayComplete && (
              <div className="mt-4 pt-4 border-t border-amber-100">
                <p className="text-sm text-amber-800/70 text-center">
                  {streak > 0 
                    ? `Complete today's mission to keep your ${streak}-day streak! 🔥`
                    : "Start your streak with today's mission!"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main CTA */}
        {dog && (
          <Link
            href="/mission"
            className={`block w-full text-center py-5 rounded-2xl font-semibold text-lg transition-all mb-6 ${
              todayComplete
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-amber-600 text-white hover:bg-amber-700 hover:scale-[1.02]'
            }`}
          >
            {todayComplete ? '✓ Today Complete — Do Another?' : "Start Today's Mission →"}
          </Link>
        )}

        {/* Weekly Summary */}
        {dog && sessions.length > 0 && (
          <div className="mb-6">
            <WeeklySummary
              dogName={dog.name}
              sessions={weeklyStats.sessions}
              greatCount={weeklyStats.greatCount}
              streak={streak}
              trend={trend}
            />
          </div>
        )}

        {/* Share Progress */}
        {dog && sessions.length >= 3 && (
          <div className="mb-6">
            <ShareProgress
              dogName={dog.name}
              streak={streak}
              sessions={sessions.length}
              improvement={improvementText}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/progress"
            className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition text-center"
          >
            <span className="text-2xl mb-2 block">📊</span>
            <span className="text-amber-950 font-medium">View Progress</span>
          </Link>
          <Link
            href="/videos"
            className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition text-center"
          >
            <span className="text-2xl mb-2 block">🎥</span>
            <span className="text-amber-950 font-medium">Training Videos</span>
          </Link>
        </div>

        {/* Dog Card */}
        {dogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-amber-800 text-lg mb-2">No dogs yet!</p>
            <p className="text-amber-700/70 mb-6">Add your first dog to get started.</p>
            <Link
              href="/onboarding"
              className="inline-block bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition"
            >
              + Add Your Dog
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-amber-950 mb-1">{dog.name}</h2>
                <p className="text-amber-700/70">{dog.breed} • {dog.age}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-700/70">Baseline</p>
                <p className="text-xl font-bold text-amber-600">{dog.baseline} min</p>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-700/70 mb-1">Behavior when alone:</p>
              <p className="text-amber-900 text-sm">{dog.behavior}</p>
            </div>
          </div>
        )}

        {/* Add Another Dog */}
        {dogs.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/onboarding" className="text-amber-600 hover:underline text-sm">
              + Add another dog
            </Link>
          </div>
        )}
      </div>

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  )
}