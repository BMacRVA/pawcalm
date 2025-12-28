'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { getProgressInsight, ProgressData, ProgressInsight } from '../lib/progressInsights'

interface ProgressInsightCardProps {
  dogId: string | number
  dogName: string
}

export default function ProgressInsightCard({ dogId, dogName }: ProgressInsightCardProps) {
  const [insight, setInsight] = useState<ProgressInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsightData()
  }, [dogId])

  const loadInsightData = async () => {
    if (!dogId) return

    const now = new Date()
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay())
    startOfThisWeek.setHours(0, 0, 0, 0)

    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    // Get this week's practices with ratings
    const { data: thisWeekPractices } = await supabase
      .from('cue_practices')
      .select('session_rating, cues')
      .eq('dog_id', dogId)
      .gte('created_at', startOfThisWeek.toISOString())

    // Get last week's practices with ratings
    const { data: lastWeekPractices } = await supabase
      .from('cue_practices')
      .select('session_rating, cues')
      .eq('dog_id', dogId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lt('created_at', startOfThisWeek.toISOString())

    // Get all practices for total count and first practice date
    const { data: allPractices, count: totalCount } = await supabase
      .from('cue_practices')
      .select('created_at, session_rating, cues', { count: 'exact' })
      .eq('dog_id', dogId)
      .order('created_at', { ascending: true })

    // Get first week's practices (for before/after comparison)
    let firstWeekResponses: ('calm' | 'noticed' | 'anxious')[] = []
    if (allPractices && allPractices.length > 0) {
      const firstPracticeDate = new Date(allPractices[0].created_at)
      const endOfFirstWeek = new Date(firstPracticeDate)
      endOfFirstWeek.setDate(endOfFirstWeek.getDate() + 7)
      
      const firstWeekPractices = allPractices.filter(p => 
        new Date(p.created_at) < endOfFirstWeek
      )
      
      firstWeekPractices.forEach(p => {
        p.cues?.forEach((c: any) => {
          if (c.response) firstWeekResponses.push(c.response)
        })
      })
    }

    // Get cues for mastery count and improvement tracking
    const { data: cuesData } = await supabase
      .from('custom_cues')
      .select('id, name, calm_count, total_practices')
      .eq('dog_id', dogId)

    // Calculate best cue improvement
    let bestCueImprovement: ProgressData['bestCueImprovement'] = undefined
    if (cuesData && allPractices) {
      for (const cue of cuesData) {
        if ((cue.total_practices || 0) < 5) continue
        
        // Get first 3 responses for this cue
        const cueResponses: string[] = []
        for (const practice of allPractices) {
          practice.cues?.forEach((c: any) => {
            if (c.cue_id === cue.id && c.response) {
              cueResponses.push(c.response)
            }
          })
        }
        
        if (cueResponses.length < 5) continue
        
        const firstThree = cueResponses.slice(0, 3)
        const lastThree = cueResponses.slice(-3)
        
        const startCalmRate = Math.round((firstThree.filter(r => r === 'calm').length / 3) * 100)
        const currentCalmRate = Math.round((lastThree.filter(r => r === 'calm').length / 3) * 100)
        
        const improvement = currentCalmRate - startCalmRate
        
        if (!bestCueImprovement || improvement > (bestCueImprovement.currentCalmRate - bestCueImprovement.startCalmRate)) {
          bestCueImprovement = {
            name: cue.name,
            startCalmRate,
            currentCalmRate,
            practiceCount: cue.total_practices || 0
          }
        }
      }
    }

    // Calculate streak
    const { data: recentDays } = await supabase
      .from('cue_practices')
      .select('created_at')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(30)

    let currentStreak = 0
    let longestStreak = 0
    if (recentDays && recentDays.length > 0) {
      const days = new Set(recentDays.map(p => p.created_at.split('T')[0]))
      const today = new Date().toISOString().split('T')[0]
      const checkDate = new Date()
      
      if (days.has(today)) {
        currentStreak = 1
        checkDate.setDate(checkDate.getDate() - 1)
      }
      
      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (days.has(dateStr)) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
      
      // Simple longest streak calculation (could be more accurate)
      longestStreak = Math.max(currentStreak, longestStreak)
    }

    // Extract ratings
    const thisWeekRatings = (thisWeekPractices || [])
      .filter(p => p.session_rating)
      .map(p => p.session_rating as 'tough' | 'okay' | 'good' | 'great')

    const lastWeekRatings = (lastWeekPractices || [])
      .filter(p => p.session_rating)
      .map(p => p.session_rating as 'tough' | 'okay' | 'good' | 'great')

    // Extract dog responses
    const thisWeekResponses: ('calm' | 'noticed' | 'anxious')[] = []
    ;(thisWeekPractices || []).forEach(p => {
      p.cues?.forEach((c: any) => {
        if (c.response) thisWeekResponses.push(c.response)
      })
    })

    const lastWeekResponses: ('calm' | 'noticed' | 'anxious')[] = []
    ;(lastWeekPractices || []).forEach(p => {
      p.cues?.forEach((c: any) => {
        if (c.response) lastWeekResponses.push(c.response)
      })
    })

    // Check for first great ever
    const allRatings = (allPractices || []).map(p => p.session_rating).filter(Boolean)
    const hadGreatThisWeek = thisWeekRatings.includes('great')
    const greatBeforeThisWeek = allRatings.slice(0, -thisWeekRatings.length).includes('great')
    const isFirstGreatEver = hadGreatThisWeek && !greatBeforeThisWeek

    // Calculate days since start
    let daysSinceStart = 0
    if (allPractices && allPractices.length > 0) {
      const firstPractice = new Date(allPractices[0].created_at)
      daysSinceStart = Math.floor((now.getTime() - firstPractice.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Cues mastered
    const cuesMastered = (cuesData || []).filter(c => (c.calm_count || 0) >= 5).length
    const totalCues = (cuesData || []).length

    // Total practices (individual cue practices, not sessions)
    let totalPractices = 0
    ;(allPractices || []).forEach(p => {
      totalPractices += (p.cues?.length || 0)
    })

    const progressData: ProgressData = {
      thisWeekRatings,
      lastWeekRatings,
      thisWeekResponses,
      lastWeekResponses,
      firstWeekResponses,
      currentStreak,
      longestStreak,
      totalSessions: totalCount || 0,
      cuesMastered,
      totalCues,
      daysSinceStart,
      hadGreatThisWeek,
      isFirstGreatEver,
      totalPractices,
      bestCueImprovement,
    }

    const insight = getProgressInsight(progressData, dogName)
    setInsight(insight)
    setLoading(false)
  }

  if (loading || !insight) {
    return null // Don't show anything while loading
  }

  const bgColor = {
    celebration: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
    encouragement: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
    trend: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
    milestone: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200',
    reassurance: 'bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200',
    proof: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200',
  }[insight.type]

  return (
    <div className={`rounded-xl p-4 border ${bgColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{insight.emoji}</span>
        <p className="text-gray-800 font-medium">{insight.message}</p>
      </div>
    </div>
  )
}