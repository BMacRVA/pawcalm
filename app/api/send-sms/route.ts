import { NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing phone number or message' }, { status: 400 })
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    })

    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error) {
    console.error('SMS error:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}