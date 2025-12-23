import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { dog, recentSessions, ownerState } = await request.json()

    console.log('Generating mission for:', dog.name)

    // Analyze recent session patterns
    let sessionContext = "No previous sessions recorded yet - this is their first mission."
    let progressTrend = "just starting"
    let recentStruggleCount = 0
    let recentGreatCount = 0
    let consecutiveStruggles = 0
    let lastSessionWasStruggle = false

    if (recentSessions && recentSessions.length > 0) {
      // Count responses from recent sessions
      const last5 = recentSessions.slice(0, 5)
      recentGreatCount = last5.filter((s: any) => s.dog_response === 'great').length
      recentStruggleCount = last5.filter((s: any) => s.dog_response === 'struggled').length
      
      // Check for consecutive struggles (for smart regression)
      for (const session of recentSessions) {
        if (session.dog_response === 'struggled') {
          consecutiveStruggles++
        } else {
          break
        }
      }
      
      lastSessionWasStruggle = recentSessions[0]?.dog_response === 'struggled'
      
      // Determine trend
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
${lastSession.notes ? `- Owner notes: "${lastSession.notes}"` : ''}
${consecutiveStruggles >= 2 ? `⚠️ DOG HAS STRUGGLED ${consecutiveStruggles} SESSIONS IN A ROW - MUST REGRESS DIFFICULTY` : ''}`
    }

    // Owner state context
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

    // SMART REGRESSION LOGIC
    let targetMinutes = dog.baseline
    let difficultyNote = ""
    
    // Regression: dial back after struggles
    if (consecutiveStruggles >= 3) {
      // Major regression: 3+ struggles in a row
      targetMinutes = Math.round(dog.baseline * 0.5)
      difficultyNote = "MAJOR REGRESSION: Dog has struggled 3+ times. Go back to basics - make this very easy to rebuild confidence."
    } else if (consecutiveStruggles >= 2) {
      // Moderate regression: 2 struggles in a row
      targetMinutes = Math.round(dog.baseline * 0.7)
      difficultyNote = "REGRESSION: Dog struggled twice in a row. Reduce difficulty significantly to rebuild confidence."
    } else if (lastSessionWasStruggle) {
      // Minor regression: 1 struggle
      targetMinutes = Math.round(dog.baseline * 0.85)
      difficultyNote = "SLIGHT REGRESSION: Last session was tough. Make today a bit easier."
    } else if (recentGreatCount >= 4 && recentStruggleCount === 0) {
      // Progression: doing great!
      targetMinutes = Math.round(dog.baseline * 1.15)
      difficultyNote = "PROGRESSION: Dog is doing great! Gently increase the challenge."
    } else if (recentGreatCount >= 3) {
      // Slight progression
      targetMinutes = Math.round(dog.baseline * 1.1)
      difficultyNote = "SLIGHT PROGRESSION: Good progress. Small increase in difficulty."
    }
    
    // Adjust based on owner state
    if (ownerState?.mood === 'anxious' || ownerState?.energy === 'low') {
      targetMinutes = Math.round(targetMinutes * 0.8)
      difficultyNote += " OWNER ADJUSTMENT: Reduced due to owner's current state."
    }
    if (ownerState?.mood === 'confident' && ownerState?.energy === 'high' && !lastSessionWasStruggle) {
      targetMinutes = Math.round(targetMinutes * 1.1)
    }
    
    // Bounds
    targetMinutes = Math.max(1, Math.min(targetMinutes, 60))

    const prompt = `You are an expert dog separation anxiety trainer AND an owner coach. Your job is to help BOTH the dog AND the owner succeed.

DOG PROFILE:
- Name: ${dog.name}
- Breed: ${dog.breed} 
- Age: ${dog.age}
- Baseline alone tolerance: ${dog.baseline} minutes
- Specific behaviors when alone: ${dog.behavior}

${sessionContext}

${ownerContext}

TODAY'S TARGET: ${targetMinutes} minutes
${difficultyNote ? `\n⚠️ DIFFICULTY ADJUSTMENT: ${difficultyNote}` : ''}

Generate a personalized training mission. 
${consecutiveStruggles >= 2 ? 'CRITICAL: This dog has been struggling. Today\'s mission MUST be significantly easier - focus on rebuilding confidence, not pushing forward. Success today is more important than progress.' : ''}

Respond with this exact JSON structure:
{
  "title": "Creative, encouraging mission title",
  "targetMinutes": ${targetMinutes},
  "ownerMindset": "A calming, personalized message for the OWNER. ${consecutiveStruggles >= 2 ? 'Acknowledge the recent struggles and reassure them that going backwards is normal and necessary.' : 'Be warm and supportive based on their mood.'}",
  "preparation": [
    "Specific prep step 1 (mention ${dog.name} by name)",
    "Specific prep step 2",
    "Specific prep step 3"
  ],
  "steps": [
    "Detailed step 1 with exact timing",
    "Detailed step 2 - be specific about body language",
    "Detailed step 3",
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
  "successLooksLike": "Specific description of success for THIS difficulty level. ${consecutiveStruggles >= 2 ? 'Make the success criteria VERY achievable - any calm moment counts.' : ''}",
  "ifStruggles": "Exactly what to do if ${dog.name} shows stress - reassuring and specific",
  "celebration": "How to celebrate - important for confidence"
}

Be warm, specific, and encouraging. Use ${dog.name}'s name throughout.

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