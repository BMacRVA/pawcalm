'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import JourneyTimeline from '../components/JourneyTimeline'
import YourImpactCard from '../components/YourImpactCard'
import { Loader2, Plus, Lock, Play } from 'lucide-react'

type CueProgress = {
  id: string
  name: string
  icon?: string
  calmCount: number
  totalCount: number
}

export default function ProgressPage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  const [cues, setCues] = useState<CueProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [thisWeekCount, setThisWeekCount] = useState(0)
  const [thisWeekCalmRate, setThisWeekCalmRate] = useState(0)
  const [showAddCue, setShowAddCue] = useState(false)
  const [newCueName, setNewCueName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const loadProgress = async () => {
      if (!dog) return

      const { data: cuesData } = await supabase
        .from('custom_cues')
        .select('id, name, icon, calm_count, total_practices')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: true })

      if (cuesData) {
        setCues(cuesData.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          calmCount: c.calm_count || 0,
          totalCount: c.total_practices || 0,
        })))
      }

      // Get this week's practices with responses
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: weekPractices } = await supabase
        .from('cue_practices')
        .select('cues')
        .eq('dog_id', dog.id)
        .gte('created_at', weekAgo.toISOString())

      if (weekPractices) {
        let weekTotal = 0
        let weekCalm = 0
        
        weekPractices.forEach(p => {
          p.cues?.forEach((c: any) => {
            weekTotal++
            if (c.response === 'calm') weekCalm++
          })
        })
        
        setThisWeekCount(weekTotal)
        setThisWeekCalmRate(weekTotal > 0 ? Math.round((weekCalm / weekTotal) * 100) : 0)
      }

      // Calculate streak
      const { data: recentDays } = await supabase
        .from('cue_practices')
        .select('created_at')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (recentDays && recentDays.length > 0) {
        const days = new Set(recentDays.map(p => p.created_at.split('T')[0]))
        const today = new Date().toISOString().split('T')[0]
        const checkDate = new Date()
        let currentStreak = 0
        
        if (days.has(today)) {
          currentStreak = 1
          checkDate.setDate(checkDate.getDate() - 1)
        }
        
        for (let i = 0; i < 30; i++) {
          const dateStr = checkDate.toISOString().split('T')[0]
          if (days.has(dateStr)) {
            currentStreak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
        setStreak(currentStreak)
      }

      setLoading(false)
    }

    if (dog) {
      loadProgress()
    }
  }, [dog])

  const startPractice = () => {
    router.push('/practice?more=true')
  }

  const practiceSpecificCue = (cueId: string) => {
    router.push(`/practice?cue=${cueId}`)
  }

  const startAbsencePractice = () => {
    router.push('/absence-practice')
  }

  const addCue = async () => {
    if (!dog || !newCueName.trim()) return
    setAdding(true)

    await supabase.from('custom_cues').insert({
      dog_id: dog.id,
      name: newCueName.trim(),
      icon: '🎯',
      instructions: `Calmly ${newCueName.trim().toLowerCase()} while your dog watches. Don't make eye contact. Repeat 10 times.`,
      success_looks_like: `${dog.name} stays relaxed and doesn't react`,
      if_struggling: 'Try doing it more slowly, or from further away from your dog',
    })

    // Reload cues
    const { data: cuesData } = await supabase
      .from('custom_cues')
      .select('id, name, icon, calm_count, total_practices')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: true })

    if (cuesData) {
      setCues(cuesData.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        calmCount: c.calm_count || 0,
        totalCount: c.total_practices || 0,
      })))
    }

    setNewCueName('')
    setShowAddCue(false)
    setAdding(false)
  }

  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  const masteredCount = cues.filter(c => c.calmCount >= 5).length
  const level2Unlocked = masteredCount >= 3

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{dog?.name}&apos;s Progress</h1>
      </header>

      {/* This Week Summary */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 mb-4">This Week</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{thisWeekCount}</p>
              <p className="text-xs text-gray-500 mt-1">Practices</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{thisWeekCalmRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Stayed calm</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{streak}</p>
              <p className="text-xs text-gray-500 mt-1">Day streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Impact - Before/After Proof */}
      <div className="px-6 mb-6">
        <YourImpactCard dogId={dog?.id || ''} dogName={dog?.name || ''} />
      </div>

      {/* Journey Timeline */}
      <div className="px-6 mb-6">
        <JourneyTimeline dogId={dog?.id || ''} dogName={dog?.name || ''} />
      </div>

      {/* Level 1: Departure Cues */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Level 1: Departure Cues
            </h2>
            <p className="text-xs text-gray-400">Tap any cue to practice it</p>
          </div>
          <div className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
            {masteredCount}/{cues.length} mastered
          </div>
        </div>

        <Button onClick={startPractice} fullWidth size="lg" className="mb-4">
          Smart Practice
          <span className="text-amber-200 text-sm font-normal ml-2">(auto-selects)</span>
        </Button>

        {/* Cue List - Clickable */}
        <div className="space-y-2">
          {cues.map(cue => {
            const isMastered = cue.calmCount >= 5
            const progress = Math.min(100, (cue.calmCount / 5) * 100)
            const calmRate = cue.totalCount > 0 ? Math.round((cue.calmCount / cue.totalCount) * 100) : 0
            
            return (
              <button
                key={cue.id}
                onClick={() => practiceSpecificCue(cue.id)}
                className="w-full bg-white rounded-xl p-3 shadow-sm hover:shadow-md hover:bg-amber-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cue.icon || '🔑'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">{cue.name}</span>
                      <div className="flex items-center gap-2">
                        {isMastered ? (
                          <span className="text-green-600 text-xs font-medium">✓ Mastered</span>
                        ) : (
                          <span className="text-gray-400 text-xs">{cue.calmCount}/5 calm</span>
                        )}
                        <Play className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isMastered ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {cue.totalCount > 0 && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {calmRate}% calm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Add Cue */}
        {showAddCue ? (
          <div className="mt-3 bg-white rounded-xl p-3 shadow-sm">
            <input
              type="text"
              value={newCueName}
              onChange={(e) => setNewCueName(e.target.value)}
              placeholder="e.g., Start the car, Open garage door"
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none mb-2"
            />
            <div className="flex gap-2">
              <Button onClick={addCue} disabled={!newCueName.trim() || adding} size="sm">
                {adding ? 'Adding...' : 'Add Cue'}
              </Button>
              <Button onClick={() => setShowAddCue(false)} variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCue(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 text-amber-600 text-sm font-medium py-2 hover:text-amber-700"
          >
            <Plus className="w-4 h-4" />
            Add a cue
          </button>
        )}
      </div>

      {/* Level 2: Absence Training */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Level 2: Absence Training
            </h2>
            <p className="text-xs text-gray-400">Practice actually leaving</p>
          </div>
          {level2Unlocked ? (
            <div className="bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
              Unlocked!
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-500 text-sm font-medium px-3 py-1 rounded-full">
              {3 - masteredCount} more to unlock
            </div>
          )}
        </div>

        {level2Unlocked ? (
          <Button onClick={startAbsencePractice} fullWidth size="lg" variant="secondary">
            Start Absence Practice
          </Button>
        ) : (
          <div className="bg-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Master 3 cues to unlock</p>
              <p className="text-gray-400 text-xs">Build a foundation first, then practice leaving</p>
            </div>
          </div>
        )}
      </div>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}