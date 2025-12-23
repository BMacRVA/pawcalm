import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { dog, recentSessions, ownerState } = await request.json()

    console.log('Generating mission for:', dog.name)

    // Fetch additional training data
    const [cuePracticesRes, videoAnalysesRes] = await Promise.all([
      supabase
        .from('cue_practices')
        .select('*')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('video_analyses')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('status', 'analyzed')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const cuePractices = cuePracticesRes.data || []
    const videoAnalyses = videoAnalysesRes.data || []

    // ===== ANALYZE SESSIONS =====
    let sessionContext = "No previous sessions recorded yet - this is their first mission."
    let progressTrend = "just starting"
    let recentStruggleCount = 0
    let recentGreatCount = 0
    let consecutiveStruggles = 0
    let lastSessionWasStruggle = false
    let whatWorked: string[] = []
    let whatDidntWork: string[] = []

    if (recentSessions && recentSessions.length > 0) {
      const last5 = recentSessions.slice(0, 5)
      recentGreatCount = last5.filter((s: any) => s.dog_response === 'great').length
      recentStruggleCount = last5.filter((s: any) => s.dog_response === 'struggled').length
      
      for (const session of recentSessions) {
        if (session.dog_response === 'struggled') {
          consecutiveStruggles++
        } else {
          break
        }
      }
      
      lastSessionWasStruggle = recentSessions[0]?.dog_response === 'struggled'
      
      // Extract what worked and what didn't
      recentSessions.forEach((s: any) => {
        if (s.dog_response === 'great' && s.mission_title) {
          whatWorked.push(s.mission_title)
        }
        if (s.dog_response === 'struggled' && s.mission_title) {
          whatDidntWork.push(s.mission_title)
        }
      })
      
      const older5 = recentSessions.slice(5, 10)
      if (older5.length > 0) {
        const recentScore = last5.reduce((sum: number, s: any) => {
          if (s.dog_response === 'great') return sum + 2
          if (s.dog_response === 'okay') return sum + 1
          return sum - 1
        }, 0) / last5.length
        
        const olderScore = older5.reduce((sum: number, s: any) => {
          if (s.dog_response === 'great') return sum + 2
          if (s.dog_response === 'okay') return sum + 1
          return sum - 1
        }, 0) / older5.length
        
        if (recentScore > olderScore + 0.3) progressTrend = "improving"
        else if (recentScore < olderScore - 0.3) progressTrend = "struggling"
        else progressTrend = "steady"
      }

      const lastSession = recentSessions[0]
      sessionContext = `
Recent training history (last ${recentSessions.length} sessions):
- Great responses: ${recentGreatCount}/5 recent sessions
- Struggled responses: ${recentStruggleCount}/5 recent sessions
- Progress trend: ${progressTrend}
- Last session: ${lastSession.dog_response || 'unknown'} response
${lastSession.mission_title ? `- Last mission: "${lastSession.mission_title}"` : ''}
${lastSession.notes ? `- Owner notes from last session: "${lastSession.notes}"` : ''}
${whatWorked.length > 0 ? `- MISSIONS THAT WORKED WELL: ${whatWorked.slice(0, 3).join(', ')}` : ''}
${whatDidntWork.length > 0 ? `- MISSIONS THAT WERE TOO HARD: ${whatDidntWork.slice(0, 3).join(', ')}` : ''}
${consecutiveStruggles >= 2 ? `⚠️ DOG HAS STRUGGLED ${consecutiveStruggles} SESSIONS IN A ROW - MUST REGRESS DIFFICULTY` : ''}`
    }

    // ===== ANALYZE CUE PRACTICES =====
    let cueContext = ""
    if (cuePractices.length > 0) {
      const cueStats: Record<string, { calm: number; noticed: number; anxious: number }> = {}
      
      cuePractices.forEach((practice: any) => {
        practice.cues?.forEach((cue: any) => {
          if (!cueStats[cue.cue_name]) {
            cueStats[cue.cue_name] = { calm: 0, noticed: 0, anxious: 0 }
          }
          if (cue.response === 'calm') cueStats[cue.cue_name].calm++
          if (cue.response === 'noticed') cueStats[cue.cue_name].noticed++
          if (cue.response === 'anxious') cueStats[cue.cue_name].anxious++
        })
      })

      const stressfulCues: string[] = []
      const masteredCues: string[] = []
      const workingOnCues: string[] = []

      Object.entries(cueStats).forEach(([name, stats]) => {
        const total = stats.calm + stats.noticed + stats.anxious
        const calmRate = stats.calm / total
        const anxiousRate = stats.anxious / total
        
        if (calmRate >= 0.7) masteredCues.push(name)
        else if (anxiousRate >= 0.5) stressfulCues.push(name)
        else workingOnCues.push(name)
      })

      cueContext = `
DEPARTURE CUE ANALYSIS (from ${cuePractices.length} practice sessions):
${stressfulCues.length > 0 ? `- 🔴 STRESSFUL CUES (avoid or work on gently): ${stressfulCues.join(', ')}` : ''}
${workingOnCues.length > 0 ? `- 🟡 WORKING ON: ${workingOnCues.join(', ')}` : ''}
${masteredCues.length > 0 ? `- 🟢 MASTERED CUES (can incorporate): ${masteredCues.join(', ')}` : ''}
${stressfulCues.length > 0 ? `⚠️ IMPORTANT: ${stressfulCues[0]} causes the most anxiety - consider including desensitization work for this cue.` : ''}`
    }

    // ===== ANALYZE VIDEO DATA =====
    let videoContext = ""
    if (videoAnalyses.length > 0) {
      const latestVideo = videoAnalyses[0]
      const allTriggers: string[] = []
      
      videoAnalyses.forEach((v: any) => {
        if (v.triggers_detected) {
          allTriggers.push(...v.triggers_detected)
        }
      })
      
      const triggerCounts: Record<string, number> = {}
      allTriggers.forEach(t => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1
      })
      
      const topTriggers = Object.entries(triggerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t]) => t)

      // Determine anxiety trend from videos
      let videoAnxietyTrend = "unknown"
      if (videoAnalyses.length >= 2) {
        const getLevel = (analysis: string) => {
          const lower = analysis.toLowerCase()
          if (lower.includes('none') || lower.includes('calm')) return 0
          if (lower.includes('mild')) return 1
          if (lower.includes('moderate')) return 2
          return 3
        }
        const firstLevel = getLevel(videoAnalyses[videoAnalyses.length - 1].analysis || '')
        const lastLevel = getLevel(videoAnalyses[0].analysis || '')
        
        if (lastLevel < firstLevel) videoAnxietyTrend = "improving"
        else if (lastLevel > firstLevel) videoAnxietyTrend = "worsening"
        else videoAnxietyTrend = "stable"
      }

      videoContext = `
VIDEO ANALYSIS INSIGHTS (from ${videoAnalyses.length} analyzed videos):
- Most common triggers observed: ${topTriggers.join(', ') || 'none identified'}
- Video anxiety trend: ${videoAnxietyTrend}
- Latest video summary: ${latestVideo.analysis?.substring(0, 200) || 'No summary available'}...
${topTriggers.length > 0 ? `⚠️ Consider incorporating work on these observed triggers: ${topTriggers.slice(0, 2).join(', ')}` : ''}`
    }

    // ===== OWNER STATE =====
    let ownerContext = ""
    if (ownerState) {
      ownerContext = `
OWNER'S CURRENT STATE:
- Mood: ${ownerState.mood || 'not specified'}
- Energy level: ${ownerState.energy || 'not specified'}
${ownerState.mood === 'anxious' ? '⚠️ Owner is feeling anxious - be extra gentle and reassuring in your tone.' : ''}
${ownerState.energy === 'low' ? '⚠️ Owner has low energy - keep the mission simple, short, and achievable.' : ''}
${ownerState.mood === 'confident' && ownerState.energy === 'high' ? '💪 Owner is feeling great - you can be slightly more ambitious.' : ''}`
    }

    // ===== SMART DIFFICULTY ADJUSTMENT =====
    let targetMinutes = dog.baseline
    let difficultyNote = ""
    
    if (consecutiveStruggles >= 3) {
      targetMinutes = Math.round(dog.baseline * 0.5)
      difficultyNote = "MAJOR REGRESSION: Dog has struggled 3+ times. Go back to basics - make this very easy to rebuild confidence."
    } else if (consecutiveStruggles >= 2) {
      targetMinutes = Math.round(dog.baseline * 0.7)
      difficultyNote = "REGRESSION: Dog struggled twice in a row. Reduce difficulty significantly to rebuild confidence."
    } else if (lastSessionWasStruggle) {
      targetMinutes = Math.round(dog.baseline * 0.85)
      difficultyNote = "SLIGHT REGRESSION: Last session was tough. Make today a bit easier."
    } else if (recentGreatCount >= 4 && recentStruggleCount === 0) {
      targetMinutes = Math.round(dog.baseline * 1.15)
      difficultyNote = "PROGRESSION: Dog is doing great! Gently increase the challenge."
    } else if (recentGreatCount >= 3) {
      targetMinutes = Math.round(dog.baseline * 1.1)
      difficultyNote = "SLIGHT PROGRESSION: Good progress. Small increase in difficulty."
    }
    
    if (ownerState?.mood === 'anxious' || ownerState?.energy === 'low') {
      targetMinutes = Math.round(targetMinutes * 0.8)
      difficultyNote += " OWNER ADJUSTMENT: Reduced due to owner's current state."
    }
    if (ownerState?.mood === 'confident' && ownerState?.energy === 'high' && !lastSessionWasStruggle) {
      targetMinutes = Math.round(targetMinutes * 1.1)
    }
    
    targetMinutes = Math.max(1, Math.min(targetMinutes, 60))

    // ===== BUILD PROMPT =====
    const prompt = `You are an expert dog separation anxiety trainer that LEARNS from past data. Your job is to create a mission personalized to THIS specific dog's history.

DOG PROFILE:
- Name: ${dog.name}
- Breed: ${dog.breed} 
- Age: ${dog.age}
- Baseline alone tolerance: ${dog.baseline} minutes
- Specific behaviors when alone: ${dog.behavior}

${sessionContext}

${cueContext}

${videoContext}

${ownerContext}

TODAY'S TARGET: ${targetMinutes} minutes
${difficultyNote ? `\n⚠️ DIFFICULTY ADJUSTMENT: ${difficultyNote}` : ''}

IMPORTANT INSTRUCTIONS FOR PERSONALIZATION:
1. If certain mission types worked well before, consider similar approaches
2. If certain mission types failed, try a different approach
3. If specific cues cause stress, incorporate gentle desensitization OR avoid them
4. If video analysis shows specific triggers, address them in the mission
5. Reference ${dog.name}'s actual history in your ownerMindset message to show you "remember"

Generate a personalized training mission.
${consecutiveStruggles >= 2 ? 'CRITICAL: This dog has been struggling. Today\'s mission MUST be significantly easier - focus on rebuilding confidence, not pushing forward.' : ''}

Respond with this exact JSON structure:
{
  "title": "Creative, encouraging mission title that reflects the specific focus",
  "targetMinutes": ${targetMinutes},
  "ownerMindset": "A personalized message that references ${dog.name}'s actual progress and history. Mention specific wins or challenges from their data.",
  "preparation": [
    "Specific prep step 1 (mention ${dog.name} by name)",
    "Specific prep step 2",
    "Specific prep step 3"
  ],
  "steps": [
    "Detailed step 1 with exact timing",
    "Detailed step 2 - incorporate learnings from past sessions",
    "Detailed step 3 - address specific triggers if identified",
    "Detailed step 4",
    "Detailed step 5 with clear success criteria"
  ],
  "ownerTips": [
    "Coaching tip for the owner",
    "What to do if they feel anxious",
    "How to stay calm"
  ],
  "dogTips": [
    "Breed-specific tip for ${dog.breed}",
    "Age-appropriate tip for ${dog.age} dog"
  ],
  "successLooksLike": "Specific description of success that accounts for ${dog.name}'s current level",
  "ifStruggles": "Exactly what to do if ${dog.name} shows stress - be specific based on their known triggers",
  "celebration": "How to celebrate - important for confidence"
}

Be warm, specific, and show that you've LEARNED from their history. Use ${dog.name}'s name throughout.

Only respond with valid JSON, no markdown, no backticks.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || '{}'
    console.log('OpenAI response:', content)
    
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const mission = JSON.parse(cleanContent)

    return NextResponse.json(mission)
  } catch (error) {
    console.error('Error generating mission:', error)
    return NextResponse.json(
      { error: 'Failed to generate mission', details: String(error) },
      { status: 500 }
    )
  }
}