import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 10 // 10 requests per minute

  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: maxRequests - userLimit.count }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    const { dogId, message, userId } = await request.json()

    if (!dogId || !message) {
      return NextResponse.json({ error: 'Missing dogId or message' }, { status: 400 })
    }

    // Rate limit check
    const rateLimitKey = userId || dogId || 'anonymous'
    const { allowed, remaining } = checkRateLimit(rateLimitKey)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before sending more messages.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      )
    }

    // Fetch dog info
    const { data: dog } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single()

    if (!dog) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 })
    }

    // Fetch ALL cues with full details
    const { data: cues } = await supabase
      .from('custom_cues')
      .select('name, calm_count, total_practices, created_at, mastered_at')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: true })

    // Fetch ALL practices for pattern analysis
    const { data: allPractices } = await supabase
      .from('cue_practices')
      .select('cues, created_at, time_of_day, day_of_week')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(100)

    // Calculate detailed stats
    let totalPractices = 0
    let totalCalm = 0
    let totalNoticed = 0
    let totalAnxious = 0
    const practicesByDay: Record<string, number> = {}
    const practicesByTime: Record<string, { total: number; calm: number }> = {
      morning: { total: 0, calm: 0 },
      afternoon: { total: 0, calm: 0 },
      evening: { total: 0, calm: 0 },
    }

    allPractices?.forEach(p => {
      const day = p.created_at.split('T')[0]
      practicesByDay[day] = (practicesByDay[day] || 0) + 1
      
      p.cues?.forEach((c: any) => {
        totalPractices++
        if (c.response === 'calm') totalCalm++
        else if (c.response === 'noticed') totalNoticed++
        else if (c.response === 'anxious') totalAnxious++
        
        const timeOfDay = p.time_of_day || 'morning'
        if (practicesByTime[timeOfDay]) {
          practicesByTime[timeOfDay].total++
          if (c.response === 'calm') practicesByTime[timeOfDay].calm++
        }
      })
    })

    // Calculate this week's stats
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekPractices = allPractices?.filter(p => new Date(p.created_at) >= weekAgo) || []
    
    let weekTotal = 0
    let weekCalm = 0
    weekPractices.forEach(p => {
      p.cues?.forEach((c: any) => {
        weekTotal++
        if (c.response === 'calm') weekCalm++
      })
    })
    const weekCalmRate = weekTotal > 0 ? Math.round((weekCalm / weekTotal) * 100) : 0

    // Calculate streak
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const practiceDays = new Set(Object.keys(practicesByDay))
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

    // Find best time of day
    let bestTime = 'morning'
    let bestTimeRate = 0
    Object.entries(practicesByTime).forEach(([time, stats]) => {
      if (stats.total >= 3) {
        const rate = stats.calm / stats.total
        if (rate > bestTimeRate) {
          bestTimeRate = rate
          bestTime = time
        }
      }
    })

    // Analyze cue progress
    const masteredCues = cues?.filter(c => (c.calm_count || 0) >= 5) || []
    const inProgressCues = cues?.filter(c => {
      const calm = c.calm_count || 0
      return calm > 0 && calm < 5
    }) || []
    const strugglingCues = cues?.filter(c => {
      const total = c.total_practices || 0
      const calm = c.calm_count || 0
      return total >= 3 && (calm / total) < 0.4
    }) || []
    const notStartedCues = cues?.filter(c => (c.total_practices || 0) === 0) || []

    // Fetch previous journal conversations
    const { data: previousEntries } = await supabase
      .from('journal_entries')
      .select('content, ai_response, created_at')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate days since started
    const firstPractice = allPractices?.[allPractices.length - 1]?.created_at
    const daysSinceStart = firstPractice 
      ? Math.floor((Date.now() - new Date(firstPractice).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Build comprehensive context
    const systemPrompt = `You are a supportive, knowledgeable dog separation anxiety coach inside the PawCalm app. You're texting with a dog owner who is working through separation anxiety training.

═══════════════════════════════════════
DOG PROFILE
═══════════════════════════════════════
Name: ${dog.name}
Breed: ${dog.breed || 'Not specified'}
Age: ${dog.age || 'Not specified'}
Anxiety Severity: ${dog.severity || 'moderate'}
Training Started: ${daysSinceStart} days ago

═══════════════════════════════════════
TRAINING STATISTICS
═══════════════════════════════════════
Total Practices: ${totalPractices}
Overall Calm Rate: ${totalPractices > 0 ? Math.round((totalCalm / totalPractices) * 100) : 0}%
Response Breakdown:
  - Calm: ${totalCalm} (${totalPractices > 0 ? Math.round((totalCalm / totalPractices) * 100) : 0}%)
  - Noticed: ${totalNoticed} (${totalPractices > 0 ? Math.round((totalNoticed / totalPractices) * 100) : 0}%)
  - Anxious: ${totalAnxious} (${totalPractices > 0 ? Math.round((totalAnxious / totalPractices) * 100) : 0}%)

This Week: ${weekTotal} practices, ${weekCalmRate}% calm
Current Streak: ${streak} days
Best Time of Day: ${bestTime} (${Math.round(bestTimeRate * 100)}% calm rate)

═══════════════════════════════════════
CUE PROGRESS
═══════════════════════════════════════
Total Cues: ${cues?.length || 0}

✅ Mastered (${masteredCues.length}):
${masteredCues.map(c => `  - ${c.name}`).join('\n') || '  None yet'}

🔄 In Progress (${inProgressCues.length}):
${inProgressCues.map(c => `  - ${c.name}: ${c.calm_count}/5 calm`).join('\n') || '  None'}

⚠️ Struggling (${strugglingCues.length}):
${strugglingCues.map(c => `  - ${c.name}: ${c.calm_count}/${c.total_practices} calm (${Math.round(((c.calm_count || 0) / (c.total_practices || 1)) * 100)}%)`).join('\n') || '  None'}

📋 Not Started (${notStartedCues.length}):
${notStartedCues.map(c => `  - ${c.name}`).join('\n') || '  None'}

═══════════════════════════════════════
RECENT CONVERSATIONS
═══════════════════════════════════════
${previousEntries?.slice(0, 5).map(e => {
  const date = new Date(e.created_at).toLocaleDateString()
  return `[${date}] Owner: "${e.content}"
[${date}] You: "${e.ai_response?.substring(0, 150)}..."`
}).join('\n\n') || 'No previous conversations'}

═══════════════════════════════════════
YOUR COACHING STYLE
═══════════════════════════════════════
- Warm and encouraging, like a supportive friend who's also a dog trainer
- Casual tone - this is texting, not a formal consultation
- Celebrate small wins enthusiastically
- Normalize setbacks - they're part of the process
- Keep responses concise (2-4 sentences, max 5-6 for complex topics)

EVERY RESPONSE SHOULD:
1. Acknowledge what they shared (empathy first)
2. Reference specific data when relevant (their actual progress, specific cues, patterns)
3. Give ONE specific, actionable suggestion
4. End with encouragement tied to their real progress

NEVER:
- Be preachy or lecture
- Give generic advice that ignores their data
- Overwhelm with multiple suggestions
- Be overly formal
- Write long paragraphs

USE THEIR DATA: You have detailed stats about ${dog.name}. Reference specific cues, their calm rate trends, streak progress, and patterns you notice. Make it personal.`

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 350,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })

    const aiResponse = response.choices[0]?.message?.content || 'I had trouble responding. Please try again.'

    // Save to database
    await supabase.from('journal_entries').insert({
      dog_id: dogId,
      user_id: userId,
      content: message,
      ai_response: aiResponse,
      mood: 'neutral',
    })

    return NextResponse.json({ 
      response: aiResponse,
      rateLimit: { remaining }
    })

  } catch (error) {
    console.error('Journal chat error:', error)
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}