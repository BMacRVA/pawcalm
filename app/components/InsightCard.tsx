'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Lightbulb } from 'lucide-react'

interface Insights {
  best_practice_time?: {
    time: string
    calm_rate: number
  }
  cue_difficulty?: {
    hardest: Array<{ name: string; calm_rate: number }>
    easiest: Array<{ name: string; calm_rate: number }>
    most_mastered: Array<{ name: string; times_mastered: number }>
  }
  mastery_stats?: {
    pct_dogs_with_mastery: number
    avg_days_to_first_mastery: number
  }
  consistency_stats?: {
    consistency_boost_pct: number
  }
  platform_milestones?: {
    total_practices: number
    total_cues_mastered: number
    total_dogs: number
  }
}

export default function InsightCard() {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInsights = async () => {
      const { data } = await supabase
        .from('aggregate_insights')
        .select('insight_key, insight_value')

      if (!data || data.length === 0) {
        setLoading(false)
        return
      }

      const insights: Insights = {}
      data.forEach(row => {
        insights[row.insight_key as keyof Insights] = row.insight_value
      })

      // Build pool of possible insights
      const pool: string[] = []

      if (insights.best_practice_time?.time && insights.best_practice_time?.calm_rate > 0) {
        const time = insights.best_practice_time.time
        const rate = insights.best_practice_time.calm_rate
        pool.push(`Dogs are ${rate}% calmer during ${time} sessions. Try practicing then!`)
      }

      if (insights.consistency_stats?.consistency_boost_pct > 0) {
        const boost = insights.consistency_stats.consistency_boost_pct
        pool.push(`Owners who practice 3+ days/week see ${boost}% better results.`)
      }

      if (insights.cue_difficulty?.hardest?.[0]) {
        const hardest = insights.cue_difficulty.hardest[0].name
        pool.push(`"${hardest}" is the toughest cue for most dogs. If yours struggles with it, you're not alone!`)
      }

      if (insights.cue_difficulty?.most_mastered?.[0]) {
        const popular = insights.cue_difficulty.most_mastered[0].name
        pool.push(`"${popular}" is the most commonly mastered cue. A great one to start with!`)
      }

      if (insights.mastery_stats?.avg_days_to_first_mastery) {
        const days = insights.mastery_stats.avg_days_to_first_mastery
        pool.push(`Most dogs master their first cue in about ${days} days of practice.`)
      }

      if (insights.platform_milestones?.total_cues_mastered && insights.platform_milestones.total_cues_mastered > 10) {
        const total = insights.platform_milestones.total_cues_mastered
        pool.push(`PawCalm dogs have mastered ${total} cues together. You're part of something!`)
      }

      if (insights.platform_milestones?.total_practices && insights.platform_milestones.total_practices > 100) {
        const total = insights.platform_milestones.total_practices
        pool.push(`${total.toLocaleString()} practice reps logged by the PawCalm community!`)
      }

      // Pick one based on day of year (so it changes daily but is consistent for the day)
      if (pool.length > 0) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
        const index = dayOfYear % pool.length
        setInsight(pool[index])
      }

      setLoading(false)
    }

    loadInsights()
  }, [])

  if (loading || !insight) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {insight}
        </p>
      </div>
    </div>
  )
}