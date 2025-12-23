'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type Dog = {
  id: string
  name: string
  baseline: number
}

type MissionContext = {
  title: string
  targetMinutes: number
  steps: string[]
  successLooksLike: string
  ownerMood: string
  ownerEnergy: string
}

export default function LogSessionPage() {
  const [dog, setDog] = useState<Dog | null>(null)
  const [mission, setMission] = useState<MissionContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Dynamic form fields based on mission
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([])
  const [dogResponse, setDogResponse] = useState<string | null>(null)
  const [ownerFeeling, setOwnerFeeling] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null)

  useEffect(() => {
    fetchDog()
    loadMissionContext()
  }, [])

  const fetchDog = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    if (data) setDog(data)
  }

  const loadMissionContext = () => {
    const stored = localStorage.getItem('currentMission')
    if (stored) {
      const parsed = JSON.parse(stored)
      setMission(parsed)
      setCompletedSteps(new Array(parsed.steps?.length || 0).fill(false))
    }
  }

  const toggleStep = (index: number) => {
    const updated = [...completedSteps]
    updated[index] = !updated[index]
    setCompletedSteps(updated)
  }

  const calculateSuccess = () => {
    const stepsCompleted = completedSteps.filter(Boolean).length
    const totalSteps = completedSteps.length
    const completionRate = totalSteps > 0 ? stepsCompleted / totalSteps : 0
    
    if (dogResponse === 'great' && completionRate >= 0.8) return 'success'
    if (dogResponse === 'struggled' || completionRate < 0.3) return 'needs_work'
    return 'partial'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const stepsCompleted = completedSteps.filter(Boolean).length
    const outcome = calculateSuccess()

    const { error } = await supabase
      .from('sessions')
      .insert([{
        user_id: user?.id,
        dog_id: dog?.id,
        mission_title: mission?.title || 'Quick Session',
        mission_steps: mission?.steps || [],
        target_duration: mission?.targetMinutes || 5,
        duration: mission?.targetMinutes || 5, // Could add actual timing later
        steps_completed: stepsCompleted,
        steps_total: completedSteps.length,
        dog_response: dogResponse,
        owner_feeling: ownerFeeling,
        owner_mood_before: mission?.ownerMood,
        owner_energy_before: mission?.ownerEnergy,
        outcome: outcome,
        would_repeat: wouldRepeat,
        notes: notes,
        stress_level: dogResponse === 'great' ? 2 : dogResponse === 'okay' ? 5 : 8,
        success: outcome === 'success'
      }])

    setLoading(false)

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      localStorage.removeItem('currentMission')
      setSaved(true)
    }
  }

  if (saved) {
    const outcome = calculateSuccess()
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">
            {outcome === 'success' && '🎉'}
            {outcome === 'partial' && '👍'}
            {outcome === 'needs_work' && '💪'}
          </div>
          <h1 className="text-2xl font-bold text-amber-950 mb-2">
            {outcome === 'success' && 'Amazing Work!'}
            {outcome === 'partial' && 'Good Progress!'}
            {outcome === 'needs_work' && 'Keep Going!'}
          </h1>
          <p className="text-amber-800/70 mb-6">
            {outcome === 'success' && `${dog?.name} is making great strides! Keep up the consistency.`}
            {outcome === 'partial' && `Every session counts. ${dog?.name} is learning!`}
            {outcome === 'needs_work' && `Tough sessions happen. Tomorrow is a new day for ${dog?.name}.`}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/progress'}
              className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition"
            >
              View Progress
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-amber-100 text-amber-800 py-3 rounded-xl font-semibold hover:bg-amber-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <a href="/mission" className="text-amber-600 hover:underline">← Back to Mission</a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Mission Header */}
          {mission && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 mb-6 text-white">
              <p className="text-amber-100 text-sm">Logging session for:</p>
              <h2 className="text-xl font-bold">{mission.title}</h2>
            </div>
          )}

          <h1 className="text-2xl font-bold text-amber-950 mb-2">
            How did it go?
          </h1>
          <p className="text-amber-800/70 mb-6">
            Quick check-in for {dog?.name}'s session
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Checklist */}
            {mission?.steps && mission.steps.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-3">
                  Which steps did you complete?
                </label>
                <div className="space-y-2">
                  {mission.steps.map((step, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleStep(i)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition flex items-start gap-3 ${
                        completedSteps[i]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                        completedSteps[i] 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {completedSteps[i] ? '✓' : i + 1}
                      </span>
                      <span className={`text-sm ${completedSteps[i] ? 'text-green-800' : 'text-gray-700'}`}>
                        {step}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-amber-600 mt-2">
                  {completedSteps.filter(Boolean).length} of {completedSteps.length} steps completed
                </p>
              </div>
            )}

            {/* Dog's Response */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-3">
                How did {dog?.name} respond?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: '🌟', label: 'Great!', value: 'great' },
                  { emoji: '😐', label: 'Okay', value: 'okay' },
                  { emoji: '😰', label: 'Struggled', value: 'struggled' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDogResponse(item.value)}
                    className={`flex flex-col items-center p-4 rounded-xl transition ${
                      dogResponse === item.value
                        ? 'bg-amber-100 border-2 border-amber-500'
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span className={`text-sm ${dogResponse === item.value ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Owner Feeling */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-3">
                How do YOU feel after this session?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { emoji: '😓', label: 'Frustrated', value: 'frustrated' },
                  { emoji: '😐', label: 'Neutral', value: 'neutral' },
                  { emoji: '😊', label: 'Hopeful', value: 'hopeful' },
                  { emoji: '🎉', label: 'Proud', value: 'proud' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setOwnerFeeling(item.value)}
                    className={`flex flex-col items-center p-3 rounded-xl transition ${
                      ownerFeeling === item.value
                        ? 'bg-amber-100 border-2 border-amber-500'
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-xl mb-1">{item.emoji}</span>
                    <span className={`text-xs ${ownerFeeling === item.value ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Would Repeat */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-3">
                Would you do this mission again?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWouldRepeat(true)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    wouldRepeat === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  👍 Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRepeat(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    wouldRepeat === false
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔄 Try something new
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Any notes? (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`What did you notice about ${dog?.name}? Any breakthroughs or challenges?`}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-amber-950 bg-white placeholder-amber-300"
                rows={3}
              />
            </div>

            {/* Encouragement based on responses */}
            {dogResponse === 'struggled' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  <strong>That's okay!</strong> Setbacks are normal and actually help us learn. 
                  Tomorrow's mission will be adjusted based on today. You're doing great by showing up. 💙
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !dogResponse || !ownerFeeling}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-semibold hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}