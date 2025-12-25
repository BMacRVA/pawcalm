import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dogId = searchParams.get('dogId')
  const userId = searchParams.get('userId')

  if (!dogId || !userId) {
    return NextResponse.json({ error: 'Missing dogId or userId' }, { status: 400 })
  }

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Get recent practices
    const { data: recentPractices } = await supabase
      .from('cue_practices')
      .select('created_at, cues')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get practices this week
    const { data: weekPractices } = await supabase
      .from('cue_practices')
      .select('id')
      .eq('dog_id', dogId)
      .gte('created_at', weekAgo)

    // Get recent sessions
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('created_at, dog_response, owner_feeling, outcome')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get cue mastery
    const { data: cues } = await supabase
      .from('custom_cues')
      .select('id, name, calm_count, total_practices, mastered_at')
      .eq('dog_id', dogId)

    // Calculate days since last practice
    const lastPractice = recentPractices?.[0]?.created_at
    const daysSinceLastPractice = lastPractice 
      ? Math.floor((now.getTime() - new Date(lastPractice).getTime()) / (24 * 60 * 60 * 1000))
      : 999

    // Calculate days since last session
    const lastSession = recentSessions?.[0]?.created_at
    const daysSinceLastSession = lastSession
      ? Math.floor((now.getTime() - new Date(lastSession).getTime()) / (24 * 60 * 60 * 1000))
      : 999

    // Extract recent responses
    const recentResponses: string[] = []
    recentPractices?.forEach(p => {
      const practicesCues = p.cues as any[]
      practicesCues?.forEach((c: any) => {
        if (recentResponses.length < 10 && c.response) {
          recentResponses.push(c.response)
        }
      })
    })

    // Count consecutive anxious responses
    let consecutiveAnxious = 0
    for (const r of recentResponses) {
      if (r === 'anxious') consecutiveAnxious++
      else break
    }

    // Recent owner feelings
    const recentOwnerFeelings = recentSessions
      ?.map(s => s.owner_feeling)
      .filter(Boolean)
      .slice(0, 5) || []

    // Count consecutive frustrated sessions
    let consecutiveFrustrated = 0
    for (const f of recentOwnerFeelings) {
      if (f === 'frustrated') consecutiveFrustrated++
      else break
    }

    // Calculate streak
    let streak = 0
    const practiceDates = new Set(
      recentPractices?.map(p => new Date(p.created_at).toISOString().split('T')[0]) || []
    )
    
    const practicedToday = practiceDates.has(today)
    const startOffset = practicedToday ? 0 : 1
    
    for (let i = startOffset; i < 365; i++) {
      const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      
      if (practiceDates.has(checkDate)) {
        streak++
      } else {
        break
      }
    }

    // Calculate cue mastery
    const masteredCues = cues?.filter(c => {
      const calmCount = c.calm_count || 0
      const totalPractices = c.total_practices || 0
      return calmCount >= 5 && totalPractices > 0 && calmCount / totalPractices >= 0.7
    }) || []

    // Check for cue mastered today
    const justMasteredCue = cues?.find(c => {
      if (!c.mastered_at) return false
      const masteredDate = new Date(c.mastered_at).toISOString().split('T')[0]
      return masteredDate === today
    })

    // Check for streak milestones
    const streakMilestones = [3, 7, 14, 30, 60, 90]
    const justHitStreak = streakMilestones.includes(streak) ? streak : null

    // Count total practices
    const { count: totalPracticeCount } = await supabase
      .from('cue_practices')
      .select('*', { count: 'exact', head: true })
      .eq('dog_id', dogId)

    const successfulSessions = recentSessions?.filter(s => s.outcome === 'success') || []

    const ownerState = {
      daysSinceLastPractice,
      daysSinceLastSession,
      practicesThisWeek: weekPractices?.length || 0,
      recentResponses: recentResponses.slice(0, 5),
      recentOwnerFeelings,
      consecutiveAnxiousResponses: consecutiveAnxious,
      consecutiveFrustratedSessions: consecutiveFrustrated,
      currentStreak: streak,
      longestStreak: streak,
      cuesMastered: masteredCues.length,
      totalCues: cues?.length || 0,
      isFirstPractice: (totalPracticeCount || 0) === 0,
      isFirstMastery: masteredCues.length === 1 && !!justMasteredCue,
      isFirstSuccessfulSession: successfulSessions.length === 1,
      justHitStreak,
      justMasteredCue: justMasteredCue?.name || null,
    }

    return NextResponse.json(ownerState)
  } catch (error) {
    console.error('Error calculating owner state:', error)
    return NextResponse.json({ error: 'Failed to calculate owner state' }, { status: 500 })
  }
}