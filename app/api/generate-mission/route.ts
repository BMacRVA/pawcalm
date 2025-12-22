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
    let avgStress = 5
    let successRate = 0

    if (recentSessions && recentSessions.length > 0) {
      const successes = recentSessions.filter((s: any) => s.success).length
      successRate = Math.round((successes / recentSessions.length) * 100)
      avgStress = Math.round(recentSessions.reduce((sum: number, s: any) => sum + s.stress_level, 0) / recentSessions.length)
      
      const recentDurations = recentSessions.slice(0, 3).map((s: any) => s.duration)
      const olderDurations = recentSessions.slice(3, 6).map((s: any) => s.duration)
      
      if (olderDurations.length > 0) {
        const recentAvg = recentDurations.reduce((a: number, b: number) => a + b, 0) / recentDurations.length
        const olderAvg = olderDurations.reduce((a: number, b: number) => a + b, 0) / olderDurations.length
        progressTrend = recentAvg > olderAvg ? "improving" : recentAvg < olderAvg ? "struggling" : "steady"
      }

      sessionContext = `
Recent training history (last ${recentSessions.length} sessions):
- Success rate: ${successRate}%
- Average stress level: ${avgStress}/10
- Progress trend: ${progressTrend}
- Last session: ${recentSessions[0].success ? 'Successful' : 'Struggled'} at ${recentSessions[0].duration} minutes with stress level ${recentSessions[0].stress_level}/10
${recentSessions[0].notes ? `- Owner notes: "${recentSessions[0].notes}"` : ''}`
    }

    // Owner state context
    let ownerContext = ""
    if (ownerState) {
      ownerContext = `
OWNER'S CURRENT STATE:
- Mood: ${ownerState.mood || 'not specified'}
- Energy level: ${ownerState.energy || 'not specified'}
${ownerState.mood === 'anxious' ? '⚠️ Owner is feeling anxious - be extra gentle and reassuring in your tone. Acknowledge their anxiety and remind them its okay.' : ''}
${ownerState.energy === 'low' ? '⚠️ Owner has low energy - keep the mission simple, short, and achievable. Do not overwhelm them.' : ''}
${ownerState.mood === 'confident' && ownerState.energy === 'high' ? '💪 Owner is feeling great - you can be more ambitious with todays mission and push slightly harder.' : ''}
${ownerState.mood === 'anxious' && ownerState.energy === 'low' ? '🌱 Owner needs extra support today - make this the gentlest possible mission. Success is just trying.' : ''}`
    }

    // Calculate smart target
    let targetMinutes = dog.baseline
    
    // Adjust based on session history
    if (successRate >= 80 && avgStress <= 4) {
      targetMinutes = Math.round(dog.baseline * 1.15)
    } else if (successRate >= 60) {
      targetMinutes = Math.round(dog.baseline * 1.1)
    } else if (successRate < 40 || avgStress >= 7) {
      targetMinutes = Math.round(dog.baseline * 0.9)
    }
    
    // Adjust based on owner state
    if (ownerState?.mood === 'anxious' || ownerState?.energy === 'low') {
      targetMinutes = Math.round(targetMinutes * 0.8) // Reduce by 20%
    }
    if (ownerState?.mood === 'confident' && ownerState?.energy === 'high') {
      targetMinutes = Math.round(targetMinutes * 1.1) // Increase by 10%
    }
    
    // Minimum 1 minute
    targetMinutes = Math.max(1, targetMinutes)

    const prompt = `You are an expert dog separation anxiety trainer AND an owner coach. Your job is to help BOTH the dog AND the owner succeed. Remember: 99% of separation anxiety issues stem from owner stress and confusion, not the dog.

DOG PROFILE:
- Name: ${dog.name}
- Breed: ${dog.breed} 
- Age: ${dog.age}
- Baseline alone tolerance: ${dog.baseline} minutes
- Specific behaviors when alone: ${dog.behavior}

${sessionContext}

${ownerContext}

TODAY'S TARGET: ${targetMinutes} minutes

Generate a personalized training mission. Be SPECIFIC to this dog's breed, age, and behavioral patterns. Tailor your tone and approach based on the owner's current state.

Respond with this exact JSON structure:
{
  "title": "Creative, encouraging mission title",
  "targetMinutes": ${targetMinutes},
  "ownerMindset": "A calming, personalized message for the OWNER based on their current mood and energy. If they're anxious, be extra reassuring. If they're confident, be encouraging. Address THEM directly. Be warm and human.",
  "preparation": [
    "Specific prep step 1 (mention ${dog.name} by name)",
    "Specific prep step 2",
    "Specific prep step 3"
  ],
  "steps": [
    "Detailed step 1 with exact timing and what to look for",
    "Detailed step 2 - be specific about body language",
    "Detailed step 3 - include what OWNER should do/feel",
    "Detailed step 4",
    "Detailed step 5 with clear success criteria"
  ],
  "ownerTips": [
    "Coaching tip specific to their current mood/energy",
    "What to do if they feel anxious during the session",
    "How to stay calm and present"
  ],
  "dogTips": [
    "Breed-specific tip for ${dog.breed}",
    "Age-appropriate tip for ${dog.age} dog"
  ],
  "successLooksLike": "Specific description of what success looks like for THIS session at THIS difficulty level",
  "ifStruggles": "Exactly what to do if ${dog.name} shows stress - step by step, reassuring",
  "celebration": "How to celebrate success - important for both dog AND owner confidence"
}

Be warm, specific, and encouraging. Use ${dog.name}'s name throughout. This owner is trying their best - help them feel confident and supported.

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