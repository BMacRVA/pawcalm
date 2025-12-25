'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Flame, 
  CheckCircle2, 
  Timer, 
  Key, 
  Footprints,
  Video,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Check,
  Plus,
  X
} from 'lucide-react'
import { supabase } from '../supabase'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { ProgressRing } from '../components/ui/ProgressRing'
import { ActionCard } from '../components/dashboard/ActionCard'
import { StatCard, StatCardRow } from '../components/dashboard/StatCard'
import { Card } from '../components/ui/Card'
import { getOwnerSupportMessage, type OwnerState, type SupportMessage } from '../lib/ownerSupport'

interface Dog {
  id: string
  name: string
  breed: string
  baseline: number
  severity: string
}

interface CueMastery {
  totalCues: number
  masteredCues: number
  calmResponses: number
}

interface SessionStats {
  totalSessions: number
  streak: number
  longestCalm: number
  lastSessionResponse: string | null
}

type TrainingState = 
  | 'new_user' 
  | 'practicing_cues' 
  | 'ready_for_absences' 
  | 'doing_absences' 
  | 'struggled_recently'
  | 'celebration'

export default function Dashboard() {
  const router = useRouter()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [dog, setDog] = useState<Dog | null>(null)
  const [cueMastery, setCueMastery] = useState<CueMastery | null>(null)
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [trainingState, setTrainingState] = useState<TrainingState>('new_user')
  const [loading, setLoading] = useState(true)
  const [showDogSelector, setShowDogSelector] = useState(false)
  const [supportMessage, setSupportMessage] = useState<SupportMessage | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUserId(user.id)

      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!dogsData || dogsData.length === 0) {
        router.push('/onboarding')
        return
      }

      setDogs(dogsData)

      const savedDogId = localStorage.getItem('selectedDogId')
      const selectedDog = dogsData.find(d => String(d.id) === savedDogId) || dogsData[0]
      
      setDog(selectedDog)
      localStorage.setItem('selectedDogId', String(selectedDog.id))

      await fetchDogData(selectedDog)
      await fetchOwnerSupport(String(selectedDog.id), user.id, selectedDog.name)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDogData(selectedDog: Dog) {
    const { data: cueData } = await supabase
      .from('custom_cues')
      .select('id, name')
      .eq('dog_id', selectedDog.id)

    const { data: practiceData } = await supabase
      .from('cue_practices')
      .select('cues')
      .eq('dog_id', selectedDog.id)

    const cueStats = calculateCueMastery(cueData || [], practiceData || [])
    setCueMastery(cueStats)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('dog_id', selectedDog.id)
      .order('created_at', { ascending: false })

    const stats = calculateSessionStats(sessions || [])
    setSessionStats(stats)

    const state = determineTrainingState(cueStats, stats)
    setTrainingState(state)
  }

  async function fetchOwnerSupport(dogId: string, oderId: string, dogName: string) {
    try {
      const res = await fetch(`/api/owner-state?dogId=${dogId}&userId=${oderId}`)
      if (res.ok) {
        const state: OwnerState = await res.json()
        const message = getOwnerSupportMessage(state, dogName)
        setSupportMessage(message)
      }
    } catch (error) {
      console.error('Error fetching owner support:', error)
    }
  }

  function selectDog(selectedDog: Dog) {
    setDog(selectedDog)
    localStorage.setItem('selectedDogId', String(selectedDog.id))
    setShowDogSelector(false)
    setLoading(true)
    setSupportMessage(null)
    
    Promise.all([
      fetchDogData(selectedDog),
      userId ? fetchOwnerSupport(String(selectedDog.id), userId, selectedDog.name) : Promise.resolve()
    ]).then(() => setLoading(false))
  }

  function calculateCueMastery(cues: any[], practices: any[]): CueMastery {
    const cueResponses: Record<string, { calm: number; total: number }> = {}

    cues.forEach(cue => {
      cueResponses[cue.id] = { calm: 0, total: 0 }
    })

    practices.forEach(practice => {
      const practicesCues = practice.cues || []
      practicesCues.forEach((cue: any) => {
        if (cueResponses[cue.cue_id]) {
          cueResponses[cue.cue_id].total++
          if (cue.response === 'calm') {
            cueResponses[cue.cue_id].calm++
          }
        }
      })
    })

    let masteredCount = 0
    let totalCalm = 0

    Object.values(cueResponses).forEach(stats => {
      totalCalm += stats.calm
      const calmRate = stats.total > 0 ? stats.calm / stats.total : 0
      if (stats.calm >= 5 && calmRate >= 0.7) {
        masteredCount++
      }
    })

    return {
      totalCues: cues.length,
      masteredCues: masteredCount,
      calmResponses: totalCalm,
    }
  }

  function calculateSessionStats(sessions: any[]): SessionStats {
    if (sessions.length === 0) {
      return { totalSessions: 0, streak: 0, longestCalm: 0, lastSessionResponse: null }
    }

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionDates = sessions.map(s => {
      const d = new Date(s.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })

    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = today.getTime() - (i * 24 * 60 * 60 * 1000)
      if (uniqueDates[i] === expectedDate) {
        streak++
      } else if (i === 0 && uniqueDates[i] === expectedDate - (24 * 60 * 60 * 1000)) {
        streak++
      } else {
        break
      }
    }

    const longestCalm = sessions
      .filter(s => s.dog_response === 'great')
      .reduce((max, s) => Math.max(max, s.duration || 0), 0)

    return {
      totalSessions: sessions.length,
      streak,
      longestCalm,
      lastSessionResponse: sessions[0]?.dog_response || null,
    }
  }

  function determineTrainingState(cues: CueMastery, stats: SessionStats): TrainingState {
    if (stats.lastSessionResponse === 'struggled') return 'struggled_recently'
    if (cues.masteredCues === 3 && stats.totalSessions < 2) return 'celebration'
    if (cues.calmResponses === 0) return 'new_user'
    if (cues.masteredCues >= 3) return stats.totalSessions > 0 ? 'doing_absences' : 'ready_for_absences'
    return 'practicing_cues'
  }

  function getActionCardConfig() {
    const configs: Record<TrainingState, {
      icon: React.ReactNode
      title: string
      description: string
      ctaText: string
      href: string
      variant: 'default' | 'celebration' | 'gentle'
      badge?: string
    }> = {
      new_user: {
        icon: <Key className="w-6 h-6" />,
        title: "Let's get started!",
        description: `First, we'll help ${dog?.name || 'your dog'} get comfortable with departure cues like keys and shoes—without you actually leaving.`,
        ctaText: "Start First Practice",
        href: '/departure-practice',
        variant: 'default',
        badge: "Step 1 of 3",
      },
      practicing_cues: {
        icon: <Key className="w-6 h-6" />,
        title: "Keep practicing cues",
        description: `${dog?.name || 'Your dog'} is making progress! Master ${3 - (cueMastery?.masteredCues || 0)} more cue${3 - (cueMastery?.masteredCues || 0) !== 1 ? 's' : ''} to unlock absence training.`,
        ctaText: "Continue Practice",
        href: '/departure-practice',
        variant: 'default',
        badge: `${cueMastery?.masteredCues || 0}/3 cues mastered`,
      },
      ready_for_absences: {
        icon: <Sparkles className="w-6 h-6" />,
        title: "You're ready! 🎉",
        description: `Amazing progress! ${dog?.name || 'Your dog'} has mastered enough cues. Time to try a short absence session.`,
        ctaText: "Start Absence Training",
        href: '/mission',
        variant: 'celebration',
        badge: "New milestone!",
      },
      doing_absences: {
        icon: <Footprints className="w-6 h-6" />,
        title: "Today's absence session",
        description: `Let's build on your progress. We'll create a personalized session based on how ${dog?.name || 'your dog'} has been doing.`,
        ctaText: "Generate Session",
        href: '/mission',
        variant: 'default',
      },
      struggled_recently: {
        icon: <Footprints className="w-6 h-6" />,
        title: "Let's take it easy today",
        description: `Yesterday was tough, and that's okay. We'll try something shorter and simpler to rebuild ${dog?.name || 'your dog'}'s confidence.`,
        ctaText: "Try Easier Session",
        href: '/mission',
        variant: 'gentle',
        badge: "Adjusted for you",
      },
      celebration: {
        icon: <Sparkles className="w-6 h-6" />,
        title: "Milestone unlocked! 🎉",
        description: `${dog?.name || 'Your dog'} mastered 3 cues! You're now ready to start actual absence training. This is huge progress!`,
        ctaText: "Start Absence Training",
        href: '/mission',
        variant: 'celebration',
        badge: "Celebration!",
      },
    }
    return configs[trainingState]
  }

  function calculateOverallProgress(): number {
    if (!cueMastery || !sessionStats) return 0
    const cueMasteryProgress = Math.min((cueMastery.masteredCues / 3) * 33, 33)
    if (cueMastery.masteredCues < 3) return cueMasteryProgress
    const absenceProgress = Math.min((sessionStats.longestCalm / 30) * 67, 67)
    return 33 + absenceProgress
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-200" />
          <div className="h-4 w-24 bg-amber-200 rounded" />
        </div>
      </div>
    )
  }

  const actionConfig = getActionCardConfig()
  const overallProgress = calculateOverallProgress()

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            
            {dogs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowDogSelector(!showDogSelector)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition"
                >
                  <span className="text-base">🐕</span>
                  <span className="font-medium text-gray-900 text-sm">{dog?.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition ${showDogSelector ? 'rotate-180' : ''}`} />
                </button>

                {showDogSelector && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDogSelector(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">Your Dogs</p>
                        {dogs.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => selectDog(d)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                              dog?.id === d.id ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className="text-xl">🐕</span>
                            <div className="flex-1 text-left">
                              <p className="font-medium">{d.name}</p>
                              <p className="text-xs text-gray-500">{d.breed}</p>
                            </div>
                            {dog?.id === d.id && <Check className="w-4 h-4 text-amber-600" />}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={() => { setShowDogSelector(false); router.push('/onboarding') }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="font-medium">Add Another Dog</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Hi, {dog?.name}&apos;s human! 👋
          </h1>
        </div>
      </header>

      <main className="px-4 pb-4">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Owner Support Message */}
          {supportMessage && (
            <Card 
              variant="elevated" 
              padding="md" 
              className={
                supportMessage.type === 'celebration' ? 'bg-green-50 border-green-200' :
                supportMessage.type === 'tough_day' ? 'bg-blue-50 border-blue-200' :
                supportMessage.type === 'welcome_back' ? 'bg-amber-50 border-amber-200' :
                supportMessage.type === 'encouragement' ? 'bg-purple-50 border-purple-200' :
                'bg-gray-50'
              }
            >
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{supportMessage.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${
                    supportMessage.type === 'celebration' ? 'text-green-800' :
                    supportMessage.type === 'tough_day' ? 'text-blue-800' :
                    supportMessage.type === 'welcome_back' ? 'text-amber-800' :
                    supportMessage.type === 'encouragement' ? 'text-purple-800' :
                    'text-gray-800'
                  }`}>
                    {supportMessage.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    supportMessage.type === 'celebration' ? 'text-green-700' :
                    supportMessage.type === 'tough_day' ? 'text-blue-700' :
                    supportMessage.type === 'welcome_back' ? 'text-amber-700' :
                    supportMessage.type === 'encouragement' ? 'text-purple-700' :
                    'text-gray-700'
                  }`}>
                    {supportMessage.message}
                  </p>
                  {supportMessage.action && (
                    <button
                      onClick={() => router.push(supportMessage.action!.href)}
                      className={`mt-2 text-sm font-semibold ${
                        supportMessage.type === 'celebration' ? 'text-green-600' :
                        supportMessage.type === 'tough_day' ? 'text-blue-600' :
                        supportMessage.type === 'welcome_back' ? 'text-amber-600' :
                        'text-purple-600'
                      }`}
                    >
                      {supportMessage.action.label} →
                    </button>
                  )}
                </div>
                <button onClick={() => setSupportMessage(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          )}

          {/* Progress Ring */}
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0">
              <ProgressRing progress={overallProgress} size={100} strokeWidth={8} color="primary" label="Journey" />
            </div>
            <div className="flex-1 pt-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                {trainingState === 'new_user' && <>You&apos;re at the beginning of your journey. Let&apos;s help {dog?.name} feel calm when you leave.</>}
                {trainingState === 'practicing_cues' && <>Great progress on departure cues! Keep building {dog?.name}&apos;s confidence.</>}
                {trainingState === 'ready_for_absences' && <>You&apos;ve done the prep work! {dog?.name} is ready for the real thing.</>}
                {trainingState === 'doing_absences' && <>You&apos;re in absence training now. Consistency is key!</>}
                {trainingState === 'struggled_recently' && <>Setbacks are normal. Today we&apos;ll rebuild confidence together.</>}
                {trainingState === 'celebration' && <>What an achievement! You&apos;ve unlocked the next phase.</>}
              </p>
            </div>
          </div>

          {/* Primary Action */}
          <ActionCard
            icon={actionConfig.icon}
            title={actionConfig.title}
            description={actionConfig.description}
            ctaText={actionConfig.ctaText}
            onAction={() => router.push(actionConfig.href)}
            variant={actionConfig.variant}
            badge={actionConfig.badge}
          />

          {/* Stats */}
          <StatCardRow>
            <StatCard icon={<Flame className="w-4 h-4" />} label="Streak" value={`${sessionStats?.streak || 0} day${sessionStats?.streak !== 1 ? 's' : ''}`} color={sessionStats?.streak && sessionStats.streak >= 3 ? 'success' : 'default'} />
            <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Cues" value={`${cueMastery?.masteredCues || 0}/${Math.max(cueMastery?.totalCues || 0, 3)}`} color={cueMastery?.masteredCues && cueMastery.masteredCues >= 3 ? 'success' : 'default'} />
            <StatCard icon={<Timer className="w-4 h-4" />} label="Best" value={sessionStats?.longestCalm ? `${sessionStats.longestCalm}m` : '—'} color="default" />
          </StatCardRow>

          {/* Secondary Actions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">More options</h2>
            
            <Card variant="outlined" padding="md" pressable onClick={() => router.push('/departure-practice')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Practice a specific cue</h3>
                  <p className="text-sm text-gray-500">Reinforce what {dog?.name} has learned</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>

            <Card variant="outlined" padding="md" pressable onClick={() => router.push('/videos')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Upload a video</h3>
                  <p className="text-sm text-gray-500">Get AI analysis of {dog?.name}&apos;s behavior</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}