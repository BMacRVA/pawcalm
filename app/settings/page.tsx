'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

export default function SettingsPage() {
  const [dogName, setDogName] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('name')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dog) {
      setDogName(dog.name)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <h1 className="text-3xl font-bold text-amber-950 mb-2">Settings</h1>
        <p className="text-amber-800/70 mb-8">Manage your notifications and preferences.</p>

        {/* SMS Reminders - Coming Soon */}
        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm mb-6 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <h2 className="text-xl font-bold text-amber-950">Daily SMS Reminders</h2>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">Coming Soon</span>
          </div>
          
          <p className="text-amber-800/70 text-sm mb-4">
            Get a personalized text reminder to train with {dogName || 'your dog'} every day. Stay consistent and never miss a session.
          </p>

          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>What you'll get:</strong>
            </p>
            <ul className="text-amber-700 text-sm mt-2 space-y-1">
              <li>• Daily reminder at your chosen time</li>
              <li>• Streak alerts to keep you motivated</li>
              <li>• Encouragement after tough sessions</li>
              <li>• Celebration texts for milestones</li>
            </ul>
          </div>
        </div>

        {/* Email Notifications - Coming Soon */}
        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm opacity-75">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <h2 className="text-xl font-bold text-amber-950">Weekly Progress Email</h2>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">Coming Soon</span>
          </div>
          
          <p className="text-amber-800/70 text-sm">
            Receive a weekly summary of {dogName || 'your dog'}'s progress, tips for the week ahead, and personalized insights.
          </p>
        </div>
      </div>
    </div>
  )
}