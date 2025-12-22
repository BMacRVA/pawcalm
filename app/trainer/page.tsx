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
  created_at: string
  user_id: string
}

type Session = {
  id: string
  created_at: string
  duration: number
  target_duration: number
  stress_level: number
  success: boolean
  notes: string
  dog_id: string
}

export default function TrainerDashboard() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTrainer, setIsTrainer] = useState(false)

  useEffect(() => {
    checkTrainerAndFetch()
  }, [])

  const checkTrainerAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    // Check if user is a trainer
    const { data: trainerData } = await supabase
      .from('trainers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!trainerData) {
      setIsTrainer(false)
      setLoading(false)
      return
    }

    setIsTrainer(true)

    // Fetch all dogs assigned to this trainer
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('trainer_id', trainerData.id)
      .order('created_at', { ascending: false })

    if (dogsData) {
      setDogs(dogsData)
    }

    setLoading(false)
  }

  const fetchSessions = async (dogId: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })

    if (data) {
      setSessions(data)
    }
  }

  const selectDog = (dog: Dog) => {
    setSelectedDog(dog)
    fetchSessions(dog.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isTrainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Trainer Access Required
          </h1>
          <p className="text-gray-600 mb-6">
            This area is for approved trainers only.
          </p>
          
            href="/trainer/apply"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Apply to Become a Trainer
          </a>
          <p className="mt-4">
            <a href="/dashboard" className="text-emerald-600 hover:underline">
              ← Back to Dashboard
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🎓 Trainer Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your clients and track their progress
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Your Clients ({dogs.length})
              </h2>

              {dogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No clients assigned yet
                </p>
              ) : (
                <div className="space-y-3">
                  {dogs.map((dog) => (
                    <button
                      key={dog.id}
                      onClick={() => selectDog(dog)}
                      className={`w-full text-left p-4 rounded-lg transition ${
                        selectedDog?.id === dog.id
                          ? 'bg-emerald-100 border-2 border-emerald-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{dog.name}</p>
                      <p className="text-sm text-gray-500">
                        {dog.breed} • {dog.baseline} min baseline
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {selectedDog ? (
              <div className="space-y-6">
                {/* Dog Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedDog.name}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Breed</p>
                      <p className="font-semibold">{selectedDog.breed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-semibold">{selectedDog.age}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Baseline</p>
                      <p className="font-semibold">{selectedDog.baseline} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sessions</p>
                      <p className="font-semibold">{sessions.length}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Behavior Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedDog.behavior}
                    </p>
                  </div>
                </div>

                {/* Session History */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Session History
                  </h3>

                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No sessions logged yet
                    </p>
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
                          <p className="text-sm text-gray-500">
                            Stress Level: {session.stress_level}/10
                          </p>
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
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-500">
                  Select a client to view their details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}