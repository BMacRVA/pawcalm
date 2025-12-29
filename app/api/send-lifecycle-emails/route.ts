import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'PawCalm <hello@pawcalm.ai>'
const BASE_URL = 'https://pawcalm.ai'

// Unsubscribe footer
const unsubscribeFooter = (userId: string) => `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    <a href="${BASE_URL}/unsubscribe?uid=${userId}" style="color: #999;">Unsubscribe from these emails</a>
  </p>
`

// Email templates
const templates = {
  welcome: (dogName: string, userId: string) => ({
    subject: `Welcome to PawCalm! Let's help ${dogName} 🐕`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Welcome to PawCalm!</h1>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          You've taken the first step toward helping ${dogName} feel calm when you leave. That's huge.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Here's what works: <strong>small, daily practice</strong>. Even 5 minutes a day makes a difference.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Your first goal: <strong>3 practices today</strong>. Open the app and tap "Start Practice" to begin.
        </p>
        
        <a href="${BASE_URL}/dashboard" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Start Your First Practice
        </a>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          You've got this. And we're here to help.
        </p>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>
        
        ${unsubscribeFooter(userId)}
      </div>
    `
  }),

  nudge: (dogName: string, daysSince: number, userId: string) => ({
    subject: `${dogName} misses practicing with you`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Hey, it's been ${daysSince} days</h1>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Life gets busy. We get it.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          But here's the thing about separation anxiety training: <strong>consistency beats intensity</strong>. 
          A few minutes today is better than an hour next week.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          ${dogName} is waiting. Just one practice session today?
        </p>
        
        <a href="${BASE_URL}/practice" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Quick Practice (2 min)
        </a>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>
        
        ${unsubscribeFooter(userId)}
      </div>
    `
  }),

  weekSummary: (dogName: string, stats: { practices: number; calmRate: number; streak: number; mastered: number }, userId: string) => ({
    subject: `${dogName}'s week in review 📊`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">${dogName}'s First Week 🎉</h1>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          You made it through week one! Here's what you accomplished:
        </p>
        
        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; text-align: center;">
            <tr>
              <td style="padding: 10px;">
                <p style="font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 0;">${stats.practices}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0;">practices</p>
              </td>
              <td style="padding: 10px;">
                <p style="font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 0;">${stats.calmRate}%</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0;">calm rate</p>
              </td>
              <td style="padding: 10px;">
                <p style="font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 0;">${stats.streak}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0;">day streak</p>
              </td>
            </tr>
          </table>
        </div>
        
        ${stats.mastered > 0 ? `
          <p style="color: #059669; font-size: 16px; line-height: 1.6;">
            🏆 <strong>${stats.mastered} cue${stats.mastered > 1 ? 's' : ''} mastered!</strong> That's real progress.
          </p>
        ` : ''}
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Week 2 tip: Focus on the cues where ${dogName} still reacts. Repetition builds confidence.
        </p>
        
        <a href="${BASE_URL}/progress" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          See Full Progress
        </a>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>
        
        ${unsubscribeFooter(userId)}
      </div>
    `
  }),

  milestone: (dogName: string, cueName: string, masteredCount: number, userId: string) => ({
    subject: `🎉 ${dogName} mastered "${cueName}"!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Milestone unlocked! 🏆</h1>
        
        <div style="background: #d1fae5; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 48px; margin: 0;">🎉</p>
          <p style="font-size: 20px; font-weight: bold; color: #065f46; margin: 10px 0;">
            ${dogName} mastered "${cueName}"
          </p>
          <p style="color: #047857; margin: 0;">
            ${masteredCount} cue${masteredCount > 1 ? 's' : ''} mastered total
          </p>
        </div>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          This means ${dogName} stayed calm for <strong>5 practices in a row</strong> with this cue. 
          That's not luck — that's real progress you built together.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Keep going. The next cue is waiting.
        </p>
        
        <a href="${BASE_URL}/practice" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Continue Practicing
        </a>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>
        
        ${unsubscribeFooter(userId)}
      </div>
    `
  }),

  winback: (dogName: string, daysSince: number, userId: string) => ({
    subject: `We miss you (and so does ${dogName}'s progress)`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">It's been ${daysSince} days</h1>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Separation anxiety training is hard. Really hard. If you stepped away, that's okay.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          The good news? <strong>You can pick up where you left off.</strong> ${dogName}'s progress is saved, and every practice counts — even after a break.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Start small. One practice today. That's it.
        </p>
        
        <a href="${BASE_URL}/practice" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Start Again
        </a>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          If something's not working or you have questions, just reply to this email. We read everything.
        </p>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>
        
        ${unsubscribeFooter(userId)}
      </div>
    `
  })
}

// Check if email was already sent
async function wasEmailSent(userId: string, emailType: string, withinDays: number = 30): Promise<boolean> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - withinDays)
  
  const { count } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .gte('sent_at', cutoff.toISOString())
  
  return (count || 0) > 0
}

// Log sent email
async function logEmail(userId: string, emailType: string, dogId?: number) {
  await supabase.from('email_logs').insert({
    user_id: userId,
    email_type: emailType,
    dog_id: dogId
  })
}

// Check if user opted out
async function isOptedIn(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('email_preferences')
    .select('lifecycle_emails')
    .eq('user_id', userId)
    .single()
  
  // Default to opted in if no preference set
  return data?.lifecycle_emails !== false
}

// Get user's dog and stats
async function getUserDogData(userId: string) {
  const { data: dog } = await supabase
    .from('dogs')
    .select('id, name')
    .eq('user_id', userId)
    .limit(1)
    .single()
  
  if (!dog) return null

  // Get practice stats
  const { data: practices } = await supabase
    .from('cue_practices')
    .select('created_at, cues')
    .eq('dog_id', dog.id)
    .order('created_at', { ascending: false })
  
  const { data: cues } = await supabase
    .from('custom_cues')
    .select('name, calm_count, mastered_at')
    .eq('dog_id', dog.id)
  
  // Calculate stats
  let totalPractices = 0
  let totalCalm = 0
  const practiceDays = new Set<string>()
  
  practices?.forEach(p => {
    practiceDays.add(p.created_at.split('T')[0])
    p.cues?.forEach((c: any) => {
      totalPractices++
      if (c.response === 'calm') totalCalm++
    })
  })

  const lastPracticeDate = practices?.[0]?.created_at
  const daysSinceLastPractice = lastPracticeDate 
    ? Math.floor((Date.now() - new Date(lastPracticeDate).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Calculate streak
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const checkDate = new Date()
  
  if (practiceDays.has(today)) {
    streak = 1
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (practiceDays.has(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  const mastered = cues?.filter(c => (c.calm_count || 0) >= 5) || []
  const recentlyMastered = cues?.filter(c => {
    if (!c.mastered_at) return false
    const masteredDate = new Date(c.mastered_at)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    return masteredDate >= oneDayAgo
  }) || []

  return {
    dog,
    totalPractices,
    calmRate: totalPractices > 0 ? Math.round((totalCalm / totalPractices) * 100) : 0,
    streak,
    daysSinceLastPractice,
    masteredCount: mastered.length,
    recentlyMastered,
    practiceDays: practiceDays.size
  }
}

export async function POST(request: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    welcome: 0,
    nudge: 0,
    weekSummary: 0,
    milestone: 0,
    winback: 0,
    errors: [] as string[]
  }

  try {
    // Get all users
    const { data: users } = await supabase.auth.admin.listUsers()
    
    for (const user of users.users) {
      if (!user.email || user.email.includes('test')) continue
      
      // Check opt-in status
      if (!(await isOptedIn(user.id))) continue

      const userData = await getUserDogData(user.id)
      if (!userData) continue

      const { dog, daysSinceLastPractice, totalPractices, calmRate, streak, masteredCount, recentlyMastered, practiceDays } = userData
      const userCreatedDaysAgo = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))

      try {
        // 1. Welcome email (day 0, hasn't practiced yet)
        if (userCreatedDaysAgo === 0 && totalPractices === 0) {
          if (!(await wasEmailSent(user.id, 'welcome'))) {
            const template = templates.welcome(dog.name, user.id)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: template.subject,
              html: template.html
            })
            await logEmail(user.id, 'welcome', dog.id)
            results.welcome++
          }
        }

        // 2. Nudge email (3 days inactive, but has practiced before)
        if (daysSinceLastPractice !== null && daysSinceLastPractice >= 3 && daysSinceLastPractice < 14 && totalPractices > 0) {
          if (!(await wasEmailSent(user.id, 'nudge', 7))) { // Don't send more than once per week
            const template = templates.nudge(dog.name, daysSinceLastPractice, user.id)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: template.subject,
              html: template.html
            })
            await logEmail(user.id, 'nudge', dog.id)
            results.nudge++
          }
        }

        // 3. Week summary (day 7)
        if (userCreatedDaysAgo === 7) {
          if (!(await wasEmailSent(user.id, 'week_summary'))) {
            const template = templates.weekSummary(dog.name, {
              practices: totalPractices,
              calmRate,
              streak,
              mastered: masteredCount
            }, user.id)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: template.subject,
              html: template.html
            })
            await logEmail(user.id, 'week_summary', dog.id)
            results.weekSummary++
          }
        }

        // 4. Milestone email (mastered a cue in last 24 hours)
        if (recentlyMastered.length > 0) {
          const cue = recentlyMastered[0]
          const milestoneKey = `milestone_${cue.name}`
          if (!(await wasEmailSent(user.id, milestoneKey))) {
            const template = templates.milestone(dog.name, cue.name, masteredCount, user.id)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: template.subject,
              html: template.html
            })
            await logEmail(user.id, milestoneKey, dog.id)
            results.milestone++
          }
        }

        // 5. Win-back email (14+ days inactive)
        if (daysSinceLastPractice !== null && daysSinceLastPractice >= 14) {
          if (!(await wasEmailSent(user.id, 'winback', 30))) { // Only once per month
            const template = templates.winback(dog.name, daysSinceLastPractice, user.id)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: template.subject,
              html: template.html
            })
            await logEmail(user.id, 'winback', dog.id)
            results.winback++
          }
        }

      } catch (emailError) {
        results.errors.push(`${user.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      sent: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Lifecycle email error:', error)
    return NextResponse.json({ 
      error: 'Failed to process emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}