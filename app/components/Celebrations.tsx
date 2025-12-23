'use client'

import { useState, useEffect } from 'react'

type CelebrationType = 'first_session' | 'streak_3' | 'streak_7' | 'first_great' | null

export default function Celebration({ type, dogName, onClose }: { type: CelebrationType; dogName: string; onClose: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (type) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [type, onClose])

  if (!show || !type) return null

  const celebrations = {
    first_session: {
      emoji: '🎉',
      title: 'You did it!',
      message: `You completed your first session with ${dogName}. That's the hardest part — showing up. You're already ahead of most people.`
    },
    streak_3: {
      emoji: '🔥',
      title: '3-Day Streak!',
      message: `Three days in a row! You're building a habit. ${dogName} is starting to learn the routine.`
    },
    streak_7: {
      emoji: '🏆',
      title: 'One Week Streak!',
      message: `Most people quit by now. Not you. ${dogName} is lucky to have someone so committed.`
    },
    first_great: {
      emoji: '⭐',
      title: `${dogName} had a great session!`,
      message: `This is what progress looks like. ${dogName} is responding to your work. Keep it up!`
    }
  }

  const celebration = celebrations[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in duration-300">
        <div className="text-6xl mb-4">{celebration.emoji}</div>
        <h2 className="text-2xl font-bold text-amber-950 mb-2">{celebration.title}</h2>
        <p className="text-amber-800/70 mb-6">{celebration.message}</p>
        <button
          onClick={onClose}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Keep Going →
        </button>
      </div>
    </div>
  )
}