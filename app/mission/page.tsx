'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  cuesIncorporated: string[]
  ownerMindset: string
  preparation: string[]
  steps: string[]
  ownerTips: string[]
  dogTips: string[]
  successLooksLike: string
  ifStruggles: string
  celebration: string
}

export default function MissionPage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'mission' | 'owner' | 'help'>('mission')
  const [showCheckin, setShowCheckin] = useState(true)
  const [ownerMood, setOwnerMood] = useState<string | null>(null)
  const [ownerEnergy, setOwnerEnergy] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [cuesNeeded, setCuesNeeded] = useState(0)

  useEffect(() => {
    checkReadinessAndFetchDog()
  }, [])

  const checkReadinessAndFetchDog = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!dogData) {
      setLoading(false)
      return
    }

    setDog(dogData)

    // Check cue readiness
    const { data: cuePractices } = await supabase
      .from('cue_practices')
      .select('*')
      .eq('dog_id', dogData.id)
      .order('created_at', { ascending: false })

    if (cuePractices && cuePractices.length > 0) {
      const cueHistory: Record<string, { calm: number; total: number }> = {}

      cuePractices.forEach((practice: any) => {
        practice.cues?.forEach((cue: any) => {
          if (!cueHistory[cue.cue_name]) {
            cueHistory[cue.cue_name] = { calm: 0, total: 0 }
          }
          cueHistory[cue.cue_name].total++
          if (cue.response === 'calm') {
            cueHistory[cue.cue_name].calm++
          }
        })
      })

      let masteredCount = 0
      Object.values(cueHistory).forEach(cue => {
        const calmRate = cue.calm / cue.total
        if (cue.total >= 2 && calmRate >= 0.7) {
          masteredCount++
        }
      })

      if (masteredCount < 3) {
        setNotReady(true)
        setCuesNeeded(3 - masteredCount)
      }
    } else {
      setNotReady(true)
      setCuesNeeded(3)
    }

    setLoading(false)
  }

  const startMission = async () => {
    if (!dog) return
    setShowCheckin(false)
    setGenerating(true)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })
      .limit(10)

    try {
      const response = await fetch('/api/generate-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog: dog,
          recentSessions: sessions || [],
          ownerState: { mood: ownerMood, energy: ownerEnergy }
        }),
      })
      const data = await response.json()
      if (data.error) {
        // Not ready - redirect
        setNotReady(true)
        setCuesNeeded(data.needed || 3)
        setGenerating(false)
        return
      }
      setMission(data)
    } catch (error) {
      console.error('Failed to generate mission:', error)
    }
    setGenerating(false)
  }

  const handleLogSession = () => {
    localStorage.setItem('currentMission', JSON.stringify({
      title: mission?.title,
      targetMinutes: mission?.targetMinutes,
      steps: mission?.steps,
      cuesIncorporated: mission?.cuesIncorporated,
      successLooksLike: mission?.successLooksLike,
      ownerMood: ownerMood,
      ownerEnergy: ownerEnergy
    }))
    window.location.href = '/log-session'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-amber-700 mb-4">No dog profile found</p>
          <Link href="/onboarding" className="text-amber-600 hover:underline">Add your dog</Link>
        </div>
      </div>
    )
  }

  // Not ready for absence training
  if (notReady) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <span className="text-5xl mb-4 block">🔒</span>
            <h1 className="text-2xl font-bold text-amber-950 mb-2">Not Quite Ready Yet</h1>
            <p className="text-amber-700/70 mb-6">
              {dog.name} needs to master {cuesNeeded} more departure cue{cuesNeeded > 1 ? 's' : ''} before starting absence training.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-blue-800 text-sm">
                <strong>Why?</strong> Jumping straight to leaving can make anxiety worse. 
                Practicing cues first helps {dog.name} learn that your departure routine 
                doesn't always mean you're leaving — which reduces panic.
              </p>
            </div>
            <Link
              href="/departure-practice"
              className="inline-block bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition"
            >
              Practice Departure Cues →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (showCheckin) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">💛</span>
              <h1 className="text-2xl font-bold text-amber-950 mb-2">Before We Start...</h1>
              <p className="text-amber-700/70">Let's check in with YOU first. Your energy affects {dog.name}.</p>
            </div>
            <div className="space-y-6">
              <div>
                <p className="font-semibold text-amber-900 mb-3">How are you feeling right now?</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { emoji: '😰', label: 'Anxious', value: 'anxious' },
                    { emoji: '😐', label: 'Neutral', value: 'neutral' },
                    { emoji: '😊', label: 'Good', value: 'good' },
                    { emoji: '💪', label: 'Confident', value: 'confident' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setOwnerMood(item.value)}
                      className={`flex flex-col items-center p-4 rounded-xl transition ${
                        ownerMood === item.value
                          ? 'bg-amber-100 border-2 border-amber-500'
                          : 'bg-white border-2 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-3xl mb-1">{item.emoji}</span>
                      <span className={`text-sm ${ownerMood === item.value ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-amber-900 mb-3">How much time/energy do you have?</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { emoji: '🔋', label: 'Low', value: 'low' },
                    { emoji: '⚡', label: 'Medium', value: 'medium' },
                    { emoji: '🚀', label: 'High', value: 'high' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setOwnerEnergy(item.value)}
                      className={`flex flex-col items-center p-4 rounded-xl transition ${
                        ownerEnergy === item.value
                          ? 'bg-amber-100 border-2 border-amber-500'
                          : 'bg-white border-2 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-3xl mb-1">{item.emoji}</span>
                      <span className={`text-sm ${ownerEnergy === item.value ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {ownerMood === 'anxious' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>That's okay!</strong> It's completely normal to feel anxious. {dog.name} is lucky to have someone who cares so much. We'll adjust today's session to be gentle for both of you. 💙
                  </p>
                </div>
              )}
              {ownerEnergy === 'low' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Low energy days are fine!</strong> We'll give you a shorter session. Consistency matters more than intensity. 🌱
                  </p>
                </div>
              )}
              <button
                onClick={startMission}
                disabled={!ownerMood || !ownerEnergy}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {ownerMood && ownerEnergy ? `Get ${dog.name}'s Session` : 'Select both to continue'}
              </button>
              <button
                onClick={() => { setOwnerMood('neutral'); setOwnerEnergy('medium'); startMission(); }}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
              >
                Skip check-in
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-pulse">
              <p className="text-4xl mb-4">🧠</p>
              <p className="text-xl text-amber-900 mb-2">Creating {dog.name}'s absence session...</p>
              <p className="text-amber-700/70">
                Building a session around {dog.name}'s mastered cues...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>
        {mission ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm opacity-80">🚪 Absence Session</span>
              </div>
              <h1 className="text-2xl font-bold mb-3">{mission.title}</h1>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <p className="text-xs opacity-80">Today's Goal</p>
                  <p className="text-xl font-bold">{mission.targetMinutes} min</p>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <p className="text-xs opacity-80">Progress</p>
                  <p className="text-xl font-bold">
                    {dog.baseline} → {mission.targetMinutes} min
                  </p>
                  {mission.targetMinutes > dog.baseline && (
                    <p className="text-xs opacity-80">🎉 +{mission.targetMinutes - dog.baseline} min!</p>
                  )}
                  {mission.targetMinutes === dog.baseline && (
                    <p className="text-xs opacity-80">Building consistency</p>
                  )}
                  {mission.targetMinutes < dog.baseline && (
                    <p className="text-xs opacity-80">Taking it easy today</p>
                  )}
                </div>
                {ownerMood && (
                  <div className="bg-white/20 rounded-lg px-4 py-2">
                    <p className="text-xs opacity-80">Your Mood</p>
                    <p className="text-xl font-bold">
                      {ownerMood === 'anxious' && '😰'}
                      {ownerMood === 'neutral' && '😐'}
                      {ownerMood === 'good' && '😊'}
                      {ownerMood === 'confident' && '💪'}
                    </p>
                  </div>
                )}
              </div>

              {/* Cues being used */}
              {mission.cuesIncorporated && mission.cuesIncorporated.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs opacity-80 mb-2">Using your mastered cues:</p>
                  <div className="flex flex-wrap gap-2">
                    {mission.cuesIncorporated.map((cue, i) => (
                      <span key={i} className="bg-white/30 px-3 py-1 rounded-full text-sm">
                        {cue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Owner Mindset */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💛</span>
                <div>
                  <p className="font-semibold text-amber-800 mb-2">For You (The Human)</p>
                  <p className="text-amber-900">{mission.ownerMindset}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('mission')} className={`flex-1 py-3 rounded-lg font-semibold transition ${activeTab === 'mission' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📋 Steps</button>
              <button onClick={() => setActiveTab('owner')} className={`flex-1 py-3 rounded-lg font-semibold transition ${activeTab === 'owner' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>🧘 Tips</button>
              <button onClick={() => setActiveTab('help')} className={`flex-1 py-3 rounded-lg font-semibold transition ${activeTab === 'help' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>🆘 Help</button>
            </div>

            {activeTab === 'mission' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-bold text-amber-950 mb-4">🎯 Preparation</h2>
                  <div className="space-y-3">
                    {mission.preparation?.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="bg-gray-200 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">{i + 1}</span>
                        <p className="text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-bold text-amber-950 mb-4">🚪 Session Steps</h2>
                  <div className="space-y-4">
                    {mission.steps?.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">{i + 1}</span>
                        <p className="text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                  <h2 className="font-bold text-green-800 mb-2">✨ Success Looks Like</h2>
                  <p className="text-green-900">{mission.successLooksLike}</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                  <h2 className="font-bold text-purple-800 mb-2">🎉 Celebrate Success</h2>
                  <p className="text-purple-900">{mission.celebration}</p>
                </div>
              </div>
            )}

            {activeTab === 'owner' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-bold text-amber-950 mb-4">🧘 Tips for YOU</h2>
                  <p className="text-gray-500 text-sm mb-4">Your energy directly affects {dog.name}:</p>
                  <div className="space-y-4">
                    {mission.ownerTips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                        <span className="text-xl">💙</span>
                        <p className="text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="font-bold text-amber-950 mb-4">🐕 Tips for {dog.name}</h2>
                  <div className="space-y-4">
                    {mission.dogTips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
                        <span className="text-xl">🦴</span>
                        <p className="text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-bold text-amber-950 mb-4">🆘 If {dog.name} Struggles</h2>
                <p className="text-gray-500 text-sm mb-4">It's okay! Setbacks are part of the process.</p>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-900">{mission.ifStruggles}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-600 text-sm">
                    <strong>Remember:</strong> Going backwards is not failure. It's information. Every dog has off days. You're doing great by showing up. 💚
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleLogSession}
                className="flex-1 bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                ✓ Log This Session
              </button>
              <button onClick={() => setShowCheckin(true)} className="bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-300 transition">🔄</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Failed to generate session</p>
            <button onClick={() => setShowCheckin(true)} className="mt-4 text-amber-600 hover:underline">Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}