import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { dog } = await request.json()

    console.log('Generating mission for:', dog.name)

    const prompt = `You are a certified dog separation anxiety trainer. Create a training mission for today.

Dog Profile:
- Name: ${dog.name}
- Breed: ${dog.breed}
- Age: ${dog.age}
- Current alone time tolerance: ${dog.baseline} minutes
- Behavior when alone: ${dog.behavior}

Generate a JSON response with:
{
  "title": "Short mission title",
  "targetMinutes": ${Math.round(dog.baseline * 1.1)},
  "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "tips": ["tip 1", "tip 2"],
  "warningSign": "One key sign to watch for"
}

Only respond with valid JSON, no markdown, no backticks, just the JSON object.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || '{}'
    console.log('OpenAI response:', content)
    
    // Clean the response in case it has markdown
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