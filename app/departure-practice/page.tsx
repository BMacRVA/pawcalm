'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

type Cue = {
  id: string
  name: string
  instructions: string
  success_looks_like: string
  if_struggling: string
  icon: string
  isCustom?: boolean
  isAiGenerated?: boolean
  priority?: 'high' | 'medium' | 'low'
  reason?: string
}

type CueWithStatus = Cue & {
  status: 'not-started' | 'stressful' | 'working-on' | 'mastered'
  calmCount: number
  totalCount: number
  calmNeeded: number
}

type Dog = {
  id: string
  name: string
  breed: string
  age: string
  baseline: number
  behavior: string
  triggers: string[]
  behaviors: string[]
  severity: string
  owner_schedule: string
  leave_duration: string
  custom_triggers: string[]
}

const CALM_NEEDED_TO_MASTER = 5

export default function DeparturePracticePage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [cues, setCues] = useState<CueWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingCues, setGeneratingCues] = useState(false)
  const [personalizedMessage, setPersonalizedMessage] = useState('')
  const [selectedCue, setSelectedCue] = useState<CueWithStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [lastResponse, setLastResponse] = useState<'calm' | 'noticed' | 'anxious' | null>(null)
  const [showAddCue, setShowAddCue] = useState(false)
  const [newTriggerName, setNewTriggerName] = useState('')
  const [generatingCue, setGeneratingCue] = useState(false)
  const [generatedCue, setGeneratedCue] = useState<{ instructions: string; success_looks_like: string; if_struggling: string } | null>(null)
  const [savingCue, setSavingCue] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

    if (dogData) {
      setDog(dogData)

      // Fetch practice history
      const { data: practices } = await supabase
        .from('cue_practices')
        .select('*')
        .eq('dog_id', dogData.id)
        .order('created_at', { ascending: false })

      const cueStats: Record<string, { calm: number; total: number }> = {}
      practices?.forEach(practice => {
        practice.cues?.forEach((cue: any) => {
          if (!cueStats[cue.cue_id]) {
            cueStats[cue.cue_id] = { calm: 0, total: 0 }
          }
          cueStats[cue.cue_id].total++
          if (cue.response === 'calm') {
            cueStats[cue.cue_id].calm++
          }
        })
      })

      // Check for existing cues
      const { data: existingCues } = await supabase
        .from('custom_cues')
        .select('*')
        .eq('dog_id', dogData.id)
        .order('created_at', { ascending: true })

      const customCues = existingCues?.filter(c => c.is_custom) || []
      const aiCues = existingCues?.filter(c => c.is_ai_generated) || []

      // If we don't have enough AI cues, generate them
      if (aiCues.length < 6) {
        setLoading(false)
        await generatePersonalizedCues(dogData, cueStats, customCues)
      } else {
        const allCues: Cue[] = existingCues!.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          instructions: c.instructions,
          success_looks_like: c.success_looks_like,
          if_struggling: c.if_struggling || 'Try a simpler version, or practice when your dog is more relaxed.',
          icon: c.icon || '⭐',
          isCustom: c.is_custom || false,
          isAiGenerated: c.is_ai_generated || false,
          priority: c.priority || 'medium',
          reason: c.reason || ''
        }))

        const cuesWithStatus = addStatusToCues(allCues, cueStats)
        setCues(cuesWithStatus)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const generatePersonalizedCues = async (
    dogData: Dog,
    cueStats: Record<string, { calm: number; total: number }>,
    existingCustomCues: any[] = []
  ) => {
    setGeneratingCues(true)

    try {
      const response = await fetch('/api/generate-cue-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dog: dogData })
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error generating cues:', data.error)
        setGeneratingCues(false)
        return
      }

      setPersonalizedMessage(data.personalized_message || '')

      const cuesToSave = data.cues.map((cue: any) => ({
        dog_id: dogData.id,
        name: cue.name,
        icon: cue.icon,
        instructions: cue.instructions,
        success_looks_like: cue.success_looks_like,
        if_struggling: cue.if_struggling,
        is_ai_generated: true,
        is_custom: false,
        priority: cue.priority,
        reason: cue.reason
      }))

      const { data: savedCues, error } = await supabase
        .from('custom_cues')
        .insert(cuesToSave)
        .select()

      if (error) {
        console.error('Error saving cues:', error)
      }

      const allCuesFromDB = [
        ...existingCustomCues.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          instructions: c.instructions,
          success_looks_like: c.success_looks_like,
          if_struggling: c.if_struggling || 'Try a simpler version.',
          icon: c.icon || '⭐',
          isCustom: true,
          isAiGenerated: false,
          priority: c.priority || 'high',
          reason: c.reason || ''
        })),
        ...(savedCues || []).map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          instructions: c.instructions,
          success_looks_like: c.success_looks_like,
          if_struggling: c.if_struggling,
          icon: c.icon,
          isCustom: false,
          isAiGenerated: true,
          priority: c.priority,
          reason: c.reason
        }))
      ]

      const cuesWithStatus = addStatusToCues(allCuesFromDB, cueStats)
      setCues(cuesWithStatus)
    } catch (error) {
      console.error('Error generating cues:', error)
    }

    setGeneratingCues(false)
  }

  const addStatusToCues = (allCues: Cue[], cueStats: Record<string, { calm: number; total: number }>): CueWithStatus[] => {
    return allCues.map(cue => {
      const stats = cueStats[cue.id] || { calm: 0, total: 0 }
      const calmRate = stats.total > 0 ? stats.calm / stats.total : 0

      let status: CueWithStatus['status'] = 'not-started'
      if (stats.total === 0) {
        status = 'not-started'
      } else if (stats.calm >= CALM_NEEDED_TO_MASTER && calmRate >= 0.7) {
        status = 'mastered'
      } else if (calmRate < 0.3 && stats.total >= 2) {
        status = 'stressful'
      } else {
        status = 'working-on'
      }

      return {
        ...cue,
        status,
        calmCount: stats.calm,
        totalCount: stats.total,
        calmNeeded: Math.max(0, CALM_NEEDED_TO_MASTER - stats.calm)
      }
    })
  }

  const handleSelectCue = (cue: CueWithStatus) => {
    setSelectedCue(cue)
    setShowResult(false)
    setLastResponse(null)
  }

  const handleLogResponse = async (response: 'calm' | 'noticed' | 'anxious') => {
    if (!selectedCue || !dog) return

    setSaving(true)
    setLastResponse(response)

    const { error } = await supabase
      .from('cue_practices')
      .insert({
        dog_id: dog.id,
        cues: [{
          cue_id: selectedCue.id,
          cue_name: selectedCue.name,
          response: response
        }]
      })

    if (error) {
      console.error('Error saving:', error)
      alert('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    setCues(prev => prev.map(cue => {
      if (cue.id !== selectedCue.id) return cue

      const newCalmCount = response === 'calm' ? cue.calmCount + 1 : cue.calmCount
      const newTotalCount = cue.totalCount + 1
      const calmRate = newCalmCount / newTotalCount

      let newStatus: CueWithStatus['status'] = cue.status
      if (newCalmCount >= CALM_NEEDED_TO_MASTER && calmRate >= 0.7) {
        newStatus = 'mastered'
      } else if (calmRate < 0.3 && newTotalCount >= 2) {
        newStatus = 'stressful'
      } else {
        newStatus = 'working-on'
      }

      return {
        ...cue,
        status: newStatus,
        calmCount: newCalmCount,
        totalCount: newTotalCount,
        calmNeeded: Math.max(0, CALM_NEEDED_TO_MASTER - newCalmCount)
      }
    }))

    setSelectedCue(prev => {
      if (!prev) return null
      const newCalmCount = response === 'calm' ? prev.calmCount + 1 : prev.calmCount
      const newTotalCount = prev.totalCount + 1
      return {
        ...prev,
        calmCount: newCalmCount,
        totalCount: newTotalCount,
        calmNeeded: Math.max(0, CALM_NEEDED_TO_MASTER - newCalmCount)
      }
    })

    setSaving(false)
    setShowResult(true)
  }

  const handleBackToList = () => {
    setSelectedCue(null)
    setShowResult(false)
    setLastResponse(null)
    loadData()
  }

  const handleGenerateCue = async () => {
    if (!newTriggerName.trim() || !dog) return

    setGeneratingCue(true)
    setGeneratedCue(null)

    try {
      const response = await fetch('/api/generate-cue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerName: newTriggerName,
          dogName: dog.name
        })
      })

      const data = await response.json()
      if (data.error) {
        alert('Failed to generate. Please try again.')
      } else {
        setGeneratedCue(data)
      }
    } catch (error) {
      console.error('Error generating cue:', error)
      alert('Failed to generate. Please try again.')
    }

    setGeneratingCue(false)
  }

  const handleSaveCue = async () => {
    if (!dog || !newTriggerName || !generatedCue) return

    setSavingCue(true)

    const { data: savedCue, error } = await supabase
      .from('custom_cues')
      .insert({
        dog_id: dog.id,
        name: newTriggerName,
        instructions: generatedCue.instructions,
        success_looks_like: generatedCue.success_looks_like,
        if_struggling: generatedCue.if_struggling,
        icon: '⭐',
        is_custom: true,
        is_ai_generated: false,
        priority: 'high'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding cue:', error)
      alert('Failed to add trigger. Please try again.')
      setSavingCue(false)
      return
    }

    if (savedCue) {
      const newCue: CueWithStatus = {
        id: savedCue.id.toString(),
        name: savedCue.name,
        instructions: savedCue.instructions,
        success_looks_like: savedCue.success_looks_like,
        if_struggling: savedCue.if_struggling,
        icon: '⭐',
        isCustom: true,
        isAiGenerated: false,
        priority: 'high',
        status: 'not-started',
        calmCount: 0,
        totalCount: 0,
        calmNeeded: CALM_NEEDED_TO_MASTER
      }
      setCues(prev => [newCue, ...prev])
    }

    setNewTriggerName('')
    setGeneratedCue(null)
    setShowAddCue(false)
    setSavingCue(false)
  }

  const getMasteredCount = () => cues.filter(c => c.status === 'mastered').length

  const sortedCues = [...cues].sort((a, b) => {
    if (a.isCustom && !b.isCustom) return -1
    if (!a.isCustom && b.isCustom) return 1
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1)
  })

  const customCues = sortedCues.filter(c => c.isCustom)
  const aiCues = sortedCues.filter(c => !c.isCustom)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-gray-700">Loading...</p>
      </div>
    )
  }

  if (generatingCues) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="animate-pulse">
            <span className="text-5xl mb-4 block">🧠</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Creating {dog?.name}'s Training Plan</h2>
            <p className="text-gray-600">
              Analyzing triggers and behaviors to build a personalized cue list...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Add custom cue form
  if (showAddCue) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { setShowAddCue(false); setNewTriggerName(''); setGeneratedCue(null); }}
            className="text-amber-700 hover:underline mb-6 block font-medium"
          >
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Add Custom Trigger</h1>
            <p className="text-gray-600 text-sm mb-6">
              What else triggers {dog?.name}'s anxiety?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  What's the trigger?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTriggerName}
                    onChange={(e) => { setNewTriggerName(e.target.value); setGeneratedCue(null); }}
                    placeholder="e.g., Grab laptop, Put on makeup"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleGenerateCue}
                    disabled={!newTriggerName.trim() || generatingCue}
                    className="bg-amber-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {generatingCue ? '...' : 'Go'}
                  </button>
                </div>
              </div>

              {generatingCue && (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <p className="text-2xl mb-2">🧠</p>
                    <p className="text-gray-600">Creating practice instructions...</p>
                  </div>
                </div>
              )}

              {generatedCue && (
                <div className="space-y-3">
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h2 className="font-semibold text-amber-900 mb-1 text-sm">📋 What to do:</h2>
                    <p className="text-amber-900 text-sm">{generatedCue.instructions}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <h2 className="font-semibold text-green-900 mb-1 text-sm">✅ Success looks like:</h2>
                    <p className="text-green-900 text-sm">{generatedCue.success_looks_like}</p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <h2 className="font-semibold text-blue-900 mb-1 text-sm">💡 If {dog?.name} struggles:</h2>
                    <p className="text-blue-900 text-sm">{generatedCue.if_struggling}</p>
                  </div>

                  <button
                    onClick={handleSaveCue}
                    disabled={savingCue}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-300"
                  >
                    {savingCue ? 'Adding...' : 'Add This Trigger'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Selected cue screen
  if (selectedCue) {
    if (showResult) {
      const justMastered = selectedCue.calmNeeded === 0 && lastResponse === 'calm'

      return (
        <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              {lastResponse === 'calm' && (
                <>
                  <span className="text-6xl mb-4 block">🎉</span>
                  <h1 className="text-2xl font-bold text-green-700 mb-2">
                    {justMastered ? 'Cue Mastered!' : 'Great Work!'}
                  </h1>
                  <p className="text-gray-700 mb-4">
                    {justMastered
                      ? `${dog?.name} has mastered "${selectedCue.name}"! That's ${getMasteredCount()} of 3 cues needed for absence training.`
                      : `${dog?.name} stayed calm! ${selectedCue.calmNeeded > 0 ? `${selectedCue.calmNeeded} more calm response${selectedCue.calmNeeded > 1 ? 's' : ''} to master this cue.` : ''}`
                    }
                  </p>
                  {justMastered && getMasteredCount() >= 3 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <p className="text-green-800 text-sm">
                        <strong>🚪 Absence Training Unlocked!</strong> {dog?.name} is ready to start real absence sessions.
                      </p>
                    </div>
                  )}
                </>
              )}
              {lastResponse === 'noticed' && (
                <>
                  <span className="text-6xl mb-4 block">👀</span>
                  <h1 className="text-2xl font-bold text-amber-700 mb-2">Progress!</h1>
                  <p className="text-gray-700 mb-4">
                    {dog?.name} noticed but didn't panic — that's okay! Keep practicing to build confidence.
                  </p>
                </>
              )}
              {lastResponse === 'anxious' && (
                <>
                  <span className="text-6xl mb-4 block">💙</span>
                  <h1 className="text-2xl font-bold text-blue-700 mb-2">That's Okay</h1>
                  <p className="text-gray-700 mb-4">
                    {dog?.name} found this stressful. Try the easier version next time, or practice at a calmer moment.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                    <p className="text-blue-800 text-sm">
                      <strong>Tip:</strong> {selectedCue.if_struggling}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-3 mt-6">
                <button
                  onClick={() => { setShowResult(false); setLastResponse(null); }}
                  className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition"
                >
                  Practice Again
                </button>
                <button
                  onClick={handleBackToList}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Choose Different Cue
                </button>
                <Link
                  href="/dashboard"
                  className="block w-full text-amber-700 py-2 text-sm hover:underline"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleBackToList}
            className="text-amber-700 hover:underline mb-6 block font-medium"
          >
            ← Back to all cues
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <span className="text-5xl mb-3 block">{selectedCue.icon}</span>
              <h1 className="text-2xl font-bold text-gray-900">{selectedCue.name}</h1>
              {selectedCue.isCustom && (
                <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Your trigger
                </span>
              )}
              {selectedCue.reason && !selectedCue.isCustom && (
                <p className="text-gray-500 text-xs mt-2 italic">{selectedCue.reason}</p>
              )}

              {selectedCue.totalCount > 0 && (
                <div className="mt-3 max-w-xs mx-auto">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-amber-700 font-medium">{selectedCue.calmCount}/{CALM_NEEDED_TO_MASTER} calm</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selectedCue.calmCount / CALM_NEEDED_TO_MASTER) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 rounded-xl p-4 mb-3">
              <h2 className="font-semibold text-amber-900 mb-1 text-sm">📋 What to do:</h2>
              <p className="text-amber-900 text-sm">{selectedCue.instructions}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-3">
              <h2 className="font-semibold text-green-900 mb-1 text-sm">✅ Success looks like:</h2>
              <p className="text-green-900 text-sm">{selectedCue.success_looks_like}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <h2 className="font-semibold text-blue-900 mb-1 text-sm">💡 If {dog?.name} struggles:</h2>
              <p className="text-blue-900 text-sm">{selectedCue.if_struggling}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-bold text-gray-900 mb-4 text-center">How did {dog?.name} respond?</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleLogResponse('calm')}
                disabled={saving}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition disabled:opacity-50"
              >
                <span className="text-3xl">😊</span>
                <div className="text-left">
                  <p className="font-semibold text-green-800">Calm</p>
                  <p className="text-green-700 text-sm">Stayed relaxed, no anxiety signs</p>
                </div>
              </button>
              <button
                onClick={() => handleLogResponse('noticed')}
                disabled={saving}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition disabled:opacity-50"
              >
                <span className="text-3xl">👀</span>
                <div className="text-left">
                  <p className="font-semibold text-amber-800">Noticed</p>
                  <p className="text-amber-700 text-sm">Looked up or followed, but no panic</p>
                </div>
              </button>
              <button
                onClick={() => handleLogResponse('anxious')}
                disabled={saving}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
              >
                <span className="text-3xl">😰</span>
                <div className="text-left">
                  <p className="font-semibold text-red-800">Anxious</p>
                  <p className="text-red-700 text-sm">Whining, pacing, or panicking</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Cue selection list
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-700 hover:underline font-medium">← Back to Dashboard</Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Practice a Cue</h1>
          <p className="text-gray-600">
            Pick one trigger to work on with {dog?.name}
          </p>
        </div>

        {/* Progress toward absence training */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress to absence training</p>
              <p className="font-bold text-gray-900">{getMasteredCount()}/3 cues mastered</p>
            </div>
            {getMasteredCount() >= 3 ? (
              <Link
                href="/mission"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                Start Session →
              </Link>
            ) : (
              <span className="text-2xl">🔒</span>
            )}
          </div>
        </div>

        {/* Add custom cue button */}
        <button
          onClick={() => setShowAddCue(true)}
          className="w-full bg-white rounded-xl p-4 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 transition text-left mb-4"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">➕</span>
            <div className="flex-1">
              <p className="font-semibold text-purple-700">Add Your Own Trigger</p>
              <p className="text-purple-600 text-sm">Something specific to {dog?.name}?</p>
            </div>
          </div>
        </button>

        {/* Custom cues (user-added) */}
        {customCues.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 px-1">
              ⭐ Your Triggers
            </p>
            <div className="space-y-2">
              {customCues.map(cue => (
                <button
                  key={cue.id}
                  onClick={() => handleSelectCue(cue)}
                  className="w-full bg-white rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{cue.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{cue.name}</p>
                      <p className="text-gray-600 text-sm">
                        {cue.status === 'mastered' && '🟢 Mastered'}
                        {cue.status === 'stressful' && '🔴 Needs work'}
                        {cue.status === 'working-on' && `🟡 ${cue.calmNeeded} more to master`}
                        {cue.status === 'not-started' && 'Not started yet'}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI-generated cues */}
        {aiCues.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                🧠 Recommended for {dog?.name}
              </p>
            </div>
            {personalizedMessage && (
              <p className="text-xs text-gray-500 mb-3 px-1 italic">
                {personalizedMessage}
              </p>
            )}
            <div className="space-y-2">
              {aiCues.map(cue => (
                <button
                  key={cue.id}
                  onClick={() => handleSelectCue(cue)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{cue.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{cue.name}</p>
                        {cue.priority === 'high' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Important</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {cue.status === 'mastered' && '🟢 Mastered'}
                        {cue.status === 'stressful' && '🔴 Needs work'}
                        {cue.status === 'working-on' && `🟡 ${cue.calmNeeded} more to master`}
                        {cue.status === 'not-started' && 'Not started yet'}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}