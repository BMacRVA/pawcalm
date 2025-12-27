'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { ArrowLeft, Clock, Play, CheckCircle, XCircle, AlertCircle, Timer, ChevronRight } from 'lucide-react'

type SessionState = 'intro' | 'prepare' | 'timing' | 'result' | 'history'

type PastSession = {
  id: string
  duration: number
  response: 'calm' | 'slight' | 'anxious'
  created_at: string
}

export default function MissionPage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [state, setState] = useState<SessionState>('intro')
  const [targetDuration, setTargetDuration] = useState(30) // seconds
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const [loading, setLoading] = useState(true)
  const [longestCalm, setLongestCalm] = useState(0)

  useEffect(() => {
    loadHistory()
  }, [dog])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning])

  const loadHistory = async () => {
    if (!dog) return

    const { data: sessions } = await supabase
      .from('absence_sessions')
      .select('*')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (sessions) {
      setPastSessions(sessions.map(s => ({
        id: s.id,
        duration: s.duration,
        response: s.response,
        created_at: s.created_at
      })))

      // Calculate longest calm duration
      const calmSessions = sessions.filter(s => s.response === 'calm')
      const longest = calmSessions.reduce((max, s) => Math.max(max, s.duration), 0)
      setLongestCalm(longest)

      // Set recommended duration based on history
      if (longest > 0) {
        // Start at 80% of longest successful duration, min 30 seconds
        setTargetDuration(Math.max(30, Math.floor(longest * 0.8)))
      }
    }

    setLoading(false)
  }

  const startSession = () => {
    setElapsedTime(0)
    setIsRunning(true)
    setState('timing')
  }

  const endSession = () => {
    setIsRunning(false)
    setState('result')
  }

  const logResponse = async (response: 'calm' | 'slight' | 'anxious') => {
    if (!dog) return

    await supabase.from('absence_sessions').insert({
      dog_id: dog.id,
      duration: elapsedTime,
      response: response,
      target_duration: targetDuration,
    })

    // Reload history
    await loadHistory()

    // Reset for next session or go back to intro
    setElapsedTime(0)
    setState('intro')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${mins}m`
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    }
    return `${seconds}s`
  }

  const getDurationOptions = () => {
    const options = [30, 60, 120, 180, 300, 600, 900, 1800] // 30s to 30min
    const recommended = Math.max(30, Math.floor(longestCalm * 0.8))
    
    // Add the recommended duration if not already in options
    if (!options.includes(recommended) && recommended > 30) {
      options.push(recommended)
      options.sort((a, b) => a - b)
    }
    
    return options
  }

  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-200" />
          <div className="h-4 w-24 bg-purple-200 rounded" />
        </div>
      </div>
    )
  }

  // Intro State - Choose duration
  if (state === 'intro') {
    const calmCount = pastSessions.filter(s => s.response === 'calm').length
    const totalSessions = pastSessions.length

    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Today's Mission</h1>
          <p className="text-gray-500 text-sm mt-1">Absence training with {dog?.name}</p>
        </header>

        <main className="px-6 py-4">
          <div className="max-w-md mx-auto space-y-6">

            {/* Progress Summary */}
            {totalSessions > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-medium text-gray-500 mb-4">Your Progress</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{totalSessions}</p>
                    <p className="text-xs text-gray-500 mt-1">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {totalSessions > 0 ? Math.round((calmCount / totalSessions) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Success</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{formatDuration(longestCalm)}</p>
                    <p className="text-xs text-gray-500 mt-1">Best</p>
                  </div>
                </div>
              </div>
            )}

            {/* Duration Selector */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Choose Duration</h2>
              <p className="text-sm text-gray-500 mb-4">
                {longestCalm > 0 
                  ? `Based on your progress, we recommend starting around ${formatDuration(Math.floor(longestCalm * 0.8))}`
                  : "Start with a short duration and build up gradually"
                }
              </p>

              <div className="grid grid-cols-4 gap-2">
                {getDurationOptions().map(duration => (
                  <button
                    key={duration}
                    onClick={() => setTargetDuration(duration)}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition ${
                      targetDuration === duration
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatDuration(duration)}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">
                Selected: {formatDuration(targetDuration)}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 mb-2">📋 How it works</h3>
              <ol className="text-purple-800 text-sm space-y-2">
                <li>1. Set up a camera or listen from outside</li>
                <li>2. Do your normal leaving routine</li>
                <li>3. Actually leave and close the door</li>
                <li>4. Wait for the target duration</li>
                <li>5. Come back and record how {dog?.name} did</li>
              </ol>
            </div>

            {/* Important Note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Important</h3>
                  <p className="text-amber-800 text-sm">
                    If {dog?.name} becomes very distressed, end the session early. 
                    It&apos;s better to have a short successful session than a long stressful one.
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <Button 
              onClick={() => setState('prepare')} 
              fullWidth 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-5 h-5" />
              Start {formatDuration(targetDuration)} Session
            </Button>

            {/* View History */}
            {pastSessions.length > 0 && (
              <button
                onClick={() => setState('history')}
                className="w-full text-center text-purple-600 text-sm font-medium py-2"
              >
                View Session History
              </button>
            )}

          </div>
        </main>

        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  // Prepare State - Final checklist
  if (state === 'prepare') {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <header className="px-6 pt-6 pb-4">
          <button 
            onClick={() => setState('intro')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Before You Leave</h1>
        </header>

        <main className="px-6 py-4">
          <div className="max-w-md mx-auto space-y-6">

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Checklist</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{dog?.name} has been to the bathroom</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Water bowl is filled</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Camera is set up (optional but helpful)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Environment is calm (no loud noises expected)</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for success</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Keep your departure calm and boring</li>
                <li>• Don&apos;t make a big fuss saying goodbye</li>
                <li>• Leave a Kong or treat to create positive association</li>
                <li>• Return before {dog?.name} gets distressed</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <Timer className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold text-lg">
                Target: {formatDuration(targetDuration)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                The timer will start when you tap begin
              </p>
            </div>

            <Button 
              onClick={startSession} 
              fullWidth 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-5 h-5" />
              Begin - Leave Now
            </Button>

          </div>
        </main>
      </div>
    )
  }

  // Timing State - Active session
  if (state === 'timing') {
    const progress = Math.min(100, (elapsedTime / targetDuration) * 100)
    const isOverTarget = elapsedTime >= targetDuration

    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="max-w-md w-full text-center">
            
            {/* Big Timer */}
            <div className="mb-8">
              <p className={`text-7xl font-bold ${isOverTarget ? 'text-green-600' : 'text-gray-900'}`}>
                {formatTime(elapsedTime)}
              </p>
              <p className="text-gray-500 mt-2">
                {isOverTarget 
                  ? '🎉 Target reached!' 
                  : `Target: ${formatDuration(targetDuration)}`
                }
              </p>
            </div>

            {/* Progress Ring */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke={isOverTarget ? '#22C55E' : '#9333EA'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className={`w-16 h-16 ${isOverTarget ? 'text-green-600' : 'text-purple-600'}`} />
              </div>
            </div>

            {/* Status Message */}
            <div className={`rounded-xl p-4 mb-8 ${
              isOverTarget ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'
            }`}>
              <p className={`font-medium ${isOverTarget ? 'text-green-800' : 'text-purple-800'}`}>
                {isOverTarget 
                  ? `Great job! You can return to ${dog?.name} whenever you're ready.`
                  : `Stay outside. ${dog?.name} is learning to be comfortable alone.`
                }
              </p>
            </div>

            {/* End Session Button */}
            <Button 
              onClick={endSession} 
              fullWidth 
              size="lg"
              variant={isOverTarget ? 'primary' : 'secondary'}
              className={isOverTarget ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              End Session & Record Result
            </Button>

            {!isOverTarget && (
              <p className="text-gray-400 text-sm mt-4">
                It&apos;s okay to end early if {dog?.name} is distressed
              </p>
            )}

          </div>
        </main>
      </div>
    )
  }

  // Result State - Record how dog did
  if (state === 'result') {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <header className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">How did it go?</h1>
          <p className="text-gray-500 text-sm mt-1">
            Session duration: {formatDuration(elapsedTime)}
          </p>
        </header>

        <main className="px-6 py-4">
          <div className="max-w-md mx-auto space-y-4">

            <p className="text-gray-600 mb-4">
              How was {dog?.name} when you returned? (Or based on the camera)
            </p>

            {/* Response Options */}
            <button
              onClick={() => logResponse('calm')}
              className="w-full flex items-center gap-4 p-5 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition"
            >
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-green-900 text-lg">Calm</p>
                <p className="text-green-700 text-sm">Relaxed, no signs of distress</p>
              </div>
            </button>

            <button
              onClick={() => logResponse('slight')}
              className="w-full flex items-center gap-4 p-5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl transition"
            >
              <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-amber-900 text-lg">Slight Reaction</p>
                <p className="text-amber-700 text-sm">Some whining/pacing but manageable</p>
              </div>
            </button>

            <button
              onClick={() => logResponse('anxious')}
              className="w-full flex items-center gap-4 p-5 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl transition"
            >
              <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-700" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-red-900 text-lg">Anxious/Distressed</p>
                <p className="text-red-700 text-sm">Barking, destructive, very stressed</p>
              </div>
            </button>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>💡 Tip:</strong> Be honest about the response. 
                If {dog?.name} was anxious, we&apos;ll try a shorter duration next time. 
                Building up slowly is the key to success!
              </p>
            </div>

          </div>
        </main>
      </div>
    )
  }

  // History State
  if (state === 'history') {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <header className="px-6 pt-6 pb-4">
          <button 
            onClick={() => setState('intro')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
        </header>

        <main className="px-6 py-4">
          <div className="max-w-md mx-auto space-y-3">
            {pastSessions.map(session => {
              const date = new Date(session.created_at)
              const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })

              return (
                <div 
                  key={session.id}
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    session.response === 'calm' ? 'bg-green-100' :
                    session.response === 'slight' ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    {session.response === 'calm' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {session.response === 'slight' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                    {session.response === 'anxious' && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{formatDuration(session.duration)}</p>
                    <p className="text-sm text-gray-500">{dateStr}</p>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    session.response === 'calm' ? 'bg-green-100 text-green-700' :
                    session.response === 'slight' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.response === 'calm' ? 'Calm' :
                     session.response === 'slight' ? 'Slight' : 'Anxious'}
                  </span>
                </div>
              )
            })}

            {pastSessions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No sessions yet. Start your first one!</p>
              </div>
            )}
          </div>
        </main>

        <BottomNavSpacer />
        <BottomNav />
      </div>
    )
  }

  return null
}