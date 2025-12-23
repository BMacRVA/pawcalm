import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all dogs with SMS enabled
    const { data: dogs } = await supabase
      .from('dogs')
      .select('*')
      .eq('sms_enabled', true)
      .not('owner_phone', 'is', null)

    if (!dogs || dogs.length === 0) {
      return NextResponse.json({ message: 'No dogs with SMS enabled' })
    }

    let sentCount = 0

    for (const dog of dogs) {
      // Get sessions for this dog
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })

      const allSessions = sessions || []

      // Check if they already did a session today
      const today = new Date().toISOString().split('T')[0]
      const todaySession = allSessions.find((s: any) => 
        s.created_at.startsWith(today)
      )

      if (todaySession) continue // Already trained today

      // Calculate streak
      let streak = 0
      for (let i = 0; i < allSessions.length; i++) {
        const sessionDate = new Date(allSessions[i].created_at)
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i - 1)
        
        if (sessionDate.toDateString() === expectedDate.toDateString()) {
          streak++
        } else {
          break
        }
      }

      // Craft personalized message
      let message = ''
      
      if (streak >= 3) {
        message = `🔥 ${dog.name} has a ${streak}-day streak! Don't break it — time for today's 5-min session. https://pawcalm.ai/mission`
      } else if (allSessions.length === 0) {
        message = `Hey! Ready for ${dog.name}'s first training session? It only takes 5 minutes. https://pawcalm.ai/mission`
      } else {
        const lastSession = allSessions[0]
        const lastResponse = lastSession?.dog_response
        
        if (lastResponse === 'struggled') {
          message = `${dog.name} had a tough session yesterday — today will be easier. Let's rebuild confidence! https://pawcalm.ai/mission`
        } else {
          message = `Time for ${dog.name}'s daily practice! 5 minutes to a calmer pup 🐕 https://pawcalm.ai/mission`
        }
      }

      // Send SMS
      try {
        await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: dog.owner_phone
        })
        sentCount++
      } catch (smsError) {
        console.error(`Failed to send SMS to ${dog.owner_phone}:`, smsError)
      }
    }

    return NextResponse.json({ success: true, sent: sentCount })
  } catch (error) {
    console.error('Reminder error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}