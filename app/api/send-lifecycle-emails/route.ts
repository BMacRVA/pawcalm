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

// Fetch aggregate insights
async function getInsights(): Promise<Record<string, any>> {
  const { data } = await supabase
    .from('aggregate_insights')
    .select('insight_key, insight_value')
  
  const insights: Record<string, any> = {}
  data?.forEach(row => {
    insights[row.insight_key] = row.insight_value
  })
  return insights
}

// Format insight for email
function formatInsightBlock(insights: Record<string, any>, type: 'welcome' | 'nudge' | 'weekSummary' | 'milestone' | 'winback' | 'weeklyCheckin'): string {
  const bestTime = insights.best_practice_time
  const cues = insights.cue_difficulty
  const mastery = insights.mastery_stats
  const consistency = insights.consistency_stats

  let insightHtml = ''

  switch (type) {
    case 'welcome':
      if (bestTime?.time && bestTime?.calm_rate) {
        insightHtml = `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>💡 Tip from our data:</strong><br/>
              Dogs are ${bestTime.calm_rate}% calmer during <strong>${bestTime.time}</strong> sessions. Try practicing then!
            </p>
          </div>
        `
      }
      break

    case 'nudge':
      if (consistency?.consistency_boost_pct > 0) {
        insightHtml = `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>📊 What our data shows:</strong><br/>
              Owners who practice 3+ days per week see a <strong>${consistency.consistency_boost_pct}% higher calm rate</strong>. Just a few minutes today keeps the progress going.
            </p>
          </div>
        `
      } else if (cues?.hardest?.[0]) {
        insightHtml = `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>💡 Quick tip:</strong><br/>
              "${cues.hardest[0].name}" is the toughest cue for most dogs. If your pup struggles with it, you're not alone — keep at it!
            </p>
          </div>
        `
      }
      break

    case 'weekSummary':
      const tips: string[] = []
      if (bestTime?.time) {
        tips.push(`Dogs are calmest in the <strong>${bestTime.time}</strong> (${bestTime.calm_rate}% calm rate)`)
      }
      if (cues?.most_mastered?.[0]) {
        tips.push(`"${cues.most_mastered[0].name}" is the most commonly mastered cue`)
      }
      if (consistency?.consistency_boost_pct > 0) {
        tips.push(`Consistent owners see <strong>${consistency.consistency_boost_pct}% better results</strong>`)
      }
      
      if (tips.length > 0) {
        insightHtml = `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #0369a1; font-weight: bold;">📊 What's working for PawCalm owners:</p>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1; font-size: 14px;">
              ${tips.map(tip => `<li style="margin: 4px 0;">${tip}</li>`).join('')}
            </ul>
          </div>
        `
      }
      break

    case 'milestone':
      if (mastery?.pct_dogs_with_mastery) {
        const pctAhead = 100 - mastery.pct_dogs_with_mastery
        insightHtml = `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>🎯 Fun fact:</strong><br/>
              Only ${mastery.pct_dogs_with_mastery}% of dogs have mastered a cue. You're ahead of ${pctAhead}% of the pack!
            </p>
          </div>
        `
      }
      break

    case 'winback':
      if (mastery?.avg_days_to_first_mastery) {
        insightHtml = `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>💡 Did you know?</strong><br/>
              Most dogs master their first cue in about <strong>${mastery.avg_days_to_first_mastery} days</strong> of consistent practice. It's never too late to start again.
            </p>
          </div>
        `
      }
      break

    case 'weeklyCheckin':
      if (consistency?.consistency_boost_pct > 0) {
        insightHtml = `
          <div style="background: #faf5ff; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #9333ea;">
            <p style="margin: 0; font-size: 14px; color: #6b21a8;">
              <strong>📊 Why check-ins matter:</strong><br/>
              Owners who track weekly see <strong>${consistency.consistency_boost_pct}% better results</strong>. Your feedback helps us help you.
            </p>
          </div>
        `
      }
      break
  }

  return insightHtml
}

// Unsubscribe footer
const unsubscribeFooter = (userId: string) => `
  <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
    <a href="${BASE_URL}/unsubscribe?uid=${userId}" style="color: #999;">Unsubscribe from these emails</a>
  </p>
`

// Email templates
const templates = {
  welcome: (dogName: string, userId: string, insights: Record<string, any>) => ({
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
        
        ${formatInsightBlock(insights, 'welcome')}
        
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

  nudge: (dogName: string, daysSince: number, userId: string, insights: Record<string, any>) => ({
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
        
        ${formatInsightBlock(insights, 'nudge')}
        
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

  weekSummary: (dogName: string, stats: { practices: number; calmRate: number; streak: number; mastered: number }, userId: string, insights: Record<string, any>) => ({
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
        
        ${formatInsightBlock(insights, 'weekSummary')}
        
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

  milestone: (dogName: string, cueName: string, masteredCount: number, userId: string, insights: Record<string, any>) => ({
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
        
        ${formatInsightBlock(insights, 'milestone')}
        
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

  winback1: (dogName: string, daysSince: number, userId: string, insights: Record<string, any>) => ({
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

        ${formatInsightBlock(insights, 'winback')}

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
  }),

  winback2: (dogName: string, daysSince: number, userId: string, insights: Record<string, any>) => ({
    subject: `Last check: Is PawCalm working for you and ${dogName}?`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Honest question</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          It's been a month since your last practice. We're wondering: <strong>Is PawCalm not working for you?</strong>
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          If ${dogName}'s anxiety hasn't improved, or if something about the app is frustrating, we genuinely want to know.
          Reply to this email and tell us what's not working.
        </p>

        ${formatInsightBlock(insights, 'winback')}

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          But if you're just busy and plan to come back — we get it. Your progress is waiting whenever you're ready.
        </p>

        <a href="${BASE_URL}/practice" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Pick Up Where You Left Off
        </a>

        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>

        ${unsubscribeFooter(userId)}
      </div>
    `
  }),

  winback3: (dogName: string, userId: string) => ({
    subject: `Final email: We're here if you need us`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">This is our last email</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          We haven't seen you in over 60 days, so we're going to stop sending emails and give you some space.
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          <strong>But your account is still active.</strong> ${dogName}'s data is safe, and you can log back in anytime.
        </p>

        <a href="${BASE_URL}/login" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Log Back In
        </a>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          If ${dogName}'s anxiety got better without PawCalm — that's great! We're happy for you both.
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          And if you ever decide to try again, we'll be here.
        </p>

        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          — The PawCalm Team
        </p>

        ${unsubscribeFooter(userId)}
      </div>
    `
  }),

  weeklyCheckin: (dogName: string, userId: string, insights: Record<string, any>) => ({
    subject: `How's ${dogName} doing this week? 🐕`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Quick check-in time!</h1>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          How's training going with ${dogName}? We'd love to know — it helps us help you.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Takes 30 seconds. Just tap below and answer 2 quick questions.
        </p>
        
        ${formatInsightBlock(insights, 'weeklyCheckin')}
        
        <a href="${BASE_URL}/dashboard" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Check In Now
        </a>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Even if you haven't logged practices, your feedback matters. We want to know how ${dogName} is really doing.
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
  
  return data?.lifecycle_emails !== false
}

// Check last weekly check-in
async function getLastCheckinDate(dogId: number): Promise<Date | null> {
  const { data } = await supabase
    .from('weekly_checkins')
    .select('created_at')
    .eq('dog_id', dogId)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (data && data.length > 0) {
    return new Date(data[0].created_at)
  }
  return null
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

  const { data: practices } = await supabase
    .from('cue_practices')
    .select('created_at, cues')
    .eq('dog_id', dog.id)
    .order('created_at', { ascending: false })
  
  const { data: cues } = await supabase
    .from('custom_cues')
    .select('name, calm_count, mastered_at')
    .eq('dog_id', dog.id)
  
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

  // Get last check-in date
  const lastCheckinDate = await getLastCheckinDate(dog.id)

  return {
    dog,
    totalPractices,
    calmRate: totalPractices > 0 ? Math.round((totalCalm / totalPractices) * 100) : 0,
    streak,
    daysSinceLastPractice,
    masteredCount: mastered.length,
    recentlyMastered,
    practiceDays: practiceDays.size,
    lastCheckinDate
  }
}

export async function POST(request: NextRequest) {
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
    weeklyCheckin: 0,
    errors: [] as string[]
  }

  try {
    // Get aggregate insights
    const insights = await getInsights()
    
    // Get all users
    const { data: users } = await supabase.auth.admin.listUsers()
    
    for (const user of users.users) {
      if (!user.email || user.email.includes('test')) continue
      
      if (!(await isOptedIn(user.id))) continue

      const userData = await getUserDogData(user.id)
      if (!userData) continue

      const { dog, daysSinceLastPractice, totalPractices, calmRate, streak, masteredCount, recentlyMastered, lastCheckinDate } = userData
      const userCreatedDaysAgo = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))

      try {
        // 1. Welcome email
        if (userCreatedDaysAgo === 0 && totalPractices === 0) {
          if (!(await wasEmailSent(user.id, 'welcome'))) {
            const template = templates.welcome(dog.name, user.id, insights)
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

        // 2. Nudge email
        if (daysSinceLastPractice !== null && daysSinceLastPractice >= 3 && daysSinceLastPractice < 14 && totalPractices > 0) {
          if (!(await wasEmailSent(user.id, 'nudge', 7))) {
            const template = templates.nudge(dog.name, daysSinceLastPractice, user.id, insights)
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

        // 3. Week summary
        if (userCreatedDaysAgo === 7) {
          if (!(await wasEmailSent(user.id, 'week_summary'))) {
            const template = templates.weekSummary(dog.name, {
              practices: totalPractices,
              calmRate,
              streak,
              mastered: masteredCount
            }, user.id, insights)
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

        // 4. Milestone email
        if (recentlyMastered.length > 0) {
          const cue = recentlyMastered[0]
          const milestoneKey = `milestone_${cue.name}`
          if (!(await wasEmailSent(user.id, milestoneKey))) {
            const template = templates.milestone(dog.name, cue.name, masteredCount, user.id, insights)
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

        // 5. Progressive win-back sequence with hard stop
        if (daysSinceLastPractice !== null) {
          // Stop all emails after 90 days of inactivity
          if (daysSinceLastPractice >= 90) {
            // Do nothing - hard stop
          }
          // Win-back #3: 60-89 days inactive
          else if (daysSinceLastPractice >= 60) {
            if (!(await wasEmailSent(user.id, 'winback3'))) {
              const template = templates.winback3(dog.name, user.id)
              await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: template.subject,
                html: template.html
              })
              await logEmail(user.id, 'winback3', dog.id)
              results.winback++
            }
          }
          // Win-back #2: 30-59 days inactive
          else if (daysSinceLastPractice >= 30) {
            if (!(await wasEmailSent(user.id, 'winback2'))) {
              const template = templates.winback2(dog.name, daysSinceLastPractice, user.id, insights)
              await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: template.subject,
                html: template.html
              })
              await logEmail(user.id, 'winback2', dog.id)
              results.winback++
            }
          }
          // Win-back #1: 14-29 days inactive
          else if (daysSinceLastPractice >= 14) {
            if (!(await wasEmailSent(user.id, 'winback1'))) {
              const template = templates.winback1(dog.name, daysSinceLastPractice, user.id, insights)
              await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: template.subject,
                html: template.html
              })
              await logEmail(user.id, 'winback1', dog.id)
              results.winback++
            }
          }
        }

        // 6. Weekly check-in reminder
        // Send if: user has 5+ practices AND (never checked in OR last check-in was 7+ days ago)
        if (totalPractices >= 5) {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          
          const needsCheckin = !lastCheckinDate || lastCheckinDate < sevenDaysAgo
          
          if (needsCheckin && !(await wasEmailSent(user.id, 'weekly_checkin', 7))) {
            const template = templates.weeklyCheckin(dog.name, user.id, insights)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: template.subject,
              html: template.html
            })
            await logEmail(user.id, 'weekly_checkin', dog.id)
            results.weeklyCheckin++
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

export async function GET(request: NextRequest) {
  return POST(request)
}