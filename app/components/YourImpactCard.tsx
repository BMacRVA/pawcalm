'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react'

interface CueProgress {
  name: string
  icon: string
  startCalmRate: number
  currentCalmRate: number
  practiceCount: number
}

interface ImpactData {
  overallStartCalmRate: number
  overallCurrentCalmRate: number
  totalPractices: number
  daysSinceStart: number
  topCue: CueProgress | null
  isFollowingMethod: {
    dailyPractice: boolean
    gradualProgress: boolean
    consistency: boolean
  }
}

interface YourImpactCardProps {
  dogId: string | number
  dogName: string
}

export default function YourImpactCard({ dogId, dogName }: YourImpactCardProps) {
  const [data, setData] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadImpactData()
  }, [dogId])

  const loadImpactData = async () => {
    if (!dogId) return

    const now = new Date()

    // Get all practices ordered by date
    const { data: allPractices } = await supabase
      .from('cue_practices')
      .select('created_at, cues')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: true })

    if (!allPractices || allPractices.length < 3) {
      setLoading(false)
      return // Not enough data
    }

    // Get cues data
    const { data: cuesData } = await supabase
      .from('custom_cues')
      .select('id, name, icon, calm_count, total_practices')
      .eq('dog_id', dogId)

    // Calculate days since start
    const firstPractice = new Date(allPractices[0].created_at)
    const daysSinceStart = Math.floor((now.getTime() - firstPractice.getTime()) / (1000 * 60 * 60 * 24))

    // Get first week responses
    const endOfFirstWeek = new Date(firstPractice)
    endOfFirstWeek.setDate(endOfFirstWeek.getDate() + 7)
    
    const firstWeekResponses: string[] = []
    const recentResponses: string[] = []
    
    allPractices.forEach(p => {
      const practiceDate = new Date(p.created_at)
      p.cues?.forEach((c: any) => {
        if (c.response) {
          if (practiceDate < endOfFirstWeek) {
            firstWeekResponses.push(c.response)
          }
        }
      })
    })

    // Get last 7 days responses
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    allPractices.forEach(p => {
      const practiceDate = new Date(p.created_at)
      if (practiceDate >= sevenDaysAgo) {
        p.cues?.forEach((c: any) => {
          if (c.response) {
            recentResponses.push(c.response)
          }
        })
      }
    })

    const overallStartCalmRate = firstWeekResponses.length > 0 
      ? Math.round((firstWeekResponses.filter(r => r === 'calm').length / firstWeekResponses.length) * 100)
      : 0
    
    const overallCurrentCalmRate = recentResponses.length > 0
      ? Math.round((recentResponses.filter(r => r === 'calm').length / recentResponses.length) * 100)
      : 0

    // Calculate total practices
    let totalPractices = 0
    allPractices.forEach(p => {
      totalPractices += (p.cues?.length || 0)
    })

    // Find top improving cue
    let topCue: CueProgress | null = null
    
    if (cuesData) {
      for (const cue of cuesData) {
        if ((cue.total_practices || 0) < 5) continue

        // Get responses for this cue in order
        const cueResponses: string[] = []
        allPractices.forEach(p => {
          p.cues?.forEach((c: any) => {
            if (c.cue_id === cue.id && c.response) {
              cueResponses.push(c.response)
            }
          })
        })

        if (cueResponses.length < 5) continue

        const firstThree = cueResponses.slice(0, 3)
        const lastThree = cueResponses.slice(-3)

        const startCalmRate = Math.round((firstThree.filter(r => r === 'calm').length / 3) * 100)
        const currentCalmRate = Math.round((lastThree.filter(r => r === 'calm').length / 3) * 100)
        const improvement = currentCalmRate - startCalmRate

        if (!topCue || improvement > (topCue.currentCalmRate - topCue.startCalmRate)) {
          topCue = {
            name: cue.name,
            icon: cue.icon || '🔑',
            startCalmRate,
            currentCalmRate,
            practiceCount: cue.total_practices || 0
          }
        }
      }
    }

    // Check method adherence
    // Daily practice: practiced in last 2 days
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const recentPractice = allPractices.some(p => new Date(p.created_at) >= twoDaysAgo)

    // Gradual progress: has at least one mastered cue
    const hasMastered = (cuesData || []).some(c => (c.calm_count || 0) >= 5)

    // Consistency: practiced at least 3 of last 7 days
    const lastSevenDays = new Set<string>()
    allPractices.forEach(p => {
      const practiceDate = new Date(p.created_at)
      if (practiceDate >= sevenDaysAgo) {
        lastSevenDays.add(p.created_at.split('T')[0])
      }
    })
    const isConsistent = lastSevenDays.size >= 3

    setData({
      overallStartCalmRate,
      overallCurrentCalmRate,
      totalPractices,
      daysSinceStart,
      topCue,
      isFollowingMethod: {
        dailyPractice: recentPractice,
        gradualProgress: hasMastered,
        consistency: isConsistent
      }
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!data || data.totalPractices < 5) {
    return null // Not enough data to show impact
  }

  const overallChange = data.overallCurrentCalmRate - data.overallStartCalmRate
  const TrendIcon = overallChange > 0 ? TrendingUp : overallChange < 0 ? TrendingDown : Minus
  const trendColor = overallChange > 0 ? 'text-green-600' : overallChange < 0 ? 'text-red-500' : 'text-gray-500'

  const methodChecks = [
    { label: 'Practicing regularly', done: data.isFollowingMethod.dailyPractice },
    { label: 'Building gradually', done: data.isFollowingMethod.gradualProgress },
    { label: 'Staying consistent', done: data.isFollowingMethod.consistency },
  ]

  const allMethodsFollowed = methodChecks.every(m => m.done)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Your Impact on {dogName}
      </h2>

      {/* Overall before/after */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall calm rate</span>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {overallChange > 0 ? '+' : ''}{overallChange}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{data.overallStartCalmRate}%</p>
            <p className="text-xs text-gray-400">Week 1</p>
          </div>
          <div className="flex-1 flex items-center">
            <div className="flex-1 h-1 bg-gray-200 rounded-full">
              <div 
                className={`h-full rounded-full transition-all ${overallChange >= 0 ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${Math.min(100, Math.abs(overallChange) + 50)}%` }}
              />
            </div>
            <span className="mx-2 text-gray-400">→</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{data.overallCurrentCalmRate}%</p>
            <p className="text-xs text-gray-500">Now</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {data.totalPractices} practices over {data.daysSinceStart} days
        </p>
      </div>

      {/* Top improving cue */}
      {data.topCue && data.topCue.currentCalmRate > data.topCue.startCalmRate && (
        <div className="bg-green-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{data.topCue.icon}</span>
            <span className="text-sm font-medium text-green-800">{data.topCue.name}</span>
          </div>
          <p className="text-green-700 text-sm">
            {data.topCue.startCalmRate}% → {data.topCue.currentCalmRate}% calm
            <span className="text-green-600 ml-1">
              (+{data.topCue.currentCalmRate - data.topCue.startCalmRate}%)
            </span>
          </p>
          <p className="text-green-600 text-xs mt-1">
            {data.topCue.practiceCount} practices made this happen
          </p>
        </div>
      )}

      {/* Method validation */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500 mb-2">
          {allMethodsFollowed ? '✓ You\'re following the method' : 'Method checklist'}
        </p>
        <div className="space-y-1">
          {methodChecks.map((check, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${check.done ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${check.done ? 'text-gray-700' : 'text-gray-400'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}