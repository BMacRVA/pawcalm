'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

const departureCues = [
  { id: 'keys', name: 'Pick up keys', icon: '🔑', description: 'Pick up your keys, hold them for a moment, then put them down.' },
  { id: 'shoes', name: 'Put on shoes', icon: '👟', description: 'Put on your shoes, walk around briefly, then take them off.' },
  { id: 'coat', name: 'Put on coat', icon: '🧥', description: 'Put on your coat or jacket, stand by the door, then take it off.' },
  { id: 'bag', name: 'Pick up bag', icon: '👜', description: 'Pick up your purse, backpack, or work bag and carry it around.' },
  { id: 'door_touch', name: 'Touch door handle', icon: '🚪', description: 'Walk to the door and touch the handle without opening it.' },
  { id: 'door_open', name: 'Open door slightly', icon: '🚪', description: 'Open the door a few inches, pause, then close it.' },
  { id: 'wallet', name: 'Pick up wallet', icon: '👛', description: 'Pick up your wallet and put it in your pocket, then remove it.' },
  { id: 'phone', name: 'Check phone by door', icon: '📱', description: 'Walk to the door while looking at your phone, then walk away.' },
  { id: 'window', name: 'Look out window', icon: '🪟', description: 'Look out the window near your door as if checking the weather.' },
  { id: 'alarm', name: 'Touch alarm/lock', icon: '🔒', description: 'Touch your alarm panel or smart lock without activating it.' },
  { id: 'goodbye', name: 'Say goodbye phrase', icon: '👋', description: 'Say your usual goodbye phrase, then sit back down.' },
  { id: 'lights', name: 'Turn off lights', icon: '💡', description: 'Turn off a light you usually turn off when leaving, then turn it back on.' },
  { id: 'tv', name: 'Turn off TV', icon: '📺', description: 'Turn off the TV or radio, wait a moment, then turn it back on.' },
  { id: 'coffee', name: 'Rinse coffee cup', icon: '☕', description: 'Rinse out your coffee cup like you do before leaving.' },
  { id: 'stretch', name: 'Stretch by door', icon: '🙆', description: 'Do your pre-walk stretch routine near the door.' }
]

type CueResponse = 'calm' | 'noticed' | 'anxious' | null

export default function DeparturePracticePage() {
  const [dogName, setDogName] = useState('')
  const [dogId, setDogId] = useState<string | null>(null)
  const [currentCues, setCurrentCues] = useState<typeof departureCues>([])
  const [responses, setResponses] = useState<Record<string, CueResponse>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadDogAndGenerateCues()
  }, [])

  const loadDogAndGenerateCues = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dog) {
      setDogName(dog.name)
      setDogId(dog.id)
    }
    
    generateCues()
  }

  const generateCues = () => {
    const shuffled = [...departureCues].sort(() => Math.random() - 0.5)
    setCurrentCues(shuffled.slice(0, 5))
    setResponses({})
    setSaved(false)
  }

  const setResponse = (cueId: string, response: CueResponse) => {
    setResponses(prev => ({ ...prev, [cueId]: response }))
  }

  const answeredCount = Object.keys(responses).length
  const hasAnyAnswers = answeredCount > 0

  const saveResults = async () => {
    if (!dogId || !hasAnyAnswers) return
    setSaving(true)

    const cueResults = currentCues
      .filter(cue => responses[cue.id])
      .map(cue => ({
        cue_id: cue.id,
        cue_name: cue.name,
        response: responses[cue.id]
      }))

    await supabase.from('cue_practices').insert({
      dog_id: dogId,
      cues: cueResults,
      created_at: new Date().toISOString()
    })

    setSaving(false)
    setSaved(true)
  }

  const getResponseCounts = () => {
    const counts = { calm: 0, noticed: 0, anxious: 0 }
    Object.values(responses).forEach(r => {
      if (r) counts[r]++
    })
    return counts
  }

  const counts = getResponseCounts()

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🚪</span>
          <h1 className="text-2xl font-bold text-amber-950 mb-1">Departure Cue Practice</h1>
          <p className="text-amber-800/70 text-sm">
            Do any cues you have time for. Rate how {dogName || 'your dog'} reacted.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-800 text-sm">Completed</span>
            <span className="font-bold text-amber-950">{answeredCount} / {currentCues.length}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / currentCues.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Cue list */}
        <div className="space-y-4 mb-6">
          {currentCues.map((cue) => (
            <div
              key={cue.id}
              className={`p-4 rounded-xl border-2 transition ${
                responses[cue.id]
                  ? responses[cue.id] === 'calm' 
                    ? 'bg-green-50 border-green-400'
                    : responses[cue.id] === 'noticed'
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-red-50 border-red-400'
                  : 'bg-white border-amber-200'
              }`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                  responses[cue.id] ? 'bg-white' : 'bg-amber-100'
                }`}>
                  {cue.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-950">{cue.name}</h3>
                  <p className="text-sm text-amber-700/70">{cue.description}</p>
                </div>
              </div>
              
              {/* Response buttons */}
              <div className="flex gap-2 ml-14">
                <button
                  onClick={() => setResponse(cue.id, 'calm')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    responses[cue.id] === 'calm'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  😌 Calm
                </button>
                <button
                  onClick={() => setResponse(cue.id, 'noticed')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    responses[cue.id] === 'noticed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  👀 Noticed
                </button>
                <button
                  onClick={() => setResponse(cue.id, 'anxious')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    responses[cue.id] === 'anxious'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  😰 Anxious
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save button - shows when at least one answered */}
        {hasAnyAnswers && !saved && (
          <div className="bg-white border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 text-center p-2 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{counts.calm}</p>
                <p className="text-xs text-green-700">Calm</p>
              </div>
              <div className="flex-1 text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{counts.noticed}</p>
                <p className="text-xs text-amber-700">Noticed</p>
              </div>
              <div className="flex-1 text-center p-2 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{counts.anxious}</p>
                <p className="text-xs text-red-700">Anxious</p>
              </div>
            </div>
            <button
              onClick={saveResults}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-amber-400"
            >
              {saving ? 'Saving...' : `Save ${answeredCount} Cue${answeredCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-4">
            <span className="text-4xl mb-2 block">🎉</span>
            <h2 className="text-xl font-bold text-green-900 mb-2">Saved!</h2>
            <p className="text-green-800 text-sm mb-1">
              {counts.anxious === 0 ? `Great! No anxious reactions.` :
               counts.anxious === 1 ? `Good data — we identified 1 trigger.` :
               `Good data — we identified ${counts.anxious} triggers.`}
            </p>
            <p className="text-green-700 text-xs">
              Even 1-2 cues per day helps!
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generateCues}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-medium transition"
          >
            Shuffle
          </button>
          {saved && (
            <button
              onClick={generateCues}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition"
            >
              Practice More →
            </button>
          )}
        </div>

        {/* Tip */}
        {!hasAnyAnswers && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>💡 Tip:</strong> Even practicing 1-2 cues helps! Do the action, watch {dogName || 'your dog'}, then tap their reaction.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}