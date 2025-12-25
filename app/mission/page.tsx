'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Lock, Target, RefreshCw, CheckCircle, TrendingUp, Heart } from 'lucide-react'

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
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'mission' | 'owner' | 'help'>('mission')
  const [showCheckin, setShowCheckin] = useState(true)
  const [ownerMood, setOwnerMood] = useState<string | null>(null)
  const [ownerEnergy, setOwnerEnergy] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [cuesNeeded, setCuesNeeded] = useState(0)

  const checkReadiness = useCallback(async () => {
    if (!dog) return

    let masteredCount = 0

    const { data: cuePractices } = await supabase
      .from('cue_practices')
      .select('*')
      .eq('dog_id', dog.id)
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

      Object.values(cueHistory).forEach(cue => {
        const calmRate = cue.total > 0 ? cue.calm / cue.total : 0
        if (cue.calm >= 5 && calmRate >= 0.7) {
          masteredCount++
        }
      })
    }

    if (masteredCount < 3) {
      setNotReady(true)
      setCuesNeeded(3 - masteredCount)
    }

    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      checkReadiness()
    }
  }, [dog, checkReadiness])

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
    router.push('/log-session')
  }

  const isLoading = dogLoading || loading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-200" />
          <div className="h-4 w-24 bg-green-200 rounded" />
        </div>
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Session" showBack backHref="/dashboard" />
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-5xl mb-4 block">🐕</span>
              <h2 className="text-lg font-bold text-gray-900 mb-2">No Dog Profile Found</h2>
              <p className="text-gray-600 mb-6">Let&apos;s set up your dog&apos;s profile first.</p>
              <Button onClick={() => router.push('/onboarding')} fullWidth>
                Add Your Dog
              </Button>
            </Card>
          </div>
        </main>
        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Not ready for absence training
  if (notReady) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Absence Session" showBack backHref="/dashboard" />
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Card variant="elevated" padding="lg" className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Not Quite Ready Yet</h1>
              <p className="text-gray-600 mb-6">
                {dog.name} needs to master {cuesNeeded} more departure cue{cuesNeeded > 1 ? 's' : ''} before starting absence training.
              </p>
              
              <Card variant="filled" padding="md" className="text-left mb-6 bg-blue-50">
                <p className="text-blue-800 text-sm">
                  <strong>Why?</strong> Jumping straight to leaving can make anxiety worse. 
                  Practicing cues first helps {dog.name} learn that your departure routine 
                  doesn&apos;t always mean you&apos;re leaving — which reduces panic.
                </p>
              </Card>
              
              <Button onClick={() => router.push('/departure-practice')} fullWidth>
                Practice Departure Cues →
              </Button>
            </Card>
          </div>
        </main>
        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Owner check-in
  if (showCheckin) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Pre-Session Check-in" showBack backHref="/dashboard" />
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Card variant="elevated" padding="lg">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">💛</span>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Before We Start...</h1>
                <p className="text-gray-600">Let&apos;s check in with YOU first. Your energy affects {dog.name}.</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-3">How are you feeling right now?</p>
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
                        className={`flex flex-col items-center p-3 rounded-xl transition ${
                          ownerMood === item.value
                            ? 'bg-amber-100 border-2 border-amber-500'
                            : 'bg-white border-2 border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-2xl mb-1">{item.emoji}</span>
                        <span className={`text-xs ${ownerMood === item.value ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-900 mb-3">How much time/energy do you have?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { emoji: '🔋', label: 'Low', value: 'low' },
                      { emoji: '⚡', label: 'Medium', value: 'medium' },
                      { emoji: '🚀', label: 'High', value: 'high' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setOwnerEnergy(item.value)}
                        className={`flex flex-col items-center p-3 rounded-xl transition ${
                          ownerEnergy === item.value
                            ? 'bg-amber-100 border-2 border-amber-500'
                            : 'bg-white border-2 border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-2xl mb-1">{item.emoji}</span>
                        <span className={`text-xs ${ownerEnergy === item.value ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {ownerMood === 'anxious' && (
                  <Card variant="filled" padding="md" className="bg-blue-50">
                    <p className="text-blue-800 text-sm">
                      <strong>That&apos;s okay!</strong> It&apos;s completely normal to feel anxious. {dog.name} is lucky to have someone who cares so much. We&apos;ll adjust today&apos;s session to be gentle for both of you. 💙
                    </p>
                  </Card>
                )}

                {ownerEnergy === 'low' && (
                  <Card variant="filled" padding="md" className="bg-amber-50">
                    <p className="text-amber-800 text-sm">
                      <strong>Low energy days are fine!</strong> We&apos;ll give you a shorter session. Consistency matters more than intensity. 🌱
                    </p>
                  </Card>
                )}

                <Button
                  onClick={startMission}
                  disabled={!ownerMood || !ownerEnergy}
                  fullWidth
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {ownerMood && ownerEnergy ? `Get ${dog.name}'s Session` : 'Select both to continue'}
                </Button>
                
                <button
                  onClick={() => { setOwnerMood('neutral'); setOwnerEnergy('medium'); startMission(); }}
                  className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
                >
                  Skip check-in
                </button>
              </div>
            </Card>
          </div>
        </main>
        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Generating mission
  if (generating) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Creating Session" />
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Card variant="elevated" padding="lg" className="text-center">
              <div className="animate-pulse">
                <span className="text-5xl mb-4 block">🧠</span>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Creating {dog.name}&apos;s Session...</h2>
                <p className="text-gray-600">
                  Building a session around {dog.name}&apos;s mastered cues...
                </p>
              </div>
            </Card>
          </div>
        </main>
        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Mission display
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title="Today's Session" showBack backHref="/dashboard" />
      
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          {mission ? (
            <>
              {/* Header Card */}
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-5 text-white">
                <p className="text-sm opacity-80 mb-1">🚪 Absence Session</p>
                <h1 className="text-xl font-bold mb-4">{mission.title}</h1>
                
                <div className="flex gap-3 flex-wrap">
                  <div className="bg-white/20 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                      <Target className="w-3 h-3" />
                      <span>Goal</span>
                    </div>
                    <p className="text-lg font-bold">{mission.targetMinutes} min</p>
                  </div>
                  <div className="bg-white/20 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Progress</span>
                    </div>
                    <p className="text-lg font-bold">{dog.baseline} → {mission.targetMinutes}</p>
                  </div>
                  {ownerMood && (
                    <div className="bg-white/20 rounded-xl px-4 py-2">
                      <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                        <Heart className="w-3 h-3" />
                        <span>Mood</span>
                      </div>
                      <p className="text-lg font-bold">
                        {ownerMood === 'anxious' && '😰'}
                        {ownerMood === 'neutral' && '😐'}
                        {ownerMood === 'good' && '😊'}
                        {ownerMood === 'confident' && '💪'}
                      </p>
                    </div>
                  )}
                </div>

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
              <Card variant="elevated" padding="md" className="bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💛</span>
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">For You (The Human)</p>
                    <p className="text-amber-900 text-sm">{mission.ownerMindset}</p>
                  </div>
                </div>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {[
                  { id: 'mission', label: '📋 Steps' },
                  { id: 'owner', label: '🧘 Tips' },
                  { id: 'help', label: '🆘 Help' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'mission' | 'owner' | 'help')}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'mission' && (
                <div className="space-y-4">
                  <Card variant="elevated" padding="md">
                    <h2 className="font-bold text-gray-900 mb-3">🎯 Preparation</h2>
                    <div className="space-y-3">
                      {mission.preparation?.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="bg-gray-200 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-gray-700 text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card variant="elevated" padding="md">
                    <h2 className="font-bold text-gray-900 mb-3">🚪 Session Steps</h2>
                    <div className="space-y-3">
                      {mission.steps?.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-gray-700 text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card variant="elevated" padding="md" className="bg-green-50 border-green-200">
                    <h2 className="font-bold text-green-800 mb-2">✨ Success Looks Like</h2>
                    <p className="text-green-900 text-sm">{mission.successLooksLike}</p>
                  </Card>

                  <Card variant="elevated" padding="md" className="bg-purple-50 border-purple-200">
                    <h2 className="font-bold text-purple-800 mb-2">🎉 Celebrate Success</h2>
                    <p className="text-purple-900 text-sm">{mission.celebration}</p>
                  </Card>
                </div>
              )}

              {activeTab === 'owner' && (
                <div className="space-y-4">
                  <Card variant="elevated" padding="md">
                    <h2 className="font-bold text-gray-900 mb-3">🧘 Tips for YOU</h2>
                    <p className="text-gray-500 text-xs mb-3">Your energy directly affects {dog.name}:</p>
                    <div className="space-y-3">
                      {mission.ownerTips?.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl">
                          <span className="text-lg">💙</span>
                          <p className="text-gray-700 text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card variant="elevated" padding="md">
                    <h2 className="font-bold text-gray-900 mb-3">🐕 Tips for {dog.name}</h2>
                    <div className="space-y-3">
                      {mission.dogTips?.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                          <span className="text-lg">🦴</span>
                          <p className="text-gray-700 text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'help' && (
                <Card variant="elevated" padding="md">
                  <h2 className="font-bold text-gray-900 mb-3">🆘 If {dog.name} Struggles</h2>
                  <p className="text-gray-500 text-xs mb-3">It&apos;s okay! Setbacks are part of the process.</p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-900 text-sm">{mission.ifStruggles}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm">
                      <strong>Remember:</strong> Going backwards is not failure. It&apos;s information. Every dog has off days. You&apos;re doing great by showing up. 💚
                    </p>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleLogSession}
                  fullWidth
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  Log This Session
                </Button>
                <Button
                  onClick={() => setShowCheckin(true)}
                  variant="secondary"
                  size="lg"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-5xl mb-4 block">😕</span>
              <p className="text-gray-600 mb-4">Failed to generate session</p>
              <Button onClick={() => setShowCheckin(true)} variant="secondary">
                Try again
              </Button>
            </Card>
          )}
        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}