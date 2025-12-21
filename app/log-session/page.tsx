'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type Dog = {
  id: string
  name: string
  baseline: number
}

export default function LogSessionPage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [duration, setDuration] = useState('')
  const [targetDuration, setTargetDuration] = useState('')
  const [stressLevel, setStressLevel] = useState('5')
  const [success, setSuccess] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchDog()
  }, [])

  const fetchDog = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (data) {
      setDog(data)
      setTargetDuration(String(Math.round(data.baseline * 1.1)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('sessions')
      .insert([
        {
          user_id: user?.id,
          dog_id: dog?.id,
          duration: parseInt(duration),
          target_duration: parseInt(targetDuration),
          stress_level: parseInt(stressLevel),
          success: success,
          notes: notes,
        }
      ])

    setLoading(false)

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      setSaved(true)
    }
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session Logged!
          </h1>
          <p className="text-gray-600 mb-6">
            Great work training with {dog?.name} today!
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/progress'}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              View Progress
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <a href="/mission" className="text-emerald-600 hover:underline">
            ← Back to Mission
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Log Session
          </h1>
          <p className="text-gray-600 mb-8">
            How did {dog?.name}'s training go?
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Duration (minutes)
              </label>
              <input
                type="number"
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Actual Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="How long did you practice?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stress Level (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>1 - Calm</span>
                <span className="font-semibold text-emerald-600">{stressLevel}</span>
                <span>10 - Very Stressed</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Was it successful?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSuccess(true)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    success
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  ✓ Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    !success
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  ✗ No
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations or notes..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}