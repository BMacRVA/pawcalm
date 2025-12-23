'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

export default function WelcomePage() {
  const [dogName, setDogName] = useState('')

  useEffect(() => {
    const fetchDog = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data } = await supabase
        .from('dogs')
        .select('name')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      if (data) setDogName(data.name)
    }
    fetchDog()
  }, [])

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">🎉</span>
          <h1 className="text-3xl font-bold text-amber-950 mb-2">
            Welcome to PawCalm{dogName ? `, ${dogName}'s human` : ''}!
          </h1>
          <p className="text-amber-800/70">
            You've taken the first step. Here's what to expect.
          </p>
        </div>

        <div className="space-y-6">
          {/* Week 1 */}
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                1️⃣
              </div>
              <div>
                <h2 className="font-bold text-amber-950 text-lg mb-1">Week 1: Foundation</h2>
                <p className="text-amber-800/70 text-sm">
                  This week is about building the habit — for you AND {dogName || 'your dog'}. 
                  Don't worry about results yet. Just show up for 5 minutes each day. 
                  Some days will feel pointless. That's normal.
                </p>
              </div>
            </div>
          </div>

          {/* Week 2 */}
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                2️⃣
              </div>
              <div>
                <h2 className="font-bold text-amber-950 text-lg mb-1">Week 2: Small Signs</h2>
                <p className="text-amber-800/70 text-sm">
                  You might notice tiny changes — {dogName || 'your dog'} looking at you differently, 
                  a slightly calmer reaction. Or you might not. Both are okay. 
                  We're rewiring anxiety patterns built over months or years.
                </p>
              </div>
            </div>
          </div>

          {/* Week 3-4 */}
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                3️⃣
              </div>
              <div>
                <h2 className="font-bold text-amber-950 text-lg mb-1">Weeks 3-4: Real Progress</h2>
                <p className="text-amber-800/70 text-sm">
                  This is when most dogs show noticeable improvement. But progress isn't linear — 
                  you'll have setbacks. A bad day doesn't erase good days. Keep going.
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <h2 className="font-bold text-amber-900 mb-3">💡 Tips for Success</h2>
            <ul className="space-y-2 text-amber-800 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span><strong>Same time daily</strong> — consistency matters more than duration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span><strong>End on success</strong> — even if you have to make it easier</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span><strong>Your calm = their calm</strong> — dogs mirror your energy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span><strong>Log honestly</strong> — bad sessions help us adjust your plan</span>
              </li>
            </ul>
          </div>

          {/* Setbacks */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h2 className="font-bold text-blue-900 mb-2">🔄 When Setbacks Happen</h2>
            <p className="text-blue-800 text-sm">
              They will. It's not failure — it's information. When {dogName || 'your dog'} has a rough day, 
              we automatically adjust tomorrow's mission. Two steps forward, one step back is still progress.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/mission"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            Start Your First Mission →
          </Link>
          <p className="text-amber-700/60 text-sm mt-4">
            You've got this. {dogName || 'Your dog'} is lucky to have you.
          </p>
        </div>
      </div>
    </div>
  )
}