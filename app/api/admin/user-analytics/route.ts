import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all user-related data
    const [
      { data: users },
      { data: dogs },
      { data: practices },
      { data: journalEntries },
      { data: checkins },
    ] = await Promise.all([
      supabase.from('users').select('id, email, created_at').order('created_at', { ascending: false }),
      supabase.from('dogs').select('*'),
      supabase.from('cue_practices').select('*'),
      supabase.from('journal_entries').select('*'),
      supabase.from('weekly_checkins').select('*'),
    ])

    // User growth metrics
    const totalUsers = users?.length || 0
    const usersToday = users?.filter(u => new Date(u.created_at) >= today).length || 0
    const usersThisWeek = users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0
    const usersThisMonth = users?.filter(u => new Date(u.created_at) >= monthAgo).length || 0

    // Calculate growth by day for last 30 days
    const signupsByDay: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = users?.filter(u => {
        const createdDate = new Date(u.created_at).toISOString().split('T')[0]
        return createdDate === dateStr
      }).length || 0
      signupsByDay.push({ date: dateStr, count })
    }

    // User engagement funnel
    const usersWithDogs = new Set(dogs?.map(d => d.user_id) || [])
    const usersWithPractices = new Set(practices?.map(p => p.user_id) || [])
    const usersWithJournal = new Set(journalEntries?.map(j => j.user_id) || [])

    const activationRate = totalUsers > 0 ? (usersWithDogs.size / totalUsers) * 100 : 0
    const practiceRate = usersWithDogs.size > 0 ? (usersWithPractices.size / usersWithDogs.size) * 100 : 0
    const journalRate = usersWithPractices.size > 0 ? (usersWithJournal.size / usersWithPractices.size) * 100 : 0

    // Retention metrics
    const activeThisWeek = new Set([
      ...practices?.filter(p => new Date(p.created_at) >= weekAgo).map(p => p.user_id) || [],
      ...journalEntries?.filter(j => new Date(j.created_at) >= weekAgo).map(j => j.user_id) || [],
    ]).size

    const activeThisMonth = new Set([
      ...practices?.filter(p => new Date(p.created_at) >= monthAgo).map(p => p.user_id) || [],
      ...journalEntries?.filter(j => new Date(j.created_at) >= monthAgo).map(j => j.user_id) || [],
    ]).size

    // User cohorts (by signup date)
    const cohorts: Record<string, {
      signups: number,
      activated: number,
      practiced: number,
      activeWeek1: number
    }> = {}

    users?.forEach(user => {
      const signupWeek = getWeekKey(new Date(user.created_at))
      if (!cohorts[signupWeek]) {
        cohorts[signupWeek] = { signups: 0, activated: 0, practiced: 0, activeWeek1: 0 }
      }
      cohorts[signupWeek].signups++

      if (usersWithDogs.has(user.id)) cohorts[signupWeek].activated++
      if (usersWithPractices.has(user.id)) cohorts[signupWeek].practiced++

      // Check if active in first week
      const week1End = new Date(new Date(user.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
      const userPractices = practices?.filter(p =>
        p.user_id === user.id &&
        new Date(p.created_at) <= week1End
      ) || []
      if (userPractices.length > 0) cohorts[signupWeek].activeWeek1++
    })

    // Convert cohorts to array and sort
    const cohortArray = Object.entries(cohorts)
      .map(([week, data]) => ({
        week,
        ...data,
        activationRate: data.signups > 0 ? Math.round((data.activated / data.signups) * 100) : 0,
        practiceRate: data.activated > 0 ? Math.round((data.practiced / data.activated) * 100) : 0,
        week1RetentionRate: data.signups > 0 ? Math.round((data.activeWeek1 / data.signups) * 100) : 0,
      }))
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 12) // Last 12 weeks

    // Recent user activity (last 10 signups with their journey)
    const recentUsers = users?.slice(0, 10).map(user => {
      const userDogs = dogs?.filter(d => d.user_id === user.id) || []
      const userPractices = practices?.filter(p => p.user_id === user.id) || []
      const userJournal = journalEntries?.filter(j => j.user_id === user.id) || []

      const lastActivity = [
        ...userPractices.map(p => new Date(p.created_at)),
        ...userJournal.map(j => new Date(j.created_at)),
      ].sort((a, b) => b.getTime() - a.getTime())[0]

      return {
        email: user.email,
        signupDate: user.created_at,
        hasDog: userDogs.length > 0,
        dogCount: userDogs.length,
        practiceCount: userPractices.length,
        journalCount: userJournal.length,
        lastActivity: lastActivity?.toISOString() || null,
        daysSinceSignup: Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000)),
      }
    }) || []

    // Top features usage
    const featureUsage = {
      totalPractices: practices?.length || 0,
      totalJournalMessages: journalEntries?.length || 0,
      totalCheckins: checkins?.length || 0,
      avgPracticesPerUser: usersWithPractices.size > 0 ? Math.round((practices?.length || 0) / usersWithPractices.size) : 0,
      avgJournalPerUser: usersWithJournal.size > 0 ? Math.round((journalEntries?.length || 0) / usersWithJournal.size) : 0,
    }

    // Churn risk (users who signed up but haven't been active recently)
    const churnRisk = users?.filter(user => {
      const signupDate = new Date(user.created_at)
      const daysSinceSignup = (now.getTime() - signupDate.getTime()) / (24 * 60 * 60 * 1000)

      // Only consider users who signed up at least 7 days ago
      if (daysSinceSignup < 7) return false

      const userPractices = practices?.filter(p =>
        p.user_id === user.id &&
        new Date(p.created_at) >= weekAgo
      ) || []

      const userJournal = journalEntries?.filter(j =>
        j.user_id === user.id &&
        new Date(j.created_at) >= weekAgo
      ) || []

      return userPractices.length === 0 && userJournal.length === 0
    }).length || 0

    return NextResponse.json({
      overview: {
        totalUsers,
        usersToday,
        usersThisWeek,
        usersThisMonth,
        activeThisWeek,
        activeThisMonth,
        churnRisk,
      },
      funnel: {
        signedUp: totalUsers,
        createdDog: usersWithDogs.size,
        practicedOnce: usersWithPractices.size,
        usedJournal: usersWithJournal.size,
        activationRate: Math.round(activationRate),
        practiceRate: Math.round(practiceRate),
        journalRate: Math.round(journalRate),
      },
      growth: {
        signupsByDay,
      },
      cohorts: cohortArray,
      recentUsers,
      featureUsage,
    })
  } catch (error) {
    console.error('Admin user analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
