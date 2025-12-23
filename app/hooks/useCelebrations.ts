'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

type CelebrationType = 'first_session' | 'streak_3' | 'streak_7' | 'first_great' | null

export function useCelebrations(dogId: string | null) {
  const [celebration, setCelebration] = useState<CelebrationType>(null)

  useEffect(() => {
    if (!dogId) return

    const checkCelebrations = async () => {
      const shown = JSON.parse(localStorage.getItem('celebrationsShown') || '{}')

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false })

      if (!sessions) return

      // First session
      if (sessions.length === 1 && !shown.first_session) {
        setCelebration('first_session')
        shown.first_session = true
        localStorage.setItem('celebrationsShown', JSON.stringify(shown))
        return
      }

      // First great response
      const hasGreat = sessions.some(s => s.dog_response === 'great')
      if (hasGreat && !shown.first_great) {
        setCelebration('first_great')
        shown.first_great = true
        localStorage.setItem('celebrationsShown', JSON.stringify(shown))
        return
      }

      // Calculate streak
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const sessionDates = sessions.map(s => {
        const d = new Date(s.created_at)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
      const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)

      let streak = 0
      for (let i = 0; i < uniqueDates.length; i++) {
        const expected = new Date(today)
        expected.setDate(expected.getDate() - i)
        expected.setHours(0, 0, 0, 0)
        if (uniqueDates[i] === expected.getTime()) {
          streak++
        } else {
          break
        }
      }

      // 7-day streak
      if (streak >= 7 && !shown.streak_7) {
        setCelebration('streak_7')
        shown.streak_7 = true
        localStorage.setItem('celebrationsShown', JSON.stringify(shown))
        return
      }

      // 3-day streak
      if (streak >= 3 && !shown.streak_3) {
        setCelebration('streak_3')
        shown.streak_3 = true
        localStorage.setItem('celebrationsShown', JSON.stringify(shown))
        return
      }
    }

    checkCelebrations()
  }, [dogId])

  const clearCelebration = () => setCelebration(null)

  return { celebration, clearCelebration }
}