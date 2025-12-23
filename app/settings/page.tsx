'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

export default function SettingsPage() {
  const [phone, setPhone] = useState('')
  const [reminderTime, setReminderTime] = useState('09:00')
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dogId, setDogId] = useState<string | null>(null)
  const [dogName, setDogName] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dog) {
      setDogId(dog.id)
      setDogName(dog.name)
      setPhone(dog.owner_phone || '')
      setReminderTime(dog.reminder_time || '09:00')
      setSmsEnabled(dog.sms_enabled || false)
    }
  }

  const saveSettings = async () => {
    if (!dogId) return
    setSaving(true)

    await supabase
      .from('dogs')
      .update({
        owner_phone: phone,
        reminder_time: reminderTime,
        sms_enabled: smsEnabled
      })
      .eq('id', dogId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sendTestSMS = async () => {
    if (!phone) {
      alert('Please enter your phone number first')
      return
    }

    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        message: `🐕 Test from PawCalm! Your reminders for ${dogName} are set up. You'll get a daily nudge at ${reminderTime}.`
      })
    })

    if (response.ok) {
      alert('Test SMS sent! Check your phone.')
    } else {
      alert('Failed to send test SMS. Make sure your phone number is correct.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <h1 className="text-3xl font-bold text-amber-950 mb-2">Settings</h1>
        <p className="text-amber-800/70 mb-8">Manage your notifications and preferences.</p>

        {/* SMS Reminders */}
        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📱</span>
            <h2 className="text-xl font-bold text-amber-950">Daily SMS Reminders</h2>
          </div>
          
          <p className="text-amber-800/70 text-sm mb-6">
            Get a personalized text reminder to train with {dogName || 'your dog'} every day.
          </p>

          {/* Enable toggle */}
          <div className="flex items-center justify-between mb-6 p-4 bg-amber-50 rounded-xl">
            <div>
              <p className="font-medium text-amber-950">Enable SMS Reminders</p>
              <p className="text-sm text-amber-700/70">We'll text you daily</p>
            </div>
            <button
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`w-14 h-8 rounded-full transition-colors ${smsEnabled ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${smsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {smsEnabled && (
            <>
              {/* Phone number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-900 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none"
                />
                <p className="text-xs text-amber-700/70 mt-1">Include country code (e.g., +1 for US)</p>
              </div>

              {/* Reminder time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-900 mb-2">Reminder Time</label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none"
                >
                  <option value="07:00">7:00 AM</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                </select>
              </div>

              {/* Test button */}
              <button
                onClick={sendTestSMS}
                className="w-full bg-amber-100 text-amber-700 py-3 rounded-xl font-medium hover:bg-amber-200 transition mb-4"
              >
                Send Test SMS
              </button>
            </>
          )}

          {/* Save button */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-amber-400"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>

        {/* What you'll receive */}
        {smsEnabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll receive:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Daily reminder at your chosen time</li>
              <li>• Streak alerts to keep you motivated</li>
              <li>• Encouragement after tough sessions</li>
              <li>• Celebration texts for milestones</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}