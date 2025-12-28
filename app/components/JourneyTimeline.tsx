'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type MilestoneType = 
  | 'start' 
  | 'mastery' 
  | 'streak' 
  | 'first_great' 
  | 'first_absence' 
  | 'absence_milestone'
  | 'week_complete'

type Milestone = {
  id: string
  type: MilestoneType
  title: string
  date: Date
  emoji: string
}

interface JourneyTimelineProps {
  dogId: string | number
  dogName: string
}

export default function JourneyTimeline({ dogId, dogName }: JourneyTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMilestones()
  }, [dogId])

  const loadMilestones = async () => {
    if (!dogId) return

    const allMilestones: Milestone[] = []

    // 1. Get first practice date (start of journey)
    const { data: firstPractice } = await supabase
      .from('cue_practices')
      .select('created_at')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (firstPractice) {
      allMilestones.push({
        id: 'start',
        type: 'start',
        title: `Started training with ${dogName}`,
        date: new Date(firstPractice.created_at),
        emoji: '🌱'
      })
    }

    // 2. Get mastered cues
    const { data: masteredCues } = await supabase
      .from('custom_cues')
      .select('id, name, mastered_at')
      .eq('dog_id', dogId)
      .not('mastered_at', 'is', null)
      .order('mastered_at', { ascending: true })

    if (masteredCues) {
      masteredCues.forEach(cue => {
        allMilestones.push({
          id: `mastery-${cue.id}`,
          type: 'mastery',
          title: `Mastered "${cue.name}"`,
          date: new Date(cue.mastered_at),
          emoji: '🏆'
        })
      })
    }

    // 3. Get first "great" rating
    const { data: firstGreat } = await supabase
      .from('cue_practices')
      .select('created_at')
      .eq('dog_id', dogId)
      .eq('session_rating', 'great')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (firstGreat) {
      allMilestones.push({
        id: 'first-great',
        type: 'first_great',
        title: 'First "great" session!',
        date: new Date(firstGreat.created_at),
        emoji: '🎉'
      })
    }

    // 4. Get first absence session
    const { data: firstAbsence } = await supabase
      .from('absence_sessions')
      .select('created_at, duration')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (firstAbsence) {
      allMilestones.push({
        id: 'first-absence',
        type: 'first_absence',
        title: 'First absence practice!',
        date: new Date(firstAbsence.created_at),
        emoji: '🚪'
      })
    }

    // 5. Get longest calm absence session (if > 5 min)
    const { data: longestAbsence } = await supabase
      .from('absence_sessions')
      .select('created_at, duration')
      .eq('dog_id', dogId)
      .eq('response', 'calm')
      .order('duration', { ascending: false })
      .limit(1)
      .single()

    if (longestAbsence && longestAbsence.duration >= 300) {
      const mins = Math.floor(longestAbsence.duration / 60)
      allMilestones.push({
        id: 'longest-absence',
        type: 'absence_milestone',
        title: `${mins} minute calm absence!`,
        date: new Date(longestAbsence.created_at),
        emoji: '⭐'
      })
    }

    // 6. Check for streak milestones (7 days, 14 days, 30 days)
    const { data: allPractices } = await supabase
      .from('cue_practices')
      .select('created_at')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: true })

    if (allPractices && allPractices.length > 0) {
      // Group practices by date
      const practicesByDate = new Map<string, Date>()
      allPractices.forEach(p => {
        const dateStr = p.created_at.split('T')[0]
        if (!practicesByDate.has(dateStr)) {
          practicesByDate.set(dateStr, new Date(p.created_at))
        }
      })

      const sortedDates = Array.from(practicesByDate.keys()).sort()
      
      // Find streak milestones
      let currentStreak = 1
      let maxStreakReached = 0
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          currentStreak++
          
          // Check for milestone streaks
          if (currentStreak === 7 && maxStreakReached < 7) {
            maxStreakReached = 7
            allMilestones.push({
              id: 'streak-7',
              type: 'streak',
              title: '7 day streak!',
              date: currDate,
              emoji: '🔥'
            })
          }
          if (currentStreak === 14 && maxStreakReached < 14) {
            maxStreakReached = 14
            allMilestones.push({
              id: 'streak-14',
              type: 'streak',
              title: '14 day streak!',
              date: currDate,
              emoji: '🔥'
            })
          }
          if (currentStreak === 30 && maxStreakReached < 30) {
            maxStreakReached = 30
            allMilestones.push({
              id: 'streak-30',
              type: 'streak',
              title: '30 day streak!',
              date: currDate,
              emoji: '👑'
            })
          }
        } else {
          currentStreak = 1
        }
      }
    }

    // Sort by date descending (most recent first)
    allMilestones.sort((a, b) => b.date.getTime() - a.date.getTime())

    setMilestones(allMilestones)
    setLoading(false)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded-lg" />
            <div className="h-12 bg-gray-100 rounded-lg" />
            <div className="h-12 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Your Journey
        </h2>
        <div className="text-center py-4">
          <span className="text-3xl mb-2 block">🌱</span>
          <p className="text-gray-500 text-sm">
            Complete your first practice to start your journey!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Your Journey
      </h2>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
        
        {/* Milestones */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-start gap-4 relative">
              {/* Dot/emoji on timeline */}
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-lg z-10">
                {milestone.emoji}
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-1">
                <p className="text-gray-900 font-medium text-sm">
                  {milestone.title}
                </p>
                <p className="text-gray-400 text-xs">
                  {formatDate(milestone.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}