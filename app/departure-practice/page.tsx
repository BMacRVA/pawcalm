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
import { Plus, Sparkles, RotateCcw, Check } from 'lucide-react'

type Cue = {
  id: string
  name: string
  calmCount: number
  totalCount: number
}

type PracticeResponse = 'calm' | 'slight_reaction' | 'anxious'

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

  // Handle deep link from Progress page
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
      const response = await fetch('/api/generate-cues-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dog }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('API returned:', data)
        console.log('Dog ID:', dog.id, typeof dog.id)
        
        // Save cues to database
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

          console.log('Inserting cues:', cuesToInsert)

          const { data: insertedData, error } = await supabase
            .from('custom_cues')
            .insert(cuesToInsert)
            .select()

          if (error) {
            console.error('Error saving cues:', JSON.stringify(error, null, 2))
          } else {
            console.log('Inserted successfully:', insertedData)
          }
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

    const { error } = await supabase
      .from('custom_cues')
      .insert({
        dog_id: dog.id,
        name: newCueName.trim(),
        is_custom: true,
        is_ai_generated: false,
      })

    if (!error) {
      setNewCueName('')
      setShowAddCue(false)
      loadCues()
    }
  }

  const startPractice = (cue: Cue) => {
    setSelectedCue(cue)
    setPracticeMode(true)
    setShowResult(false)
    setLastResponse(null)
  }

  const logResponse = async (response: PracticeResponse) => {
    if (!dog || !selectedCue) return

    setLastResponse(response)
    setShowResult(true)

    await supabase.from('cue_practices').insert({
      dog_id: dog.id,
      cues: [{
        cue_id: selectedCue.id,
        cue_name: selectedCue.name,
        response: response,
      }],
    })

    loadCues()
  }

  const finishPractice = () => {
    setPracticeMode(false)
    setSelectedCue(null)
    setShowResult(false)
    setLastResponse(null)
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
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Practice Complete" />
        
        <main className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-6xl mb-4 block">
                {lastResponse === 'calm' ? '🎉' : lastResponse === 'slight_reaction' ? '👍' : '💪'}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {lastResponse === 'calm' && 'Amazing!'}
                {lastResponse === 'slight_reaction' && 'Good effort!'}
                {lastResponse === 'anxious' && 'Keep going!'}
              </h2>
              <p className="text-gray-600 mb-6">
                {lastResponse === 'calm' && `${dog?.name} stayed calm! That's great progress.`}
                {lastResponse === 'slight_reaction' && `${dog?.name} had a small reaction. That's normal - keep practicing!`}
                {lastResponse === 'anxious' && `${dog?.name} was anxious this time. We'll get there with more practice.`}
              </p>

              {/* Progress update */}
              <Card variant="filled" padding="md" className="mb-6 text-left">
                <p className="text-amber-800 text-sm">
                  <strong>📊 {selectedCue.name}:</strong> {selectedCue.calmCount + (lastResponse === 'calm' ? 1 : 0)} calm responses out of {selectedCue.totalCount + 1} total
                  {selectedCue.calmCount + (lastResponse === 'calm' ? 1 : 0) >= 5 && ' — Almost mastered!'}
                </p>
              </Card>

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
            
            {/* Current Cue */}
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-5xl mb-4 block">🔑</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCue.name}</h2>
              <p className="text-gray-600">
                Perform this action, then record how {dog?.name} reacted.
              </p>
            </Card>

            {/* Instructions */}
            <Card variant="filled" padding="md" className="bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-2">📋 How to Practice</h3>
              <ol className="text-blue-800 text-sm space-y-2">
                <li>1. Make sure {dog?.name} can see you</li>
                <li>2. Calmly perform the action: <strong>{selectedCue.name.toLowerCase()}</strong></li>
                <li>3. Watch {dog?.name}&apos;s reaction for 5-10 seconds</li>
                <li>4. Record the response below</li>
                <li>5. <strong>Don&apos;t leave!</strong> This is just practice</li>
              </ol>
            </Card>

            {/* What to Watch For */}
            <Card variant="outlined" padding="md">
              <h3 className="font-semibold text-gray-900 mb-3">👀 What to Watch For</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-gray-700"><strong>Calm:</strong> Relaxed body, no change in behavior, might glance but looks away</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500">~</span>
                  <p className="text-gray-700"><strong>Slight reaction:</strong> Ears perk up, watches you, mild interest but settles</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">!</span>
                  <p className="text-gray-700"><strong>Anxious:</strong> Gets up, follows you, whines, paces, or shows stress signals</p>
                </div>
              </div>
            </Card>

            {/* Response Buttons */}
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

            {/* Tip */}
            <Card variant="filled" padding="md">
              <p className="text-amber-800 text-sm">
                <strong>💡 Tip:</strong> If {dog?.name} is anxious, that&apos;s valuable information! 
                It means we need to practice this cue more. Try doing it more casually next time, 
                or pair it with treats.
              </p>
            </Card>

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

          {/* Explanation Card */}
          <Card variant="filled" padding="md">
            <p className="text-amber-800 text-sm">
              <strong>What are departure cues?</strong> These are actions you do before leaving (like picking up keys). 
              We&apos;ll practice them <em>without</em> leaving, so {dog?.name} learns they don&apos;t always mean goodbye.
            </p>
          </Card>

          {/* Cue List */}
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

          {/* Add Custom Cue */}
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