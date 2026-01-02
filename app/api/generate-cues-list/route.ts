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
    // Authenticate the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dog } = await request.json()

    // Verify the dog belongs to this user
    const { data: dogData, error: dogError } = await supabase
      .from('dogs')
      .select('user_id')
      .eq('id', dog.id)
      .single()

    if (dogError || !dogData || dogData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - dog does not belong to user' }, { status: 403 })
    }

    const triggers = dog.triggers?.length > 0 
      ? dog.triggers.join(', ') 
      : 'keys, shoes, door, bag (common triggers - owner did not specify)'
    
    const customTriggers = dog.custom_triggers?.length > 0 
      ? dog.custom_triggers.join(', ') 
      : 'none specified'
    
    const behaviors = dog.behaviors?.length > 0 
      ? dog.behaviors.join(', ') 
      : dog.behavior || 'general anxiety when left alone'
    
    const severity = dog.severity || 'moderate'
    const baseline = dog.baseline || 5

    const prompt = `You are an expert dog separation anxiety trainer with years of experience helping thousands of dogs. Based on this dog's profile, generate a personalized list of 8 departure cue exercises.

DOG PROFILE:
- Name: ${dog.name}
- Breed: ${dog.breed || 'mixed breed'}
- Age: ${dog.age || 'adult'}
- Anxiety severity: ${severity}
- Current baseline: ${baseline} minutes alone
- Triggers that cause anxiety: ${triggers}
- Custom triggers from owner: ${customTriggers}
- Behaviors when anxious: ${behaviors}
- Owner schedule: ${dog.owner_schedule || 'typical work schedule'}
- Goal duration alone: ${dog.leave_duration || '4-8 hours'}

Generate exactly 8 cue exercises that are MOST RELEVANT to this specific dog. Include:
1. Cues matching any triggers they specified
2. The most common and important departure cues (keys, shoes, door, jacket, bag)
3. Any breed-specific considerations
4. Severity-appropriate difficulty (gentler for severe, can be more direct for mild)

Each cue should be a small, repeatable action the owner does WITHOUT actually leaving.

CRITICAL - CUE NAMING RULES:
- Names MUST be descriptive action phrases like "Pick up my keys", "Put on my shoes", "Touch the door handle"
- Names should describe WHAT THE OWNER DOES, not just the object
- Use first person ("my keys" not "keys")
- DO NOT use generic names like "Keys Cue" or "Door Cue"
- Good examples: "Pick up my keys", "Put on my jacket", "Grab my work bag", "Open the front door slightly"
- Bad examples: "Keys Cue", "Door Cue", "Jacket", "Keys"

Respond with this exact JSON format:
{
  "cues": [
    {
      "id": "unique-id-no-spaces",
      "name": "Descriptive action phrase (e.g., 'Pick up my keys')",
      "icon": "single emoji that represents this action",
      "instructions": "Clear 2-3 sentence instructions. Include 'Repeat 10 times.' Be specific about what to do. Tell them to act casual and not make eye contact with the dog.",
      "success_looks_like": "What calm behavior looks like for this specific trigger. 1-2 sentences.",
      "if_struggling": "An easier version to try if the dog gets anxious. 1-2 sentences.",
      "priority": "high" or "medium" or "low",
      "reason": "One sentence explaining why this cue is relevant for ${dog.name}"
    }
  ],
  "personalized_message": "A warm, encouraging 1-2 sentence message about why these specific cues were chosen for ${dog.name} based on their profile."
}

IMPORTANT: 
- Generate exactly 8 cues
- Use varied, appropriate emojis for each cue
- Make instructions specific and actionable
- Priority should be "high" for their specific triggers, "medium" for common cues, "low" for nice-to-haves
- REMEMBER: Names must be descriptive actions like "Pick up my keys", NOT "Keys Cue"

Only respond with valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || '{}'
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleanContent)

    if (!result.cues || result.cues.length === 0) {
      throw new Error('No cues generated')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating cue list:', error)
    
    // Return fallback cues if AI fails
    return NextResponse.json({
      cues: [
        {
          id: 'keys',
          name: 'Pick up my keys',
          icon: '🔑',
          instructions: 'Pick up your keys, hold for 2 seconds, then put them down. Don\'t look at your dog. Repeat 10 times.',
          success_looks_like: 'Your dog stays relaxed — no pacing, whining, or following.',
          if_struggling: 'Just touch the keys without picking them up.',
          priority: 'high',
          reason: 'Keys are one of the most common departure triggers.'
        },
        {
          id: 'shoes',
          name: 'Put on my shoes',
          icon: '👟',
          instructions: 'Put on your shoes, walk around briefly, then take them off. Act casual. Repeat 10 times.',
          success_looks_like: 'Your dog notices but doesn\'t get up or show anxiety.',
          if_struggling: 'Just touch your shoes, then sit back down.',
          priority: 'high',
          reason: 'Shoes signal you\'re about to leave.'
        },
        {
          id: 'jacket',
          name: 'Put on my jacket',
          icon: '🧥',
          instructions: 'Put on your jacket, wait 5 seconds, then take it off. Repeat 10 times.',
          success_looks_like: 'Your dog stays settled and doesn\'t get anxious.',
          if_struggling: 'Just pick up the jacket without putting it on.',
          priority: 'high',
          reason: 'Jackets are a strong departure signal.'
        },
        {
          id: 'bag',
          name: 'Grab my bag',
          icon: '👜',
          instructions: 'Pick up your bag, carry it for a moment, then put it down. Repeat 10 times.',
          success_looks_like: 'Your dog remains calm and doesn\'t follow you.',
          if_struggling: 'Just touch the bag without picking it up.',
          priority: 'medium',
          reason: 'Bags often signal leaving for work or errands.'
        },
        {
          id: 'door-touch',
          name: 'Touch the door handle',
          icon: '🚪',
          instructions: 'Walk to the door, touch the handle, then walk away. Don\'t open it. Repeat 10 times.',
          success_looks_like: 'Your dog notices but doesn\'t rush to the door.',
          if_struggling: 'Walk toward the door but stop halfway.',
          priority: 'high',
          reason: 'The door is the final departure point and often triggers panic.'
        },
        {
          id: 'door-open',
          name: 'Open the door slightly',
          icon: '🚪',
          instructions: 'Open the door a few inches, pause, then close it. Don\'t step out. Repeat 10 times.',
          success_looks_like: 'Your dog stays calm and doesn\'t try to block the door.',
          if_struggling: 'Go back to just touching the handle.',
          priority: 'medium',
          reason: 'Opening the door is the next step after touching it.'
        },
        {
          id: 'phone-door',
          name: 'Check my phone by the door',
          icon: '📱',
          instructions: 'Walk to the door while looking at your phone, pause, then walk away. Repeat 10 times.',
          success_looks_like: 'Your dog remains relaxed and doesn\'t follow.',
          if_struggling: 'Check your phone further from the door first.',
          priority: 'medium',
          reason: 'Many people check their phone before leaving.'
        },
        {
          id: 'coffee',
          name: 'Do my morning routine',
          icon: '☕',
          instructions: 'Do a quick part of your morning routine (rinse cup, check bag), then sit back down. Repeat 10 times.',
          success_looks_like: 'Your dog doesn\'t associate this with leaving.',
          if_struggling: 'Do smaller pieces of the routine separately.',
          priority: 'medium',
          reason: 'Breaking the routine-to-departure association helps.'
        }
      ],
      personalized_message: 'These cues cover the most common departure triggers. As you practice, you\'ll discover which ones are most important for your dog.'
    })
  }
}