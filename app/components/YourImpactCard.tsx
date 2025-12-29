'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { TrendingUp, TrendingDown, Minus, CheckCircle, Info } from 'lucide-react'

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
  dataQuality: 'early' | 'building' | 'solid'
  comparisonSize: number
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
  const [showExplainer, setShowExplainer] = useState(false)

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

    if (!allPractices || allPractices.length < 1) {
      setLoading(false)
      return
    }

    // Get cues data
    const { data: cuesData } = await supabase
      .from('custom_cues')
      .select('id, name, icon, calm_count, total_practices')
      .eq('dog_id', dogId)

    // Calculate days since start
    const firstPractice = new Date(allPractices[0].created_at)
    const daysSinceStart = Math.floor((now.getTime() - firstPractice.getTime()) / (1000 * 60 * 60 * 24))

    // Collect ALL responses in order
    const allResponses: string[] = []
    allPractices.forEach(p => {
      p.cues?.forEach((c: any) => {
        if (c.response) {
          allResponses.push(c.response)
        }
      })
    })

    const totalPractices = allResponses.length

    // Determine comparison size and data quality based on total practices
    let comparisonSize: number
    let dataQuality: 'early' | 'building' | 'solid'

    if (totalPractices < 6) {
      // Not enough data yet
      setData(null)
      setLoading(false)
      return
    } else if (totalPractices <= 15) {
      // Early results: compare first 3 vs last 3
      comparisonSize = 3
      dataQuality = 'early'
    } else if (totalPractices <= 30) {
      // Building picture: compare first 5 vs last 5
      comparisonSize = 5
      dataQuality = 'building'
    } else {
      // Solid data: compare first 20% vs last 20%
      comparisonSize = Math.max(5, Math.floor(totalPractices * 0.2))
      dataQuality = 'solid'
    }

    // Get start and current responses based on comparison size
    const startResponses = allResponses.slice(0, comparisonSize)
    const currentResponses = allResponses.slice(-comparisonSize)

    const overallStartCalmRate = startResponses.length > 0 
      ? Math.round((startResponses.filter(r => r === 'calm').length / startResponses.length) * 100)
      : 0
    
    const overallCurrentCalmRate = currentResponses.length > 0
      ? Math.round((currentResponses.filter(r => r === 'calm').length / currentResponses.length) * 100)
      : 0

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
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const recentPractice = allPractices.some(p => new Date(p.created_at) >= twoDaysAgo)

    const hasMastered = (cuesData || []).some(c => (c.calm_count || 0) >= 5)

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
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
      dataQuality,
      comparisonSize,
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

  if (!data) {
    return null
  }

  const overallChange = data.overallCurrentCalmRate - data.overallStartCalmRate
  
  // Determine visual treatment based on change
  // Positive: green, celebratory
  // Flat: gray, encouraging
  // Negative: gray (not red), supportive
  const isPositive = overallChange > 0
  const isFlat = overallChange === 0
  const isSmallDip = overallChange < 0 && overallChange > -10
  const isBigDip = overallChange <= -10

  const TrendIcon = isPositive ? TrendingUp : isFlat ? Minus : TrendingDown
  const trendColor = isPositive ? 'text-green-600' : 'text-gray-500'
  const barColor = isPositive ? 'bg-green-500' : 'bg-gray-300'

  // Supportive message for different scenarios
  let trendMessage = null
  if (overallChange >= 10) {
    trendMessage = 'Great progress!'
  } else if (isFlat) {
    trendMessage = 'Holding steady'
  } else if (isSmallDip) {
    trendMessage = 'Some fluctuation is normal'
  } else if (isBigDip) {
    trendMessage = 'Tough stretch — keep showing up'
  }

  const methodChecks = [
    { label: 'Practicing regularly', done: data.isFollowingMethod.dailyPractice },
    { label: 'Building gradually', done: data.isFollowingMethod.gradualProgress },
    { label: 'Staying consistent', done: data.isFollowingMethod.consistency },
  ]

  const allMethodsFollowed = methodChecks.every(m => m.done)

  // Data quality labels
  const qualityLabel = {
    early: 'Early results',
    building: 'Building picture',
    solid: null // No label needed
  }[data.dataQuality]

  const explainerText = {
    early: `Comparing your first ${data.comparisonSize} practices to your last ${data.comparisonSize}. Keep practicing for a clearer picture.`,
    building: `Comparing your first ${data.comparisonSize} practices to your last ${data.comparisonSize}. The trend is becoming clearer.`,
    solid: `Comparing your first ${data.comparisonSize} practices (20%) to your last ${data.comparisonSize} (20%). This is a reliable measure of ${dogName}'s progress.`
  }[data.dataQuality]

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Your Impact on {dogName}
      </h2>

      {/* Overall before/after */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Overall calm rate</span>
            {qualityLabel && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {qualityLabel}
              </span>
            )}
            <button 
              onClick={() => setShowExplainer(!showExplainer)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {overallChange > 0 ? '+' : ''}{overallChange}%
            </span>
          </div>
        </div>
        
        {/* Explainer tooltip */}
        {showExplainer && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-xs text-gray-600">
            <p>{explainerText}</p>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{data.overallStartCalmRate}%</p>
            <p className="text-xs text-gray-400">Start</p>
          </div>
          <div className="flex-1 flex items-center">
            <div className="flex-1 h-1 bg-gray-200 rounded-full">
              <div 
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${isPositive ? Math.min(100, overallChange + 50) : 50}%` }}
              />
            </div>
            <span className="mx-2 text-gray-400">→</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{data.overallCurrentCalmRate}%</p>
            <p className="text-xs text-gray-500">Now</p>
          </div>
        </div>
        
        {/* Trend message */}
        {trendMessage && (
          <p className={`text-xs mt-2 text-center ${isPositive ? 'text-green-600' : 'text-gray-500'}`}>
            {trendMessage}
          </p>
        )}
        
        <p className="text-xs text-gray-400 mt-1 text-center">
          {data.totalPractices} practices over {data.daysSinceStart === 0 ? '1' : data.daysSinceStart} day{data.daysSinceStart !== 1 ? 's' : ''}
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