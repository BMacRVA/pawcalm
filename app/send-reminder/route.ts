import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    // Verify this is a legitimate cron request (add your own secret)
    const { authorization } = Object.fromEntries(request.headers)
    if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all dogs with SMS enabled
    const { data: dogs } = await supabase
      .from('dogs')
      .select('*, sessions(*)')
      .eq('sms_enabled', true)
      .not('owner_phone', 'is', null)

    if (!dogs || dogs.length === 0) {
      return NextResponse.json({ message: 'No dogs with SMS enabled' })
    }

    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()

    let sentCount = 0

    for (const dog of dogs) {
      // Check if it's the right time for this user's reminder
      const [reminderHour, reminderMinute] = (dog.reminder_time || '09:00').split(':').map(Number)
      
      // Simple check - within 30 min window (you'd want timezone handling in production)
      if (Math.abs(currentHour - reminderHour) > 0) continue

      // Check if they already did a session today
      const today = new Date().toISOString().split('T')[0]
      const todaySession = dog.sessions?.find((s: any) => 
        s.created_at.startsWith(today)
      )

      if (todaySession) continue // Already trained today

      // Calculate streak
      const sessions = dog.sessions || []
      let streak = 0
      const sortedSessions = sessions.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      for (let i = 0; i < sortedSessions.length; i++) {
        const sessionDate = new Date(sortedSessions[i].created_at)
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
      } else if (sessions.length === 0) {
        message = `Hey! Ready for ${dog.name}'s first training session? It only takes 5 minutes. https://pawcalm.ai/mission`
      } else {
        const lastSession = sortedSessions[0]
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