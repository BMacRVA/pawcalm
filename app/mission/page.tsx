'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type Dog = {
  id: string
  name: string
  breed: string
  age: string
  baseline: number
  behavior: string
}

type Mission = {
  title: string
  targetMinutes: number
  steps: string[]
  tips: string[]
  warningSign: string
}

export default function MissionPage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchDog()
  }, [])

  const fetchDog = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (error || !data) {
      window.location.href = '/onboarding'
      return
    }

    setDog(data)
    setLoading(false)
  }

  const generateMission = async () => {
    if (!dog) return
    
    setGenerating(true)

    try {
      const response = await fetch('/api/generate-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dog }),
      })

      const data = await response.json()
      setMission(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate mission')
    }

    setGenerating(false)
  }

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
        <div className="mb-8">
          <a href="/dashboard" className="text-emerald-600 hover:underline">
            ← Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Today's Mission for {dog?.name}
          </h1>
          <p className="text-gray-600">
            Current baseline: {dog?.baseline} minutes alone
          </p>
        </div>

        {!mission ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-6">
              Ready to generate today's personalized training mission?
            </p>
            <button
              onClick={generateMission}
              disabled={generating}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:bg-gray-400"
            >
              {generating ? 'Generating...' : '✨ Generate Mission'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mission.title}
              </h2>
              <p className="text-emerald-600 font-semibold text-lg mb-6">
                Target: {mission.targetMinutes} minutes
              </p>

              <h3 className="font-semibold text-gray-900 mb-3">Steps:</h3>
              <ol className="space-y-3 mb-6">
                {mission.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>

              <h3 className="font-semibold text-gray-900 mb-3">Tips:</h3>
              <ul className="space-y-2 mb-6">
                {mission.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2 text-gray-600">
                    <span>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">
                  <span className="font-semibold">⚠️ Warning Sign:</span>{' '}
                  {mission.warningSign}
                </p>
              </div>
            </div>
<button
              onClick={() => window.location.href = '/log-session'}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition mb-3"
            >
              ✓ Log This Session
            </button>
            <button
              onClick={generateMission}
              disabled={generating}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              {generating ? 'Generating...' : '🔄 Generate New Mission'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}