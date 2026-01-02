import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Check admin password from environment variable
function isAdmin(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || !isAdmin(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all data
    const [
      { data: dogs },
      { data: practices },
      { data: cues },
      { data: journalEntries },
      { data: checkins },
    ] = await Promise.all([
      supabase.from('dogs').select('*'),
      supabase.from('cue_practices').select('*'),
      supabase.from('custom_cues').select('*'),
      supabase.from('journal_entries').select('*'),
      supabase.from('weekly_checkins').select('*'),
    ])

    // Calculate basic stats
    const totalDogs = dogs?.length || 0
    const totalPractices = practices?.length || 0
    const totalJournalChats = journalEntries?.length || 0

    // Practice analysis
    let totalReps = 0
    let calmReps = 0
    let noticedReps = 0
    let anxiousReps = 0
    const practicesByTime: Record<string, { calm: number; total: number }> = {
      morning: { calm: 0, total: 0 },
      afternoon: { calm: 0, total: 0 },
      evening: { calm: 0, total: 0 },
    }

    practices?.forEach(p => {
      p.cues?.forEach((c: any) => {
        totalReps++
        if (c.response === 'calm') calmReps++
        else if (c.response === 'noticed') noticedReps++
        else if (c.response === 'anxious') anxiousReps++

        const time = p.time_of_day || 'morning'
        if (practicesByTime[time]) {
          practicesByTime[time].total++
          if (c.response === 'calm') practicesByTime[time].calm++
        }
      })
    })

    // Cue difficulty analysis
    const cueStats: Record<string, { calm: number; total: number; mastered: number }> = {}
    cues?.forEach(c => {
      const name = c.name
      if (!cueStats[name]) {
        cueStats[name] = { calm: 0, total: 0, mastered: 0 }
      }
      cueStats[name].total += c.total_practices || 0
      cueStats[name].calm += c.calm_count || 0
      if ((c.calm_count || 0) >= 5) cueStats[name].mastered++
    })

    const cueList = Object.entries(cueStats)
      .map(([name, stats]) => ({
        name,
        calmRate: stats.total > 0 ? (stats.calm / stats.total) : 0,
        totalPractices: stats.total,
        timesManaged: stats.mastered,
      }))
      .sort((a, b) => b.totalPractices - a.totalPractices)

    // User engagement
    const dogsWithPractices = new Set(practices?.map(p => p.dog_id) || [])
    const activeDogs = dogsWithPractices.size
    const inactiveDogs = totalDogs - activeDogs

    const recentPractices = practices?.filter(p => new Date(p.created_at) >= weekAgo) || []
    const activeThisWeek = new Set(recentPractices.map(p => p.dog_id)).size

    // Dog progress analysis
    const dogProgress = dogs?.map(dog => {
      const dogPractices = practices?.filter(p => p.dog_id === dog.id) || []
      const dogCues = cues?.filter(c => c.dog_id === dog.id) || []

      let dogCalm = 0
      let dogTotal = 0
      dogPractices.forEach(p => {
        p.cues?.forEach((c: any) => {
          dogTotal++
          if (c.response === 'calm') dogCalm++
        })
      })

      const mastered = dogCues.filter(c => (c.calm_count || 0) >= 5).length
      const lastPractice = dogPractices[dogPractices.length - 1]?.created_at
      const daysSinceLastPractice = lastPractice
        ? Math.floor((now.getTime() - new Date(lastPractice).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        name: dog.name,
        totalPractices: dogTotal,
        calmRate: dogTotal > 0 ? Math.round((dogCalm / dogTotal) * 100) : 0,
        masteredCues: mastered,
        daysSinceLastPractice,
        severity: dog.severity,
      }
    }).sort((a, b) => b.totalPractices - a.totalPractices) || []

    // AI Insights & Hypotheses
    const bestTime = Object.entries(practicesByTime)
      .filter(([_, stats]) => stats.total >= 10)
      .map(([time, stats]) => ({
        time,
        calmRate: Math.round((stats.calm / stats.total) * 100),
        totalPractices: stats.total,
      }))
      .sort((a, b) => b.calmRate - a.calmRate)[0]

    const hardestCues = cueList
      .filter(c => c.totalPractices >= 10)
      .sort((a, b) => a.calmRate - b.calmRate)
      .slice(0, 3)

    const easiestCues = cueList
      .filter(c => c.totalPractices >= 10)
      .sort((a, b) => b.calmRate - a.calmRate)
      .slice(0, 3)

    // Consistency analysis
    const dogsWithStreaks = dogProgress.filter(d => d.daysSinceLastPractice !== null && d.daysSinceLastPractice <= 7)
    const avgCalmRateConsistent = dogsWithStreaks.length > 0
      ? Math.round(dogsWithStreaks.reduce((sum, d) => sum + d.calmRate, 0) / dogsWithStreaks.length)
      : 0

    const dogsInconsistent = dogProgress.filter(d => d.daysSinceLastPractice !== null && d.daysSinceLastPractice > 7)
    const avgCalmRateInconsistent = dogsInconsistent.length > 0
      ? Math.round(dogsInconsistent.reduce((sum, d) => sum + d.calmRate, 0) / dogsInconsistent.length)
      : 0

    // Journal engagement
    const dogsWithJournal = new Set(journalEntries?.map(j => j.dog_id) || [])
    const journalEngagementRate = totalDogs > 0 ? Math.round((dogsWithJournal.size / totalDogs) * 100) : 0

    // Weekly check-in completion
    const dogsWithCheckins = new Set(checkins?.map(c => c.dog_id) || [])
    const checkinCompletionRate = totalDogs > 0 ? Math.round((dogsWithCheckins.size / totalDogs) * 100) : 0

    // Build hypothesis insights
    const insights = {
      hypotheses: [
        {
          hypothesis: 'Time of day affects success rate',
          status: bestTime ? 'VALIDATED' : 'INSUFFICIENT_DATA',
          evidence: bestTime
            ? `${bestTime.time} shows ${bestTime.calmRate}% calm rate (${bestTime.totalPractices} practices)`
            : 'Need at least 10 practices per time period',
          recommendation: bestTime
            ? `Recommend users practice during ${bestTime.time}`
            : 'Collect more data across different times',
        },
        {
          hypothesis: 'Consistent practice improves outcomes',
          status: avgCalmRateConsistent > avgCalmRateInconsistent ? 'VALIDATED' : 'NEEDS_REVIEW',
          evidence: `Consistent users: ${avgCalmRateConsistent}% calm rate. Inconsistent: ${avgCalmRateInconsistent}% calm rate`,
          recommendation:
            avgCalmRateConsistent > avgCalmRateInconsistent
              ? 'Emphasize daily practice in onboarding and nudge emails'
              : 'Other factors may be more important than consistency',
        },
        {
          hypothesis: 'Journal chat increases engagement',
          status: journalEngagementRate > 30 ? 'PROMISING' : 'NEEDS_REVIEW',
          evidence: `${journalEngagementRate}% of users have used journal chat`,
          recommendation:
            journalEngagementRate > 30
              ? 'Promote journal feature more prominently'
              : 'Consider redesigning journal UX or prompts',
        },
        {
          hypothesis: 'Some cues are universally harder than others',
          status: hardestCues.length > 0 ? 'VALIDATED' : 'INSUFFICIENT_DATA',
          evidence: hardestCues.length > 0
            ? `Hardest: ${hardestCues.map(c => `${c.name} (${Math.round(c.calmRate * 100)}%)`).join(', ')}`
            : 'Not enough practice data',
          recommendation: hardestCues.length > 0
            ? 'Provide extra guidance/tips for harder cues in the app'
            : 'Collect more data',
        },
      ],
      keyMetrics: {
        overallCalmRate: totalReps > 0 ? Math.round((calmReps / totalReps) * 100) : 0,
        activationRate: totalDogs > 0 ? Math.round((activeDogs / totalDogs) * 100) : 0,
        avgPracticesPerActiveDog: activeDogs > 0 ? Math.round(totalReps / activeDogs) : 0,
        journalEngagementRate,
        checkinCompletionRate,
        activeThisWeek,
      },
      topPerformers: dogProgress.slice(0, 10),
      strugglingDogs: dogProgress.filter(d => d.totalPractices >= 5 && d.calmRate < 40).slice(0, 10),
      cueAnalysis: {
        easiest: easiestCues,
        hardest: hardestCues,
      },
    }

    return NextResponse.json({
      stats: {
        totalDogs,
        totalPractices,
        totalReps,
        activeDogs,
        inactiveDogs,
        activeThisWeek,
      },
      insights,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
