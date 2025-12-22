'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AdminPage() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [dogs, setDogs] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const ADMIN_EMAIL = 'bmacgolf@yahoo.com'

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (user.email !== ADMIN_EMAIL) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setIsAdmin(true)

    const { data: trainerData } = await supabase.from('trainers').select('*')
    if (trainerData) setTrainers(trainerData)

    const { data: dogData } = await supabase.from('dogs').select('*')
    if (dogData) setDogs(dogData)

    const { data: sessionData } = await supabase.from('sessions').select('*')
    if (sessionData) setSessions(sessionData)

    setLoading(false)
  }

  const approveTrainer = async (trainerId: string) => {
    await supabase.from('trainers').update({ approved: true }).eq('id', trainerId)
    checkAdminAndFetch()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
          <a href="/dashboard" className="text-emerald-600 hover:underline">Back to Dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{dogs.length}</p>
            <p className="text-sm text-gray-500">Dogs</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{sessions.length}</p>
            <p className="text-sm text-gray-500">Sessions</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{trainers.length}</p>
            <p className="text-sm text-gray-500">Trainers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trainer Applications</h2>
          {trainers.length === 0 ? (
            <p className="text-gray-500">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {trainers.map((trainer) => (
                <div key={trainer.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{trainer.name}</p>
                    <p className="text-sm text-gray-500">{trainer.email}</p>
                  </div>
                  {trainer.approved ? (
                    <span className="text-emerald-600 font-semibold">Approved</span>
                  ) : (
                    <button
                      onClick={() => approveTrainer(trainer.id)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Dogs</h2>
          {dogs.length === 0 ? (
            <p className="text-gray-500">No dogs yet</p>
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