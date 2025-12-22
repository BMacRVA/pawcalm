'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function TrainerDashboard() {
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isTrainer, setIsTrainer] = useState(false)

  useEffect(() => {
    checkTrainer()
  }, [])

  const checkTrainer = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: trainerData } = await supabase
      .from('trainers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!trainerData || !trainerData.approved) {
      setIsTrainer(false)
      setLoading(false)
      return
    }

    setIsTrainer(true)

    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('trainer_id', trainerData.id)

    if (dogsData) setDogs(dogsData)
    setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trainer Access Required</h1>
          <p className="text-gray-600 mb-6">This area is for approved trainers only.</p>
          <a href="/trainer/apply" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold">Apply to Become a Trainer</a>
          <p className="mt-4">
            <a href="/dashboard" className="text-emerald-600">Back to Dashboard</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Trainer Dashboard</h1>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Clients</h2>
          {dogs.length === 0 ? (
            <p className="text-gray-500">No clients assigned yet</p>
          ) : (
            <div className="space-y-4">
              {dogs.map((dog) => (
                <div key={dog.id} className="border rounded-lg p-4">
                  <p className="font-semibold">{dog.name}</p>
                  <p className="text-sm text-gray-500">{dog.breed}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}