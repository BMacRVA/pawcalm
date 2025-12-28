'use client'

import { useState } from 'react'

type Rating = 'tough' | 'okay' | 'good' | 'great'

interface SessionRatingProps {
  onRate: (rating: Rating) => void
  dogName?: string
  loading?: boolean
}

const ratingOptions: { value: Rating; emoji: string; label: string }[] = [
  { value: 'tough', emoji: '😟', label: 'Tough' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'great', emoji: '🎉', label: 'Great' },
]

export default function SessionRating({ onRate, dogName, loading }: SessionRatingProps) {
  const [selected, setSelected] = useState<Rating | null>(null)

  const handleSelect = (rating: Rating) => {
    setSelected(rating)
    onRate(rating)
  }

  return (
    <div className="w-full max-w-xs">
      <p className="text-gray-600 text-center mb-4">
        How did that session feel{dogName ? ` with ${dogName}` : ''}?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {ratingOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={loading}
            className={`flex flex-col items-center py-3 px-2 rounded-xl transition ${
              selected === option.value
                ? 'bg-amber-100 border-2 border-amber-500'
                : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-2xl mb-1">{option.emoji}</span>
            <span className="text-xs text-gray-600">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}