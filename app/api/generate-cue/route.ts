import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { triggerName, dogName } = await request.json()

    const prompt = `You are an expert dog separation anxiety trainer. A dog owner wants to desensitize their dog "${dogName}" to a departure cue/trigger.

The trigger is: "${triggerName}"

Generate practice instructions for this trigger. The goal is to help the dog become bored/neutral to this action so it no longer signals that the owner is leaving.

Respond with this exact JSON format:
{
  "instructions": "Clear, specific instructions for what the owner should do. Include repeating the action 10 times. Keep it to 2-3 sentences. Be casual and don't look at the dog while doing it.",
  "success_looks_like": "What calm behavior looks like for this specific trigger. 1-2 sentences.",
  "if_struggling": "A simpler version of this action to try if the dog gets anxious. 1-2 sentences."
}

Only respond with valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || '{}'
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const cue = JSON.parse(cleanContent)

    return NextResponse.json(cue)
  } catch (error) {
    console.error('Error generating cue:', error)
    return NextResponse.json(
      { error: 'Failed to generate cue' },
      { status: 500 }
    )
  }
}