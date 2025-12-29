'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { X, ChevronRight } from 'lucide-react'

interface ProfileQuestion {
  id: string
  field: string
  question: string
  options?: { value: string; label: string }[]
  type: 'select' | 'boolean' | 'text'
}

const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: 'is_rescue',
    field: 'is_rescue',
    question: 'Is {dogName} a rescue?',
    type: 'boolean'
  },
  {
    id: 'anxiety_duration',
    field: 'anxiety_duration',
    question: 'How long has {dogName} struggled with being alone?',
    type: 'select',
    options: [
      { value: 'weeks', label: 'A few weeks' },
      { value: 'months', label: 'A few months' },
      { value: '1-2 years', label: '1-2 years' },
      { value: '2+ years', label: 'More than 2 years' },
      { value: 'always', label: 'Since we got them' }
    ]
  },
  {
    id: 'previous_training',
    field: 'previous_training',
    question: 'Have you tried any training methods before?',
    type: 'select',
    options: [
      { value: 'none', label: 'No, this is our first try' },
      { value: 'youtube', label: 'YouTube videos / articles' },
      { value: 'trainer', label: 'Worked with a trainer' },
      { value: 'medication', label: 'Medication only' },
      { value: 'multiple', label: 'Multiple things' }
    ]
  },
  {
    id: 'living_situation',
    field: 'living_situation',
    question: 'Where do you live?',
    type: 'select',
    options: [
      { value: 'apartment', label: 'Apartment / Condo' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'house', label: 'House' }
    ]
  },
  {
    id: 'leave_duration',
    field: 'leave_duration',
    question: 'What\'s your goal for how long {dogName} can be alone?',
    type: 'select',
    options: [
      { value: '1-2 hours', label: '1-2 hours' },
      { value: '3-4 hours', label: '3-4 hours' },
      { value: '4-6 hours', label: '4-6 hours (half day)' },
      { value: '8+ hours', label: '8+ hours (full workday)' }
    ]
  },
  {
    id: 'other_pets',
    field: 'other_pets',
    question: 'Does {dogName} live with other pets?',
    type: 'boolean'
  },
  {
    id: 'recent_changes',
    field: 'recent_changes',
    question: 'Any recent changes that might have affected {dogName}?',
    type: 'select',
    options: [
      { value: 'none', label: 'No major changes' },
      { value: 'move', label: 'We recently moved' },
      { value: 'schedule', label: 'My schedule changed' },
      { value: 'family', label: 'Family change (new baby, divorce, etc.)' },
      { value: 'loss', label: 'Lost a family member or pet' },
      { value: 'other', label: 'Something else' }
    ]
  }
]

// Show after this many sessions
const SESSION_THRESHOLD = 5

interface DogProfileCardProps {
  dogId: string | number
  dogName: string
}

export default function DogProfileCard({ dogId, dogName }: DogProfileCardProps) {
  const [currentQuestion, setCurrentQuestion] = useState<ProfileQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkForUnansweredQuestions()
  }, [dogId])

  const checkForUnansweredQuestions = async () => {
    if (!dogId) return

    // Check session count
    const { count } = await supabase
      .from('cue_practices')
      .select('id', { count: 'exact', head: true })
      .eq('dog_id', dogId)

    if (!count || count < SESSION_THRESHOLD) {
      setLoading(false)
      return // Not enough sessions yet
    }

    // Get current dog profile
    const { data: dog } = await supabase
      .from('dogs')
      .select('is_rescue, anxiety_duration, previous_training, living_situation, leave_duration, other_pets, recent_changes')
      .eq('id', dogId)
      .single()

    if (!dog) {
      setLoading(false)
      return
    }

    // Find first unanswered question
    for (const q of PROFILE_QUESTIONS) {
      const value = dog[q.field as keyof typeof dog]
      if (value === null || value === undefined) {
        setCurrentQuestion(q)
        break
      }
    }

    setLoading(false)
  }

  const handleAnswer = async (value: string | boolean) => {
    if (!currentQuestion || !dogId) return

    setSaving(true)

    const { error } = await supabase
      .from('dogs')
      .update({ [currentQuestion.field]: value })
      .eq('id', dogId)

    if (!error) {
      // Check for next unanswered question
      setCurrentQuestion(null)
      checkForUnansweredQuestions()
    }

    setSaving(false)
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (loading || !currentQuestion || dismissed) {
    return null
  }

  const questionText = currentQuestion.question.replace('{dogName}', dogName)

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="text-xs text-indigo-600 font-medium mb-1">Help us help {dogName}</p>
      <p className="text-gray-800 font-medium mb-3">{questionText}</p>

      {currentQuestion.type === 'boolean' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAnswer(true)}
            disabled={saving}
            className="flex-1 py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Yes
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={saving}
            className="flex-1 py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            No
          </button>
        </div>
      )}

      {currentQuestion.type === 'select' && currentQuestion.options && (
        <div className="space-y-2">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              disabled={saving}
              className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm text-left text-gray-700 hover:bg-gray-50 hover:border-indigo-300 disabled:opacity-50 flex items-center justify-between"
            >
              {option.label}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3 text-center">
        This helps us give you better tips
      </p>
    </div>
  )
}