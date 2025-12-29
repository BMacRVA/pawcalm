'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { Button } from '../components/ui/Button'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import ProgressInsightCard from '../components/ProgressInsightCard'
import DogProfileCard from '../components/DogProfileCard'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { dog, dogs, loading: dogLoading, selectDog } = useSelectedDog()

  const [todaysCount, setTodaysCount] = useState(0)
  const [todaysGoal, setTodaysGoal] = useState(3)
  const [streak, setStreak] = useState(0)
  const [calmRate, setCalmRate] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [totalCues, setTotalCues] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDogPicker, setShowDogPicker] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!dog) return

      const today = new Date().toISOString().split('T')[0]

      // Get today's practice count
      const { count } = await supabase
        .from('cue_practices')
        .select('*', { count: 'exact', head: true })
        .eq('dog_id', dog.id)
        .gte('created_at', `${today}T00:00:00`)

      setTodaysCount(count || 0)

      // Get cues for mastery count
      const { data: cuesData } = await supabase
        .from('custom_cues')
        .select('calm_count, total_practices')
        .eq('dog_id', dog.id)

      if (cuesData) {
        setTotalCues(cuesData.length)
        setMasteredCount(cuesData.filter(c => (c.calm_count || 0) >= 5).length)
      }

      // Get this week's calm rate
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
        
        setCalmRate(weekTotal > 0 ? Math.round((weekCalm / weekTotal) * 100) : 0)
      }

      // Calculate streak
      const { data: recentDays } = await supabase
        .from('cue_practices')
        .select('created_at')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })
        .limit(30)

      let currentStreak = 0
      if (recentDays && recentDays.length > 0) {
        const days = new Set(recentDays.map(p => p.created_at.split('T')[0]))
        const checkDate = new Date()
        
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
      }
      setStreak(currentStreak)

      // Set goal based on history
      const { count: totalEver } = await supabase
        .from('cue_practices')
        .select('*', { count: 'exact', head: true })
        .eq('dog_id', dog.id)

      if ((totalEver || 0) < 5) setTodaysGoal(3)
      else if (currentStreak < 3) setTodaysGoal(3)
      else if (currentStreak < 7) setTodaysGoal(4)
      else setTodaysGoal(5)

      setLoading(false)
    }

    if (dog) {
      loadData()
    }
  }, [dog])

  const startPractice = () => {
    router.push('/practice?more=true')
  }

  const handleSelectDog = (dogId: string) => {
    const selectedDog = dogs.find(d => d.id === dogId)
    if (selectedDog) {
      selectDog(selectedDog)
    }
    setShowDogPicker(false)
  }

  const addNewDog = () => {
    router.push('/onboarding')
  }

  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!dog) {
    router.push('/onboarding')
    return null
  }

  const completed = todaysCount >= todaysGoal

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button 
          onClick={() => setShowDogPicker(!showDogPicker)}
          className="flex items-center gap-2 text-gray-900"
        >
          <span className="text-2xl">🐕</span>
          <span className="text-xl font-bold">{dog.name}</span>
          {dogs.length > 1 && <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showDogPicker && dogs.length > 0 && (
          <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {dogs.map(d => (
              <button
                key={d.id}
                onClick={() => handleSelectDog(d.id)}
                className={`w-full px-4 py-3 text-left hover:bg-amber-50 transition ${
                  d.id === dog.id ? 'bg-amber-50 text-amber-700' : 'text-gray-700'
                }`}
              >
                {d.name}
              </button>
            ))}
            <button
              onClick={addNewDog}
              className="w-full px-4 py-3 text-left text-amber-600 hover:bg-amber-50 border-t border-gray-100"
            >
              + Add another dog
            </button>
          </div>
        )}
      </header>

      {/* Progress Insight - Smart motivational message */}
      <div className="px-6 mb-4">
        <ProgressInsightCard dogId={dog.id} dogName={dog.name} />
      </div>

      {/* Progressive Profiling - Shows after 5 sessions */}
      <div className="px-6 mb-4">
        <DogProfileCard dogId={dog.id} dogName={dog.name} />
      </div>

      {/* Today's Status */}
      <div className="px-6 mb-6">
        <div className={`rounded-2xl p-5 ${completed ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-600">Today</h2>
            {completed ? (
              <span className="text-green-600 text-sm font-medium">✓ Complete</span>
            ) : (
              <span className="text-amber-600 text-sm font-medium">{todaysGoal - todaysCount} left</span>
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold text-gray-900">{todaysCount}</div>
            <div className="text-gray-500 text-sm">
              of {todaysGoal} practices
            </div>
          </div>

          <Button 
            onClick={startPractice} 
            fullWidth 
            size="lg"
            variant={completed ? 'secondary' : 'primary'}
          >
            {completed ? 'Practice More' : 'Start Practice'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{streak}</p>
            <p className="text-xs text-gray-500">Day streak</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{calmRate}%</p>
            <p className="text-xs text-gray-500">Calm this week</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{masteredCount}/{totalCues}</p>
            <p className="text-xs text-gray-500">Mastered</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-6">
        <button
          onClick={() => router.push('/progress')}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">View Progress</p>
              <p className="text-sm text-gray-500">See all cues & milestones</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => router.push('/videos')}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition mt-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Video Check-in</p>
              <p className="text-sm text-gray-500">See how {dog.name} does alone</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => router.push('/journal')}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition mt-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Coach</p>
              <p className="text-sm text-gray-500">Get personalized guidance</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}