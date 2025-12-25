'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SessionCard, SessionList } from '../components/progress/SessionCard'
import { Key, Footprints, Video, ChevronRight } from 'lucide-react'

type CueProgress = {
  id: string
  name: string
  calmCount: number
  totalCount: number
  status: 'mastered' | 'working' | 'struggling'
}

type Session = {
  id: string
  created_at: string
  duration: number
  target_duration: number
  mission_title: string
  mission_steps: string[]
  steps_completed: number
  dog_response: 'great' | 'okay' | 'struggled'
  owner_feeling: string
  notes: string
}

export default function ProgressPage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [cueProgress, setCueProgress] = useState<CueProgress[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const loadProgress = useCallback(async () => {
    if (!dog) return

    // Load cue progress
    const { data: customCues } = await supabase
      .from('custom_cues')
      .select('id, name')
      .eq('dog_id', dog.id)

    const { data: practices } = await supabase
      .from('cue_practices')
      .select('cues')
      .eq('dog_id', dog.id)

    const cueStats: Record<string, { id: string; name: string; calm: number; total: number }> = {}

    customCues?.forEach(cue => {
      cueStats[cue.id] = { id: cue.id, name: cue.name, calm: 0, total: 0 }
    })

    practices?.forEach(practice => {
      practice.cues?.forEach((c: any) => {
        if (cueStats[c.cue_id]) {
          cueStats[c.cue_id].total++
          if (c.response === 'calm') {
            cueStats[c.cue_id].calm++
          }
        }
      })
    })

    const progress: CueProgress[] = Object.values(cueStats).map(cue => {
      const calmRate = cue.total > 0 ? cue.calm / cue.total : 0
      let status: 'mastered' | 'working' | 'struggling' = 'working'
      
      if (cue.calm >= 5 && calmRate >= 0.7) {
        status = 'mastered'
      } else if (calmRate < 0.3 && cue.total >= 3) {
        status = 'struggling'
      }

      return {
        id: cue.id,
        name: cue.name,
        calmCount: cue.calm,
        totalCount: cue.total,
        status,
      }
    })

    setCueProgress(progress)

    // Load sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setSessions(sessionsData || [])
    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      loadProgress()
    }
  }, [dog, loadProgress])

  const handleCueClick = (cueId: string) => {
    // Store the cue ID to auto-start practice
    localStorage.setItem('practiceSpecificCue', cueId)
    router.push('/departure-practice')
  }

  const isLoading = dogLoading || loading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-200" />
          <div className="h-4 w-24 bg-amber-200 rounded" />
        </div>
      </div>
    )
  }

  const masteredCues = cueProgress.filter(c => c.status === 'mastered')
  const workingCues = cueProgress.filter(c => c.status === 'working')
  const strugglingCues = cueProgress.filter(c => c.status === 'struggling')

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title={`${dog?.name}'s Progress`} />
      
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Step 1: Departure Cues */}
          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="font-bold text-gray-900">Departure Cues</h2>
              </div>
              <span className="text-amber-600 font-semibold text-sm">
                {masteredCues.length}/{cueProgress.length} mastered
              </span>
            </div>

            {strugglingCues.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Causes stress
                </p>
                <div className="flex flex-wrap gap-2">
                  {strugglingCues.map(cue => (
                    <button
                      key={cue.id}
                      onClick={() => handleCueClick(cue.id)}
                      className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm border border-red-100 hover:bg-red-100 transition cursor-pointer"
                    >
                      {cue.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {workingCues.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-amber-600 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Working on
                </p>
                <div className="flex flex-wrap gap-2">
                  {workingCues.map(cue => (
                    <button
                      key={cue.id}
                      onClick={() => handleCueClick(cue.id)}
                      className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm border border-amber-100 hover:bg-amber-100 transition cursor-pointer"
                    >
                      {cue.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {masteredCues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Mastered
                </p>
                <div className="flex flex-wrap gap-2">
                  {masteredCues.map(cue => (
                    <button
                      key={cue.id}
                      onClick={() => handleCueClick(cue.id)}
                      className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-100 hover:bg-green-100 transition cursor-pointer"
                    >
                      {cue.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cueProgress.length === 0 && (
              <p className="text-gray-500 text-sm">No cues yet. Start practicing!</p>
            )}
          </Card>

          {/* Step 2: Absence Sessions */}
          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  masteredCues.length >= 3 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <h2 className="font-bold text-gray-900">Absence Sessions</h2>
              </div>
              <span className="text-amber-600 font-semibold text-sm">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {sessions.length > 0 ? (
              <SessionList>
                {sessions.slice(0, 3).map(session => (
                  <SessionCard
                    key={session.id}
                    id={session.id}
                    date={session.created_at}
                    duration={session.duration}
                    targetDuration={session.target_duration}
                    missionTitle={session.mission_title}
                    missionSteps={session.mission_steps}
                    stepsCompleted={session.steps_completed}
                    stepsTotal={session.mission_steps?.length || 0}
                    dogResponse={session.dog_response}
                    ownerFeeling={session.owner_feeling}
                    notes={session.notes}
                  />
                ))}
              </SessionList>
            ) : masteredCues.length >= 3 ? (
              <p className="text-gray-500 text-sm">Ready for absence training! No sessions yet.</p>
            ) : (
              <p className="text-gray-500 text-sm">Master 3 cues to unlock absence training.</p>
            )}
          </Card>

          {/* Step 3: Video Analysis */}
          <Card 
            variant="elevated" 
            padding="md" 
            pressable 
            onClick={() => router.push('/videos')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Video Analysis</h2>
                  <p className="text-gray-500 text-sm">Upload videos to track behavior</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button onClick={() => router.push('/departure-practice')} variant="secondary" fullWidth>
              <Key className="w-4 h-4" />
              Cues
            </Button>
            <Button onClick={() => router.push('/mission')} variant="secondary" fullWidth>
              <Footprints className="w-4 h-4" />
              Session
            </Button>
            <Button onClick={() => router.push('/videos')} variant="secondary" fullWidth>
              <Video className="w-4 h-4" />
              Video
            </Button>
          </div>

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}