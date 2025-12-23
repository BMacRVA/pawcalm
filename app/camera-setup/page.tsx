'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

const cameras = [
  {
    id: 'wyze',
    name: 'Wyze Cam',
    icon: '📷',
    steps: [
      'Download the Wyze app on your phone/tablet',
      'Open the app and sign in',
      'Tap on your camera to view the live feed',
      'Keep the app open while training'
    ],
    tip: 'Use a second device (old phone or tablet) to watch while you train from your main device.'
  },
  {
    id: 'furbo',
    name: 'Furbo',
    icon: '🎥',
    steps: [
      'Open the Furbo app on your phone/tablet',
      'Sign in to your account',
      'Tap your camera to view the live stream',
      'Keep it open during training sessions'
    ],
    tip: 'Furbo has a treat-tossing feature — save it for rewarding calm behavior after you return!'
  },
  {
    id: 'ring',
    name: 'Ring Indoor Cam',
    icon: '🔔',
    steps: [
      'Open the Ring app',
      'Tap on your indoor camera',
      'Select "Live View" to watch your dog',
      'Keep the app open while training'
    ],
    tip: 'Turn off motion notifications during training so alerts don\'t distract you.'
  },
  {
    id: 'blink',
    name: 'Blink Camera',
    icon: '👁️',
    steps: [
      'Open the Blink app',
      'Tap your camera from the home screen',
      'View the live feed',
      'Keep it running during your session'
    ],
    tip: 'Blink cameras have a slight delay — that\'s normal.'
  },
  {
    id: 'nest',
    name: 'Google Nest Cam',
    icon: '🏠',
    steps: [
      'Open the Google Home app',
      'Tap on your Nest camera',
      'View the live stream',
      'Keep it open while training'
    ],
    tip: 'You can also view on nest.com from a computer.'
  },
  {
    id: 'eufy',
    name: 'Eufy Camera',
    icon: '📹',
    steps: [
      'Open the Eufy Security app',
      'Tap your camera to view live',
      'Keep the app open during training'
    ],
    tip: 'Eufy stores video locally — great for privacy!'
  },
  {
    id: 'other',
    name: 'Other Camera',
    icon: '📱',
    steps: [
      'Open your camera\'s app on a second device',
      'Start the live view',
      'Position it where you can see your dog\'s usual spot',
      'Keep it open while training on your main device'
    ],
    tip: 'Any camera with a live view feature will work.'
  },
  {
    id: 'none',
    name: 'No Camera Yet',
    icon: '🛒',
    steps: [
      'You don\'t need a camera to start training!',
      'But it helps to see how your dog reacts when you\'re out of sight',
      'Budget options: Wyze Cam ($20-30), Blink Mini ($25-35)',
      'Premium options: Furbo ($100+) has treat tossing'
    ],
    tip: 'Start training now — you can add a camera later.'
  }
]

export default function CameraSetupPage() {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [savedCamera, setSavedCamera] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dogName, setDogName] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('name, camera_type')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dog) {
      setDogName(dog.name)
      if (dog.camera_type) {
        setSavedCamera(dog.camera_type)
        setSelectedCamera(dog.camera_type)
      }
    }
  }

  const saveCamera = async (cameraId: string) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('dogs')
        .update({ camera_type: cameraId })
        .eq('user_id', user.id)
      setSavedCamera(cameraId)
    }
    setSaving(false)
  }

  const selectedCameraData = cameras.find(c => c.id === selectedCamera)

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">📹</span>
          <h1 className="text-3xl font-bold text-amber-950 mb-2">Camera Setup</h1>
          <p className="text-amber-800/70">
            Watch {dogName || 'your dog'} during training sessions to see how they're really doing.
          </p>
        </div>

        {/* Why use a camera */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">💡 Why watch during training?</h2>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• See your dog's true reaction when you're out of sight</li>
            <li>• Catch early stress signs (pacing, panting, whining)</li>
            <li>• Know exactly when to return before anxiety escalates</li>
            <li>• Track improvement over time</li>
          </ul>
        </div>

        {/* Camera selection */}
        <div className="mb-8">
          <h2 className="font-semibold text-amber-950 mb-4">What camera do you have?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCamera(camera.id)}
                className={`p-4 rounded-xl border-2 transition text-center ${
                  selectedCamera === camera.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-amber-300'
                }`}
              >
                <span className="text-2xl mb-1 block">{camera.icon}</span>
                <span className="text-sm text-amber-950">{camera.name}</span>
                {savedCamera === camera.id && (
                  <span className="block text-xs text-green-600 mt-1">✓ Saved</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Setup instructions */}
        {selectedCameraData && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedCameraData.icon}</span>
              <h2 className="text-xl font-bold text-amber-950">{selectedCameraData.name} Setup</h2>
            </div>

            <div className="space-y-3 mb-6">
              {selectedCameraData.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-amber-900">{step}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>💡 Tip:</strong> {selectedCameraData.tip}
              </p>
            </div>

            {selectedCamera !== savedCamera && selectedCamera !== 'none' && (
              <button
                onClick={() => saveCamera(selectedCamera)}
                disabled={saving}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-amber-400"
              >
                {saving ? 'Saving...' : 'Save My Camera Choice'}
              </button>
            )}

            {selectedCamera === savedCamera && (
              <div className="text-center text-green-600 font-medium">
                ✓ Saved — we'll remind you to open {selectedCameraData.name} during missions
              </div>
            )}
          </div>
        )}

        {/* How to use during training */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
          <h2 className="font-bold text-amber-950 mb-4">📋 During Training Sessions</h2>
          <div className="space-y-4 text-amber-800">
            <div className="flex gap-3">
              <span className="text-xl">1️⃣</span>
              <p>Set up your camera pointing at where {dogName || 'your dog'} usually waits</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">2️⃣</span>
              <p>Open PawCalm on your main device (this one)</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">3️⃣</span>
              <p>Open your camera app on a second device (or split screen)</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">4️⃣</span>
              <p>Follow the mission steps while watching for stress signs</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">5️⃣</span>
              <p>Return before {dogName || 'your dog'} gets anxious — timing is everything!</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/mission"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-semibold transition"
          >
            Start a Mission →
          </Link>
        </div>
      </div>
    </div>
  )
}