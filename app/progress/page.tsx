'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type Session = {
  id: string
  created_at: string
  duration: number
  target_duration: number
  stress_level: number
  success: boolean
  notes: string
}

type Dog = {
  name: string
  baseline: number
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    // Fetch dog
    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dogData) {
      setDog(dogData)
    }

    // Fetch sessions
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionData) {
      setSessions(sessionData)
    }

    setLoading(false)
  }

  const successCount = sessions.filter(s => s.success).length
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
    : 0
  const avgStress = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + s.stress_level, 0) / sessions.length).toFixed(1)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard" className="text-emerald-600 hover:underline">
            ← Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 {dog?.name}'s Progress
          </h1>
          <p className="text-gray-600">
            Started at {dog?.baseline} minutes baseline
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{sessions.length}</p>
            <p className="text-sm text-gray-500">Sessions</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{successCount}</p>
            <p className="text-sm text-gray-500">Successful</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{avgDuration}m</p>
            <p className="text-sm text-gray-500">Avg Duration</p>
          </div>
        </div>

        {/* Session History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Session History</h2>

          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No sessions logged yet</p>
              <button
                onClick={() => window.location.href = '/log-session'}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Log Your First Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border-2 border-gray-100 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {session.duration} min
                        <span className="text-gray-400 font-normal">
                          {' '}/ {session.target_duration} min target
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      session.success
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {session.success ? '✓ Success' : '✗ Needs Work'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Stress: {session.stress_level}/10</span>
                  </div>
                  {session.notes && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => window.location.href = '/log-session'}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
        >
          + Log New Session
        </button>
      </div>
    </div>
  )
}