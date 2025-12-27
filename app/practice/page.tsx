'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { Button } from '../components/ui/Button'
import { Loader2, Home } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type Cue = {
  id: string
  name: string
  calmCount: number
  totalCount: number
  lastResponse?: string
  lastPracticedAt?: string
}

type Response = 'calm' | 'noticed' | 'anxious'

// Smart cue selection algorithm
function selectNextCue(cues: Cue[], todaysPractices: string[]): Cue | null {
  if (cues.length === 0) return null

  // Filter out cues practiced too recently (in last 2 practices)
  const recentCueIds = todaysPractices.slice(-2)
  const availableCues = cues.filter(c => !recentCueIds.includes(c.id))
  const cuesToConsider = availableCues.length > 0 ? availableCues : cues

  // Scoring system (higher = more likely to be selected)
  const scored = cuesToConsider.map(cue => {
    let score = 50 // Base score

    // Boost cues that are close to mastery (3-4 calm responses)
    if (cue.calmCount >= 3 && cue.calmCount < 5) {
      score += 30 // Almost there - let's finish it!
    }

    // Boost cues that have never been practiced
    if (cue.totalCount === 0) {
      score += 20 // New cue, should try it
    }

    // Boost cues with good calm rate (they're working)
    if (cue.totalCount > 0) {
      const calmRate = cue.calmCount / cue.totalCount
      if (calmRate >= 0.5) {
        score += 15 // This one's going well
      }
    }

    // Slight penalty for cues that have been anxious recently
    if (cue.lastResponse === 'anxious') {
      score -= 10 // Give it a rest
    }

    // Penalty for already mastered cues
    if (cue.calmCount >= 5) {
      score -= 40 // Already mastered, focus elsewhere
    }

    // Add some randomness to keep it interesting
    score += Math.random() * 20

    return { cue, score }
  })

  // Sort by score and pick the best
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.cue || cues[0]
}

// Calculate today's goal based on history
function getTodaysGoal(totalPracticesEver: number, dayStreak: number): number {
  // New user: start easy
  if (totalPracticesEver < 5) return 3
  
  // Building habit: gradual increase
  if (dayStreak < 3) return 3
  if (dayStreak < 7) return 4
  
  // Established: steady practice
  return 5
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default function PracticePage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()

  const [cues, setCues] = useState<Cue[]>([])
  const [currentCue, setCurrentCue] = useState<Cue | null>(null)
  const [loading, setLoading] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [lastResponse, setLastResponse] = useState<Response | null>(null)
  const [todaysPractices, setTodaysPractices] = useState<string[]>([])
  const [todaysGoal, setTodaysGoal] = useState(3)
  const [todaysCount, setTodaysCount] = useState(0)
  const [generating, setGenerating] = useState(false)
  const searchParams = useSearchParams()
const wantMoreParam = searchParams.get('more') === 'true'
const [wantMore, setWantMore] = useState(wantMoreParam)

  const loadData = useCallback(async () => {
    if (!dog) return

    // Get cues
    const { data: customCues } = await supabase
      .from('custom_cues')
      .select('id, name, calm_count, total_practices, last_practiced_at')
      .eq('dog_id', dog.id)

    // Get today's practices
    const today = new Date().toISOString().split('T')[0]
    const { data: practices } = await supabase
      .from('cue_practices')
      .select('cues, created_at')
      .eq('dog_id', dog.id)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: true })

    // Get total practices ever for goal calculation
    const { count: totalEver } = await supabase
      .from('cue_practices')
      .select('*', { count: 'exact', head: true })
      .eq('dog_id', dog.id)

    // Calculate streak (simplified)
    const { data: recentDays } = await supabase
      .from('cue_practices')
      .select('created_at')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })
      .limit(30)

    let streak = 0
    if (recentDays && recentDays.length > 0) {
      const days = new Set(recentDays.map(p => p.created_at.split('T')[0]))
      const checkDate = new Date()
      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (days.has(dateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else if (i > 0) {
          break
        } else {
          checkDate.setDate(checkDate.getDate() - 1)
        }
      }
    }

    // Build cue data
    const cueData: Cue[] = customCues?.map(c => ({
      id: c.id,
      name: c.name,
      calmCount: c.calm_count || 0,
      totalCount: c.total_practices || 0,
      lastPracticedAt: c.last_practiced_at,
    })) || []

    // Track today's practiced cue IDs
    const todaysCueIds: string[] = []
    practices?.forEach(p => {
      p.cues?.forEach((c: any) => {
        todaysCueIds.push(c.cue_id)
      })
    })

    setCues(cueData)
    setTodaysPractices(todaysCueIds)
    setTodaysCount(todaysCueIds.length)
    setTodaysGoal(getTodaysGoal(totalEver || 0, streak))

    // Select first cue
    if (cueData.length > 0) {
      const next = selectNextCue(cueData, todaysCueIds)
      setCurrentCue(next)
    }

    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      loadData()
    }
  }, [dog, loadData])

  const generateCues = async () => {
    if (!dog) return
    setGenerating(true)

    try {
      const response = await fetch('/api/generate-cues-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dog }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.cues && data.cues.length > 0) {
          const cuesToInsert = data.cues.map((cue: any) => ({
            dog_id: dog.id,
            name: cue.name,
            is_ai_generated: true,
          }))

          await supabase.from('custom_cues').insert(cuesToInsert)
          await loadData()
        }
      }
    } catch (error) {
      console.error('Error generating cues:', error)
    }

    setGenerating(false)
  }

  const logResponse = async (response: Response) => {
    if (!dog || !currentCue) return

    setLastResponse(response)
    setShowResult(true)

    const now = new Date()

    // Log the practice
    await supabase.from('cue_practices').insert({
      dog_id: dog.id,
      cues: [{
        cue_id: currentCue.id,
        cue_name: currentCue.name,
        response: response,
      }],
      time_of_day: getTimeOfDay(),
      day_of_week: now.getDay(),
    })

    // Update cue stats
    const newCalmCount = currentCue.calmCount + (response === 'calm' ? 1 : 0)
    await supabase
      .from('custom_cues')
      .update({
        total_practices: currentCue.totalCount + 1,
        calm_count: newCalmCount,
        last_practiced_at: now.toISOString(),
        ...(newCalmCount >= 5 ? { mastered_at: now.toISOString() } : {}),
      })
      .eq('id', currentCue.id)

    // Update local state
    setTodaysCount(prev => prev + 1)
    setTodaysPractices(prev => [...prev, currentCue.id])
  }

  const nextCue = async () => {
    setShowResult(false)
    setLastResponse(null)
    setWantMore(true)
    
    // Reload data and select next cue
    await loadData()
  }

  const goHome = () => {
    router.push('/dashboard')
  }

  // Loading state
  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // No cues yet - generate them
  if (cues.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-6">
        <span className="text-6xl mb-6">🔑</span>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Setting up {dog?.name}&apos;s practice
        </h1>
        <p className="text-gray-500 text-center mb-8">
          We&apos;ll create some departure cues to practice
        </p>
        <Button onClick={generateCues} loading={generating} size="lg">
          {generating ? 'Creating...' : 'Get Started'}
        </Button>
      </div>
    )
  }

  // Done for today - only show if they haven't asked for more
  if (todaysCount >= todaysGoal && !showResult && !wantMore) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-6">
        <span className="text-6xl mb-6">🎉</span>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Great job today!
        </h1>
        <p className="text-gray-500 text-center mb-2">
          You did {todaysCount} practices with {dog?.name}
        </p>
        <p className="text-gray-400 text-center mb-8">
          Come back tomorrow to keep building the habit
        </p>
        <Button onClick={goHome} size="lg">
          <Home className="w-5 h-5" />
          Done
        </Button>
        <button 
          onClick={nextCue}
          className="mt-4 text-amber-600 text-sm hover:text-amber-700"
        >
          I want to do more
        </button>
      </div>
    )
  }

  // Show result
  if (showResult && currentCue) {
    const remaining = todaysGoal - todaysCount
    const hitGoal = todaysCount >= todaysGoal
    
    const getResultEmoji = () => {
      if (lastResponse === 'calm') return '🎉'
      if (lastResponse === 'noticed') return '👍'
      return '💪'
    }

    const getResultMessage = () => {
      if (lastResponse === 'calm') {
        return `${dog?.name} stayed calm!`
      }
      if (lastResponse === 'noticed') {
        return `${dog?.name} noticed but stayed chill`
      }
      return `That's okay, we'll keep working on it`
    }

    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <span className="text-6xl mb-6">{getResultEmoji()}</span>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {getResultMessage()}
          </h1>
          <p className="text-gray-400 mb-8">
            {hitGoal ? "You've hit today's goal!" : `${remaining} more to go today`}
          </p>
          
          <div className="w-full max-w-xs space-y-3">
            <Button onClick={nextCue} fullWidth size="lg">
              {hitGoal ? 'One More' : 'Next Cue'}
            </Button>
            <Button onClick={goHome} variant="secondary" fullWidth>
              Done for Now
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Main practice view
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Progress indicator */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Today</span>
          <span>{todaysCount} of {todaysGoal}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${Math.min(100, (todaysCount / todaysGoal) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {currentCue && (
          <>
            <span className="text-6xl mb-6">🔑</span>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {currentCue.name}
            </h1>
            <p className="text-gray-400 text-center mb-10">
              Do it, then tell us how {dog?.name} reacted
            </p>

            {/* Response buttons */}
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={() => logResponse('calm')}
                className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-2xl transition flex items-center justify-center gap-3"
              >
                <span className="text-2xl">😎</span>
                Calm
              </button>
              <button
                onClick={() => logResponse('noticed')}
                className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold rounded-2xl transition flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🙂</span>
                Noticed
              </button>
              <button
                onClick={() => logResponse('anxious')}
                className="w-full py-4 px-6 bg-red-400 hover:bg-red-500 text-white text-lg font-semibold rounded-2xl transition flex items-center justify-center gap-3"
              >
                <span className="text-2xl">😰</span>
                Anxious
              </button>
            </div>
          </>
        )}
      </main>

      {/* Skip / Exit */}
      <div className="px-6 pb-8">
        <button 
          onClick={goHome}
          className="w-full text-center text-gray-400 text-sm hover:text-gray-600"
        >
          Exit
        </button>
      </div>
    </div>
  )
}