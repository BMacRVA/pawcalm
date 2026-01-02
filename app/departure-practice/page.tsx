'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CueCard, CueList } from '../components/domain/CueCard'
import { Plus, Sparkles, RotateCcw, Check, ChevronDown, ChevronUp } from 'lucide-react'

type Cue = {
  id: string
  name: string
  calmCount: number
  totalCount: number
}

type PracticeResponse = 'calm' | 'slight_reaction' | 'anxious'

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function getCueType(cueName: string): string {
  const name = cueName.toLowerCase()
  if (name.includes('key')) return 'keys'
  if (name.includes('shoe')) return 'shoes'
  if (name.includes('door')) return 'door'
  if (name.includes('jacket') || name.includes('coat')) return 'jacket'
  if (name.includes('bag') || name.includes('purse')) return 'bag'
  if (name.includes('coffee')) return 'routine'
  return 'other'
}

// Progress dots component
function ProgressDots({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full transition-all ${
            i < current 
              ? 'bg-amber-500' 
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function DeparturePracticePage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [cues, setCues] = useState<Cue[]>([])
  const [selectedCue, setSelectedCue] = useState<Cue | null>(null)
  const [practiceMode, setPracticeMode] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [lastResponse, setLastResponse] = useState<PracticeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddCue, setShowAddCue] = useState(false)
  const [newCueName, setNewCueName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sessionSequence, setSessionSequence] = useState(0)
  const [consecutiveAnxious, setConsecutiveAnxious] = useState(0)
  const [updatedCalmCount, setUpdatedCalmCount] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)

  const loadCues = useCallback(async () => {
    if (!dog) return

    const { data: customCues } = await supabase
      .from('custom_cues')
      .select('id, name')
      .eq('dog_id', dog.id)

    const { data: practices } = await supabase
      .from('cue_practices')
      .select('cues')
      .eq('dog_id', dog.id)

    const cueStats: Record<string, { calm: number; total: number }> = {}

    customCues?.forEach(cue => {
      cueStats[cue.id] = { calm: 0, total: 0 }
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

    const cuesWithStats: Cue[] = customCues?.map(cue => ({
      id: cue.id,
      name: cue.name,
      calmCount: cueStats[cue.id]?.calm || 0,
      totalCount: cueStats[cue.id]?.total || 0,
    })) || []

    setCues(cuesWithStats)
    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      loadCues()
    }
  }, [dog, loadCues])

  useEffect(() => {
    if (cues.length > 0) {
      const specificCueId = localStorage.getItem('practiceSpecificCue')
      if (specificCueId) {
        localStorage.removeItem('practiceSpecificCue')
        const cueToStart = cues.find(c => c.id === specificCueId)
        if (cueToStart) {
          startPractice(cueToStart)
        }
      }
    }
  }, [cues])

  const generateCues = async () => {
    if (!dog) return
    setGenerating(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch('/api/generate-cues-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dog }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.cues && data.cues.length > 0) {
          const cuesToInsert = data.cues.map((cue: any) => ({
            dog_id: dog.id,
            name: cue.name,
            icon: cue.icon,
            instructions: cue.instructions,
            success_looks_like: cue.success_looks_like,
            if_struggling: cue.if_struggling,
            priority: cue.priority,
            reason: cue.reason,
            is_ai_generated: true,
            is_custom: false,
          }))

          await supabase.from('custom_cues').insert(cuesToInsert)
        }
        
        await loadCues()
      }
    } catch (error) {
      console.error('Error generating cues:', error)
    }

    setGenerating(false)
  }

  const addCustomCue = async () => {
    if (!dog || !newCueName.trim()) return

    await supabase.from('custom_cues').insert({
      dog_id: dog.id,
      name: newCueName.trim(),
      is_custom: true,
      is_ai_generated: false,
    })

    setNewCueName('')
    setShowAddCue(false)
    loadCues()
  }

  const startPractice = (cue: Cue) => {
    setSelectedCue(cue)
    setPracticeMode(true)
    setShowResult(false)
    setLastResponse(null)
    setShowExplanation(false)
  }

  const logResponse = async (response: PracticeResponse) => {
    if (!dog || !selectedCue) return

    setLastResponse(response)
    setSessionSequence(prev => prev + 1)

    // Calculate new calm count immediately for display
    const newCalmCount = selectedCue.calmCount + (response === 'calm' ? 1 : 0)
    setUpdatedCalmCount(Math.min(newCalmCount, 5)) // Cap at 5 for display

    // Track consecutive anxious for suggestions
    if (response === 'anxious') {
      setConsecutiveAnxious(prev => prev + 1)
    } else {
      setConsecutiveAnxious(0)
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Count practices today
    const { count: practicesToday } = await supabase
      .from('cue_practices')
      .select('*', { count: 'exact', head: true })
      .eq('dog_id', dog.id)
      .gte('created_at', `${today}T00:00:00`)

    const practiceNumber = selectedCue.totalCount + 1

    // Insert practice data
    await supabase.from('cue_practices').insert({
      dog_id: dog.id,
      cues: [{
        cue_id: selectedCue.id,
        cue_name: selectedCue.name,
        response: response,
      }],
      practice_number: practiceNumber,
      time_of_day: getTimeOfDay(),
      day_of_week: now.getDay(),
      session_sequence: sessionSequence,
      practices_today: (practicesToday || 0) + 1,
    })

    // Simple mastery: 5 calm responses
    const justMastered = newCalmCount >= 5 && selectedCue.calmCount < 5

    // Update cue statistics
    await supabase
      .from('custom_cues')
      .update({
        total_practices: selectedCue.totalCount + 1,
        calm_count: newCalmCount,
        last_practiced_at: now.toISOString(),
        ...(justMastered ? { mastered_at: now.toISOString() } : {}),
      })
      .eq('id', selectedCue.id)

    // Log to outcome_patterns for ML
    await supabase.from('outcome_patterns').insert({
      dog_breed: dog.breed,
      dog_age: dog.age,
      severity: dog.severity,
      baseline: parseInt(String(dog.baseline)) || 5,
      cue_name: selectedCue.name,
      cue_type: getCueType(selectedCue.name),
      practice_number: practiceNumber,
      time_of_day: getTimeOfDay(),
      day_of_week: now.getDay(),
      response: response,
      was_successful: response === 'calm',
      dog_id: dog.id,
      cue_id: selectedCue.id,
    })

    // Show result screen
    setShowResult(true)

    // Reload cues in background
    loadCues()
  }

  const finishPractice = () => {
    setPracticeMode(false)
    setSelectedCue(null)
    setShowResult(false)
    setLastResponse(null)
    setSessionSequence(0)
    setConsecutiveAnxious(0)
    router.push('/dashboard')
  }

  const practiceAnother = () => {
    setShowResult(false)
    setLastResponse(null)
    setSelectedCue(null)
    setPracticeMode(false)
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

  // Practice Mode - Show Result
  if (practiceMode && showResult && selectedCue) {
    const justMastered = updatedCalmCount >= 5 && selectedCue.calmCount < 5
    const remaining = Math.max(0, 5 - updatedCalmCount)

    // Simple, clear messages
    const getResultContent = () => {
      if (justMastered) {
        return {
          emoji: '🏆',
          title: 'Cue Mastered!',
          message: `Amazing! ${dog?.name} has learned that "${selectedCue.name}" doesn't mean you're leaving.`,
        }
      }
      
      if (lastResponse === 'calm') {
        return {
          emoji: '🎉',
          title: 'Nice work!',
          message: remaining > 0 
            ? `${remaining} more to go. ${dog?.name} is learning!`
            : `${dog?.name} has got this down!`,
        }
      }
      
      if (lastResponse === 'slight_reaction') {
        return {
          emoji: '👍',
          title: 'Good effort!',
          message: `${dog?.name} noticed but stayed relatively calm. That's progress! ${remaining} more calm responses to master this cue.`,
        }
      }
      
      // anxious
      return {
        emoji: '💪',
        title: 'Keep going!',
        message: `That's okay - setbacks happen. ${remaining} more calm responses to master this cue.`,
      }
    }

    const content = getResultContent()

    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Practice Complete" />
        
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Card variant="elevated" padding="lg" className="text-center">
              
              {/* Emoji */}
              <span className="text-6xl mb-4 block">{content.emoji}</span>
              
              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {content.title}
              </h2>
              
              {/* Cue name */}
              <p className="text-amber-600 font-medium mb-4">
                {selectedCue.name}
              </p>

              {/* Progress dots */}
              <div className="mb-4">
                <ProgressDots current={updatedCalmCount} />
                <p className="text-sm text-gray-500 mt-2">
                  {updatedCalmCount} of 5 calm responses
                </p>
              </div>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                {content.message}
              </p>

              {/* Expandable explanation */}
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center justify-center gap-1 text-sm text-amber-600 hover:text-amber-700 mb-4 mx-auto"
              >
                What does this mean?
                {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showExplanation && (
                <Card variant="filled" padding="md" className="mb-6 text-left">
                  <p className="text-amber-800 text-sm">
                    You&apos;re teaching {dog?.name} that &quot;{selectedCue.name.toLowerCase()}&quot; doesn&apos;t always mean you&apos;re leaving. 
                    Once {dog?.name} stays calm for this cue 5 times, it&apos;s mastered and you can move to the next challenge.
                  </p>
                  <p className="text-amber-800 text-sm mt-2">
                    <strong>Remember:</strong> Only &quot;calm&quot; responses count toward mastery. Slight reactions and anxious responses help you understand where {dog?.name} needs more practice.
                  </p>
                </Card>
              )}

              {/* Suggestion if struggling */}
              {consecutiveAnxious >= 2 && (
                <Card variant="outlined" padding="md" className="mb-6 bg-blue-50 border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Tip:</strong> {dog?.name} seems to be struggling with this one. Try taking a break, or practice a different cue that&apos;s been going better.
                  </p>
                </Card>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                <Button onClick={practiceAnother} fullWidth>
                  Practice Another Cue
                </Button>
                <Button onClick={finishPractice} variant="secondary" fullWidth>
                  Done for Now
                </Button>
              </div>
            </Card>
          </div>
        </main>

        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Practice Mode - Log Response
  if (practiceMode && selectedCue) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Practice Cue" showBack onBack={() => {
          setPracticeMode(false)
          setSelectedCue(null)
        }} />
        
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto space-y-6">
            
            {/* Current cue */}
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-5xl mb-4 block">🔑</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCue.name}</h2>
              
              {/* Show current progress */}
              <div className="mb-4">
                <ProgressDots current={selectedCue.calmCount} />
                <p className="text-sm text-gray-500 mt-2">
                  {selectedCue.calmCount} of 5 calm responses
                </p>
              </div>

              <p className="text-gray-600">
                Do this action, then tell us how {dog?.name} reacted.
              </p>
            </Card>

            {/* Quick instructions */}
            <Card variant="filled" padding="md" className="bg-amber-50">
              <p className="text-amber-800 text-sm">
                <strong>Quick tip:</strong> Do the action calmly, watch {dog?.name} for 5-10 seconds, then record the response. Don&apos;t actually leave!
              </p>
            </Card>

            {/* Response buttons */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                How did {dog?.name} react?
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => logResponse('calm')}
                  className="w-full flex items-center gap-4 p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition"
                >
                  <span className="text-3xl">😎</span>
                  <div className="text-left">
                    <p className="font-semibold text-lg">Calm</p>
                    <p className="text-sm opacity-80">No reaction, relaxed</p>
                  </div>
                </button>

                <button
                  onClick={() => logResponse('slight_reaction')}
                  className="w-full flex items-center gap-4 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition"
                >
                  <span className="text-3xl">🙂</span>
                  <div className="text-left">
                    <p className="font-semibold text-lg">Slight Reaction</p>
                    <p className="text-sm opacity-80">Noticed but stayed calm</p>
                  </div>
                </button>

                <button
                  onClick={() => logResponse('anxious')}
                  className="w-full flex items-center gap-4 p-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition"
                >
                  <span className="text-3xl">😰</span>
                  <div className="text-left">
                    <p className="font-semibold text-lg">Anxious</p>
                    <p className="text-sm opacity-80">Stressed, pacing, whining</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </main>

        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Main Cue List View
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader 
        title="Departure Cues" 
        subtitle={`Help ${dog?.name} stay calm`}
        showBack
        backHref="/dashboard"
      />
      
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">

          <Card variant="filled" padding="md">
            <p className="text-amber-800 text-sm">
              <strong>What are departure cues?</strong> These are actions you do before leaving (like picking up keys). 
              We&apos;ll practice them <em>without</em> leaving, so {dog?.name} learns they don&apos;t always mean goodbye.
            </p>
          </Card>

          {cues.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {dog?.name}&apos;s Cues ({cues.length})
              </h2>
              <CueList>
                {cues.map(cue => (
                  <CueCard
                    key={cue.id}
                    name={cue.name}
                    calmCount={cue.calmCount}
                    totalCount={cue.totalCount}
                    onPractice={() => startPractice(cue)}
                  />
                ))}
              </CueList>
            </div>
          ) : (
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-5xl mb-4 block">🔑</span>
              <h2 className="text-lg font-bold text-gray-900 mb-2">No cues yet</h2>
              <p className="text-gray-600 mb-6">
                Let&apos;s generate some personalized departure cues for {dog?.name}.
              </p>
              <Button onClick={generateCues} loading={generating} fullWidth>
                <Sparkles className="w-5 h-5" />
                Generate Cues for {dog?.name}
              </Button>
            </Card>
          )}

          {cues.length > 0 && (
            <>
              {showAddCue ? (
                <Card variant="outlined" padding="md">
                  <h3 className="font-semibold text-gray-900 mb-3">Add Custom Cue</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCueName}
                      onChange={(e) => setNewCueName(e.target.value)}
                      placeholder="e.g., Start my car"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                    <Button onClick={addCustomCue} disabled={!newCueName.trim()}>
                      <Check className="w-5 h-5" />
                    </Button>
                  </div>
                  <button
                    onClick={() => setShowAddCue(false)}
                    className="text-gray-500 text-sm mt-2 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </Card>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddCue(true)} variant="secondary" fullWidth>
                    <Plus className="w-5 h-5" />
                    Add Custom Cue
                  </Button>
                  <Button onClick={generateCues} variant="ghost" loading={generating}>
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}