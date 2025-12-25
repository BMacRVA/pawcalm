'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Trophy, Lock, ChevronRight, Target } from 'lucide-react'
import { 
  checkMilestones, 
  getMilestonesByCategory, 
  getNextMilestones,
  calculateMilestoneProgress,
  type Milestone,
  type MilestoneProgress 
} from '../lib/milestones'

type CueWithStats = {
  id: string
  name: string
  calmCount: number
  totalCount: number
  mastered: boolean
}

export default function ProgressPage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [cues, setCues] = useState<CueWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>([])
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([])
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgress | null>(null)
  const [activeTab, setActiveTab] = useState<'cues' | 'milestones'>('cues')
  const [showMilestoneAlert, setShowMilestoneAlert] = useState(false)

  const loadProgress = useCallback(async () => {
    if (!dog) return

    // Load cues and practices
    const { data: customCues } = await supabase
      .from('custom_cues')
      .select('id, name')
      .eq('dog_id', dog.id)

    const { data: practices } = await supabase
      .from('cue_practices')
      .select('cues, created_at')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: true })

    // Calculate cue stats
    const cueStats: Record<string, { calm: number; total: number }> = {}
    customCues?.forEach(cue => {
      cueStats[cue.id] = { calm: 0, total: 0 }
    })

    let totalPractices = 0
    let calmResponses = 0

    practices?.forEach(practice => {
      practice.cues?.forEach((c: any) => {
        totalPractices++
        if (cueStats[c.cue_id]) {
          cueStats[c.cue_id].total++
          if (c.response === 'calm') {
            cueStats[c.cue_id].calm++
            calmResponses++
          }
        }
      })
    })

    const cuesWithStats: CueWithStats[] = customCues?.map(cue => {
      const stats = cueStats[cue.id]
      const calmRate = stats.total > 0 ? stats.calm / stats.total : 0
      return {
        id: cue.id,
        name: cue.name,
        calmCount: stats.calm,
        totalCount: stats.total,
        mastered: stats.calm >= 5 && calmRate >= 0.7,
      }
    }) || []

    setCues(cuesWithStats)

    // Load sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })

    // Load journal entries count
    const { count: journalCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('dog_id', dog.id)

    // Calculate streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const practiceDates = new Set(
      practices?.map(p => new Date(p.created_at).toISOString().split('T')[0]) || []
    )
    
    const todayStr = today.toISOString().split('T')[0]
    const practicedToday = practiceDates.has(todayStr)
    const startOffset = practicedToday ? 0 : 1
    
    for (let i = startOffset; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      if (practiceDates.has(checkDate)) {
        streak++
      } else {
        break
      }
    }

    // Calculate days active
    const firstPractice = practices?.[0]?.created_at
    const daysActive = firstPractice
      ? Math.floor((Date.now() - new Date(firstPractice).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0

    // Longest absence
    const longestAbsence = sessions
      ?.filter(s => s.dog_response === 'great')
      .reduce((max, s) => Math.max(max, s.duration || 0), 0) || 0

    const progress: MilestoneProgress = {
      totalPractices,
      totalCues: customCues?.length || 0,
      cuesMastered: cuesWithStats.filter(c => c.mastered).length,
      totalSessions: sessions?.length || 0,
      longestAbsence,
      currentStreak: streak,
      longestStreak: streak,
      daysActive,
      calmResponses,
      firstPracticeDate: firstPractice || null,
      journalEntries: journalCount || 0,
    }

    setMilestoneProgress(progress)

    // Load existing milestones
    const { data: existingMilestones } = await supabase
      .from('milestones')
      .select('milestone_id')
      .eq('dog_id', dog.id)

    const existingIds = existingMilestones?.map(m => m.milestone_id) || []
    setUnlockedMilestones(existingIds)

    // Check for new milestones
    const newlyUnlocked = checkMilestones(progress, existingIds)
    
    if (newlyUnlocked.length > 0) {
      // Save new milestones
      const toInsert = newlyUnlocked.map(m => ({
        dog_id: dog.id,
        milestone_id: m.id,
      }))
      
      await supabase.from('milestones').insert(toInsert)
      
      setNewMilestones(newlyUnlocked)
      setUnlockedMilestones([...existingIds, ...newlyUnlocked.map(m => m.id)])
      setShowMilestoneAlert(true)
    }

    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      loadProgress()
    }
  }, [dog, loadProgress])

  const startPractice = (cueId: string) => {
    localStorage.setItem('practiceSpecificCue', cueId)
    router.push('/departure-practice')
  }

  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-200" />
          <div className="h-4 w-24 bg-amber-200 rounded" />
        </div>
      </div>
    )
  }

  const milestonesByCategory = getMilestonesByCategory(unlockedMilestones)
  const nextMilestones = milestoneProgress ? getNextMilestones(milestoneProgress, unlockedMilestones) : []

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader 
        title="Progress" 
        subtitle={`${dog?.name}'s journey`}
      />

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">

          {/* New Milestone Alert */}
          {showMilestoneAlert && newMilestones.length > 0 && (
            <Card variant="elevated" padding="lg" className="bg-yellow-50 border-yellow-300">
              <div className="text-center">
                <span className="text-5xl mb-3 block">{newMilestones[0].emoji}</span>
                <h2 className="text-xl font-bold text-yellow-900 mb-1">
                  Milestone Unlocked!
                </h2>
                <p className="text-yellow-800 font-medium">{newMilestones[0].title}</p>
                <p className="text-yellow-700 text-sm mt-1">{newMilestones[0].description}</p>
                <button
                  onClick={() => setShowMilestoneAlert(false)}
                  className="mt-4 text-yellow-600 font-medium text-sm"
                >
                  Awesome! →
                </button>
              </div>
            </Card>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('cues')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'cues'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Cues
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'milestones'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Milestones
            </button>
          </div>

          {/* Cues Tab */}
          {activeTab === 'cues' && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card variant="filled" padding="sm" className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {milestoneProgress?.cuesMastered || 0}
                  </p>
                  <p className="text-xs text-gray-600">Mastered</p>
                </Card>
                <Card variant="filled" padding="sm" className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {milestoneProgress?.totalPractices || 0}
                  </p>
                  <p className="text-xs text-gray-600">Practices</p>
                </Card>
                <Card variant="filled" padding="sm" className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {milestoneProgress?.calmResponses || 0}
                  </p>
                  <p className="text-xs text-gray-600">Calm</p>
                </Card>
              </div>

              {/* Cue List */}
              {cues.length === 0 ? (
                <Card variant="elevated" padding="lg" className="text-center">
                  <span className="text-4xl mb-3 block">🔑</span>
                  <p className="text-gray-600 mb-4">No cues yet. Start practicing!</p>
                  <button
                    onClick={() => router.push('/departure-practice')}
                    className="text-amber-600 font-medium"
                  >
                    Go to Practice →
                  </button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {cues.map(cue => {
                    const calmRate = cue.totalCount > 0 
                      ? Math.round((cue.calmCount / cue.totalCount) * 100) 
                      : 0

                    return (
                      <Card 
                        key={cue.id} 
                        variant="elevated" 
                        padding="md"
                        pressable
                        onClick={() => startPractice(cue.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            cue.mastered ? 'bg-green-100' : 'bg-amber-100'
                          }`}>
                            {cue.mastered ? (
                              <Trophy className="w-6 h-6 text-green-600" />
                            ) : (
                              <Target className="w-6 h-6 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{cue.name}</h3>
                              {cue.mastered && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Mastered
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    cue.mastered ? 'bg-green-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (cue.calmCount / 5) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {cue.calmCount}/5 calm
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {cue.totalCount} practices • {calmRate}% calm rate
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <>
              {/* Next Milestones */}
              {nextMilestones.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Up Next
                  </h2>
                  <div className="space-y-2">
                    {nextMilestones.map(milestone => {
                      const progress = milestoneProgress 
                        ? calculateMilestoneProgress(milestone.id, milestoneProgress)
                        : null

                      return (
                        <Card key={milestone.id} variant="outlined" padding="md">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl opacity-50">{milestone.emoji}</span>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-700">{milestone.title}</h3>
                              {progress && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-amber-500 rounded-full"
                                      style={{ width: `${progress.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {progress.current}/{progress.target}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Milestone Categories */}
              {Object.entries(milestonesByCategory).map(([category, milestones]) => {
                const unlockedCount = milestones.filter(m => m.unlockedAt).length
                if (milestones.length === 0) return null

                return (
                  <div key={category}>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center justify-between">
                      <span>
                        {category === 'engagement' && '🎯 Engagement'}
                        {category === 'cues' && '🔑 Cue Mastery'}
                        {category === 'sessions' && '🚪 Absence Training'}
                        {category === 'consistency' && '🔥 Consistency'}
                        {category === 'breakthrough' && '⭐ Breakthroughs'}
                      </span>
                      <span className="text-xs font-normal text-gray-400">
                        {unlockedCount}/{milestones.length}
                      </span>
                    </h2>
                    <div className="grid grid-cols-4 gap-2">
                      {milestones.map(milestone => (
                        <div
                          key={milestone.id}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
                            milestone.unlockedAt
                              ? 'bg-amber-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          {milestone.unlockedAt ? (
                            <span className="text-2xl">{milestone.emoji}</span>
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                          <p className={`text-[10px] text-center mt-1 leading-tight ${
                            milestone.unlockedAt ? 'text-amber-800' : 'text-gray-400'
                          }`}>
                            {milestone.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Total Progress */}
              <Card variant="filled" padding="md" className="text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {unlockedMilestones.length}
                </p>
                <p className="text-sm text-gray-600">
                  milestones unlocked
                </p>
              </Card>
            </>
          )}

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}