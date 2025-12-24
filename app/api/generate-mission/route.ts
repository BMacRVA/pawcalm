import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { dog, recentSessions, ownerState } = await request.json()

    // Fetch cue practices and video analyses
    const [cuePracticesRes, videoAnalysesRes] = await Promise.all([
      supabase
        .from('cue_practices')
        .select('*')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })
        .limit(30),
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

    // ===== ANALYZE CUES =====
    const cueHistory: Record<string, { 
      calm: number
      noticed: number
      anxious: number
      total: number 
    }> = {}
    
    cuePractices.forEach((practice: any) => {
      practice.cues?.forEach((cue: any) => {
        if (!cueHistory[cue.cue_name]) {
          cueHistory[cue.cue_name] = { calm: 0, noticed: 0, anxious: 0, total: 0 }
        }
        cueHistory[cue.cue_name].total++
        if (cue.response === 'calm') cueHistory[cue.cue_name].calm++
        if (cue.response === 'noticed') cueHistory[cue.cue_name].noticed++
        if (cue.response === 'anxious') cueHistory[cue.cue_name].anxious++
      })
    })

    const masteredCues: string[] = []
    const workingOnCues: string[] = []
    const stressfulCues: string[] = []

    Object.entries(cueHistory).forEach(([name, stats]) => {
      const calmRate = stats.calm / stats.total
      if (stats.total >= 2 && calmRate >= 0.7) {
        masteredCues.push(name)
      } else if (calmRate < 0.3) {
        stressfulCues.push(name)
      } else {
        workingOnCues.push(name)
      }
    })

    // ===== CHECK READINESS =====
    if (masteredCues.length < 3) {
      return NextResponse.json({ 
        error: 'Not ready for absence training',
        masteredCues: masteredCues.length,
        needed: 3 - masteredCues.length
      }, { status: 400 })
    }

    // ===== ANALYZE SESSIONS =====
    let sessionContext = ""
    let consecutiveStruggles = 0
    let recentGreatCount = 0
    let recentStruggleCount = 0
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

      recentSessions.forEach((s: any) => {
        if (s.dog_response === 'great' && s.mission_title) {
          whatWorked.push(s.mission_title)
        }
        if (s.dog_response === 'struggled' && s.mission_title) {
          whatDidntWork.push(s.mission_title)
        }
      })

      const lastSession = recentSessions[0]
      sessionContext = `
PREVIOUS SESSIONS (${recentSessions.length} total):
- Recent results: ${recentGreatCount} great, ${recentStruggleCount} struggled in last 5
- Last session: ${lastSession.dog_response}
${lastSession.mission_title ? `- Last mission: "${lastSession.mission_title}"` : ''}
${lastSession.notes ? `- Owner observed: "${lastSession.notes}"` : ''}
${whatWorked.length > 0 ? `- APPROACHES THAT WORKED: ${whatWorked.slice(0, 3).join(', ')}` : ''}
${whatDidntWork.length > 0 ? `- APPROACHES TO AVOID: ${whatDidntWork.slice(0, 3).join(', ')}` : ''}
${consecutiveStruggles >= 2 ? `⚠️ ${consecutiveStruggles} struggles in a row — significantly reduce difficulty` : ''}`
    }

    // ===== VIDEO INSIGHTS =====
    let videoContext = ""
    if (videoAnalyses.length > 0) {
      const allTriggers = videoAnalyses.flatMap((v: any) => v.triggers_detected || [])
      const uniqueTriggers = [...new Set(allTriggers)]
      
      videoContext = `
VIDEO OBSERVATIONS:
- Triggers seen on camera: ${uniqueTriggers.join(', ') || 'none identified'}
- Use this to inform which cues to incorporate or avoid`
    }

    // ===== OWNER STATE =====
    let ownerContext = ""
    if (ownerState) {
      ownerContext = `
OWNER TODAY: ${ownerState.mood} mood, ${ownerState.energy} energy
${ownerState.mood === 'anxious' || ownerState.energy === 'low' ? '→ Keep session simple and short' : ''}`
    }

    // ===== CALCULATE TARGET DURATION =====
    let targetMinutes = dog.baseline || 5
    
    if (consecutiveStruggles >= 3) {
      targetMinutes = Math.max(1, Math.round(targetMinutes * 0.5))
    } else if (consecutiveStruggles >= 2) {
      targetMinutes = Math.max(1, Math.round(targetMinutes * 0.7))
    } else if (consecutiveStruggles === 1) {
      targetMinutes = Math.max(1, Math.round(targetMinutes * 0.85))
    } else if (recentGreatCount >= 4 && recentStruggleCount === 0) {
      targetMinutes = Math.round(targetMinutes * 1.15)
    }
    
    if (ownerState?.mood === 'anxious' || ownerState?.energy === 'low') {
      targetMinutes = Math.round(targetMinutes * 0.8)
    }
    
    targetMinutes = Math.max(1, Math.min(targetMinutes, 60))

    // ===== BUILD THE PROMPT =====
    const prompt = `You are an expert dog separation anxiety trainer. You create personalized absence training sessions based on each dog's specific progress with departure cues.

DOG: ${dog.name}
- Breed: ${dog.breed}
- Age: ${dog.age}
- Baseline tolerance: ${dog.baseline} minutes
- Behaviors when anxious: ${dog.behavior}

CUE MASTERY STATUS:
✅ MASTERED (build the session around these): ${masteredCues.join(', ')}
🟡 WORKING ON (can include gently): ${workingOnCues.join(', ') || 'none'}
🔴 STRESSFUL (avoid): ${stressfulCues.join(', ') || 'none'}

${sessionContext}

${videoContext}

${ownerContext}

TODAY'S SESSION:
- Target duration: ${targetMinutes} minutes
- The departure routine MUST incorporate these mastered cues: ${masteredCues.slice(0, 3).join(', ')}
${stressfulCues.length > 0 ? `- AVOID these triggers: ${stressfulCues.join(', ')}` : ''}

Generate a personalized absence training session.

CRITICAL INSTRUCTIONS:
1. The session steps MUST use the specific mastered cues (${masteredCues.slice(0, 3).join(', ')})
2. Create a natural departure routine that incorporates those cues
3. If certain approaches worked before, use similar strategies
4. If certain approaches failed, try something different
5. Be specific — mention ${dog.name}'s mastered cues by name in the steps
6. The owner WILL actually leave for ${targetMinutes} minutes

Respond with this exact JSON:
{
  "title": "Engaging title for this absence session",
  "targetMinutes": ${targetMinutes},
  "cuesIncorporated": [${masteredCues.slice(0, 3).map(c => `"${c}"`).join(', ')}],
  "ownerMindset": "Personalized encouragement referencing their progress with specific cues they've mastered",
  "preparation": [
    "Prep step mentioning ${dog.name}",
    "Prep step 2",
    "Prep step 3"
  ],
  "steps": [
    "Step using ${masteredCues[0] || 'first mastered cue'}",
    "Step using ${masteredCues[1] || 'second mastered cue'}",
    "Step using ${masteredCues[2] || 'third mastered cue'} and leaving",
    "What to do during the ${targetMinutes} minutes away",
    "Calm return protocol"
  ],
  "ownerTips": [
    "Tip based on their dog's specific patterns",
    "Tip for staying calm during the absence"
  ],
  "dogTips": [
    "Breed-specific insight for ${dog.breed}",
    "Age-appropriate tip"
  ],
  "successLooksLike": "Specific success criteria for a ${targetMinutes}-minute absence",
  "ifStruggles": "What to do if ${dog.name} shows stress — specific to their known triggers",
  "celebration": "How to celebrate after a successful absence"
}

Only respond with valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || '{}'
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