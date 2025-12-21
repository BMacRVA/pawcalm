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
}

export default function DashboardPage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDogs()
  }, [])

  const fetchDogs = async () => {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching dogs:', error)
    } else {
      setDogs(data || [])
    }
    setLoading(false)
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🐾 PawCalm Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your dogs and track their progress
          </p>
        </div>

        {/* Add Dog Button */}
        <button
          onClick={() => window.location.href = '/onboarding'}
          className="mb-8 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
        >
          + Add New Dog
        </button>

        {/* Dogs List */}
        {dogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No dogs yet!</p>
            <p className="text-gray-400">Add your first dog to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {dog.name}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {dog.breed} • {dog.age}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Baseline</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {dog.baseline} min
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">Behavior when alone:</p>
                  <p className="text-gray-700">{dog.behavior}</p>
                </div>

                <button className="w-full bg-emerald-100 text-emerald-700 py-3 rounded-lg font-semibold hover:bg-emerald-200 transition">
                  View Training Plan →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}