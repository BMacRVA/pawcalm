'use client'

import { useState } from 'react'
import { supabase } from '../supabase'
import { X } from 'lucide-react'

type ProgressRating = 'much_harder' | 'bit_harder' | 'same' | 'bit_easier' | 'much_easier'
type OwnerFeeling = 'frustrated' | 'meh' | 'hopeful' | 'confident'

interface WeeklyCheckinCardProps {
  dogId: string | number
  dogName: string
  onComplete: () => void
  onDismiss: () => void
}

const progressOptions: { value: ProgressRating; label: string }[] = [
  { value: 'much_harder', label: 'Much harder' },
  { value: 'bit_harder', label: 'A bit harder' },
  { value: 'same', label: 'About the same' },
  { value: 'bit_easier', label: 'A bit easier' },
  { value: 'much_easier', label: 'Much easier' },
]

const feelingOptions: { value: OwnerFeeling; emoji: string; label: string }[] = [
  { value: 'frustrated', emoji: '😩', label: 'Frustrated' },
  { value: 'meh', emoji: '😐', label: 'Meh' },
  { value: 'hopeful', emoji: '🙂', label: 'Hopeful' },
  { value: 'confident', emoji: '💪', label: 'Confident' },
]

export default function WeeklyCheckinCard({ 
  dogId, 
  dogName, 
  onComplete, 
  onDismiss 
}: WeeklyCheckinCardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [progressRating, setProgressRating] = useState<ProgressRating | null>(null)
  const [ownerFeeling, setOwnerFeeling] = useState<OwnerFeeling | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleProgressSelect = (rating: ProgressRating) => {
    setProgressRating(rating)
    setStep(2)
  }

  const handleFeelingSelect = (feeling: OwnerFeeling) => {
    setOwnerFeeling(feeling)
    setStep(3)
  }

  const handleSubmit = async () => {
    if (!progressRating || !ownerFeeling) return

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    // Get the Sunday of the current week
    const now = new Date()
    const dayOfWeek = now.getDay()
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - dayOfWeek)
    const weekOf = sunday.toISOString().split('T')[0]

    await supabase.from('weekly_checkins').insert({
      dog_id: dogId,
      user_id: user?.id,
      week_of: weekOf,
      progress_rating: progressRating,
      owner_feeling: ownerFeeling,
      note: note.trim() || null,
    })

    setSubmitting(false)
    onComplete()
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-amber-50 rounded-2xl p-5 shadow-sm border border-purple-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Weekly Check-in</h3>
          <p className="text-sm text-gray-500">How&apos;s training going with {dogName}?</p>
        </div>
        <button 
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step 1: Progress Rating */}
      {step === 1 && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Compared to last week, leaving the house feels:
          </p>
          <div className="space-y-2">
            {progressOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleProgressSelect(option.value)}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition text-left ${
                  progressRating === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Owner Feeling */}
      {step === 2 && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            How are YOU feeling about training?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {feelingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFeelingSelect(option.value)}
                className={`flex flex-col items-center py-3 px-2 rounded-xl transition ${
                  ownerFeeling === option.value
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-white border-2 border-gray-200 hover:bg-purple-50'
                }`}
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-xs text-gray-600">{option.label}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setStep(1)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3: Optional Note + Submit */}
      {step === 3 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Anything you want to share? (optional)
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Wins, struggles, questions..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium text-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Submit Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}