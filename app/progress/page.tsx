'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

type Session = {
  id: string
  created_at: string
  dog_response: string
  mission_title: string
  mission_steps: string[]
  steps_completed: number
  steps_total: number
  notes: string
}

type CuePractice = {
  id: string
  created_at: string
  cues: { cue_id: string; cue_name: string; response: string }[]
}

type VideoAnalysis = {
  id: string
  created_at: string
  analysis: string
}

export default function ProgressPage() {
  const [dogName, setDogName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [cuePractices, setCuePractices] = useState<CuePractice[]>([])
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (dog) {
      setDogName(dog.name)

      const [sessionsRes, cuesRes, videosRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('dog_id', dog.id).order('created_at', { ascending: false }),
        supabase.from('cue_practices').select('*').eq('dog_id', dog.id).order('created_at', { ascending: false }),
        supabase.from('video_analyses').select('*').eq('dog_id', dog.id).eq('status', 'analyzed').order('created_at', { ascending: false })
      ])

      if (sessionsRes.data) setSessions(sessionsRes.data)
      if (cuesRes.data) setCuePractices(cuesRes.data)
      if (videosRes.data) setVideoAnalyses(videosRes.data)
    }
    setLoading(false)
  }

  const getCueAnalysis = () => {
    const cueHistory: Record<string, { 
      name: string
      total: number
      calm: number
      status: 'stressful' | 'working-on' | 'mastered'
    }> = {}

    const sortedPractices = [...cuePractices].reverse()
    sortedPractices.forEach(practice => {
      practice.cues?.forEach(cue => {
        if (!cueHistory[cue.cue_name]) {
          cueHistory[cue.cue_name] = { name: cue.cue_name, total: 0, calm: 0, status: 'working-on' }
        }
        cueHistory[cue.cue_name].total++
        if (cue.response === 'calm') cueHistory[cue.cue_name].calm++
      })
    })

    Object.values(cueHistory).forEach(cue => {
      const calmRate = cue.calm / cue.total
      if (cue.total >= 2 && calmRate >= 0.7) cue.status = 'mastered'
      else if (calmRate <= 0.3) cue.status = 'stressful'
    })

    return cueHistory
  }

  const getVideoAnxiety = (analysis: string): { level: string; emoji: string } => {
    const lower = analysis.toLowerCase()
    if (lower.includes('none 😎')) return { level: 'Calm', emoji: '😎' }
    if (lower.includes('mild 😊')) return { level: 'Mild', emoji: '😊' }
    if (lower.includes('moderate 😟')) return { level: 'Moderate', emoji: '😟' }
    return { level: 'Severe', emoji: '😰' }
  }

  const cueAnalysis = getCueAnalysis()
  const stressful = Object.values(cueAnalysis).filter(c => c.status === 'stressful')
  const workingOn = Object.values(cueAnalysis).filter(c => c.status === 'working-on')
  const mastered = Object.values(cueAnalysis).filter(c => c.status === 'mastered')

  const hasData = sessions.length > 0 || Object.keys(cueAnalysis).length > 0 || videoAnalyses.length > 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="text-amber-600 text-sm">← Back</Link>
          <h1 className="text-xl font-bold text-amber-950">{dogName}'s Progress</h1>
          <div className="w-12"></div>
        </div>

        {!hasData ? (
          <div className="bg-white rounded-2xl p-8 border border-amber-100 text-center">
            <span className="text-4xl mb-3 block">🐕</span>
            <p className="text-amber-700 mb-4">Complete a session to start tracking</p>
            <Link href="/mission" className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium">
              Start Session
            </Link>
          </div>
        ) : (
          <>
            {/* Sessions */}
            <div className="bg-white rounded-xl p-4 border border-amber-100 mb-3">
              <p className="text-sm font-medium text-amber-950 mb-3">
                Sessions <span className="font-normal text-amber-500">({sessions.length})</span>
              </p>
              
              {sessions.length === 0 ? (
                <p className="text-amber-400 text-sm">No sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((s) => (
                    <div key={s.id}>
                      <button
                        onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                            s.dog_response === 'great' ? 'bg-green-100' :
                            s.dog_response === 'okay' ? 'bg-amber-100' : 'bg-red-100'
                          }`}>
                            {s.dog_response === 'great' ? '😊' : s.dog_response === 'okay' ? '😐' : '😟'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-950 truncate">
                              {s.mission_title || 'Training Session'}
                            </p>
                            <p className="text-xs text-amber-500">
                              {new Date(s.created_at).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric' 
                              })}
                              {s.steps_total > 0 && ` • ${s.steps_completed}/${s.steps_total} steps`}
                            </p>
                          </div>
                          <span className="text-amber-400 text-xs">
                            {expandedSession === s.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>
                      
                      {expandedSession === s.id && (
                        <div className="ml-11 mt-1 p-3 bg-amber-50 rounded-lg text-sm space-y-2">
                          <p className="text-amber-700">
                            <span className="font-medium">Result:</span>{' '}
                            {s.dog_response === 'great' ? '😊 Did great!' : 
                             s.dog_response === 'okay' ? '😐 Okay with some stress' : '😟 Struggled'}
                          </p>
                          
                          {/* Show steps if available */}
                          {s.mission_steps && s.mission_steps.length > 0 && (
                            <div>
                              <p className="text-amber-700 font-medium text-xs mb-1">Steps tried:</p>
                              <ul className="text-xs text-amber-600 space-y-1">
                                {s.mission_steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className={i < s.steps_completed ? 'text-green-500' : 'text-amber-400'}>
                                      {i < s.steps_completed ? '✓' : '○'}
                                    </span>
                                    <span className={i < s.steps_completed ? '' : 'opacity-60'}>
                                      {step}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {s.notes && (
                            <p className="text-amber-600 text-xs italic border-t border-amber-200 pt-2">
                              "{s.notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {sessions.length > 5 && (
                    <p className="text-xs text-amber-500 text-center pt-2">
                      +{sessions.length - 5} more sessions
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cue Status */}
            <div className="bg-white rounded-xl p-4 border border-amber-100 mb-3">
              <p className="text-sm font-medium text-amber-950 mb-3">Departure Cues</p>
              
              {Object.keys(cueAnalysis).length === 0 ? (
                <p className="text-amber-400 text-sm">Practice cues to identify triggers</p>
              ) : (
                <div className="space-y-2">
                  {stressful.length > 0 && (
                    <div>
                      <p className="text-xs text-red-600 mb-1">🔴 Causes stress</p>
                      <div className="flex flex-wrap gap-1">
                        {stressful.map(c => (
                          <span key={c.name} className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {workingOn.length > 0 && (
                    <div>
                      <p className="text-xs text-amber-600 mb-1">🟡 Working on</p>
                      <div className="flex flex-wrap gap-1">
                        {workingOn.map(c => (
                          <span key={c.name} className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {mastered.length > 0 && (
                    <div>
                      <p className="text-xs text-green-600 mb-1">🟢 Mastered</p>
                      <div className="flex flex-wrap gap-1">
                        {mastered.map(c => (
                          <span key={c.name} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Videos */}
            {videoAnalyses.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-amber-100 mb-3">
                <p className="text-sm font-medium text-amber-950 mb-3">
                  Video Analysis <span className="font-normal text-amber-500">({videoAnalyses.length})</span>
                </p>
                <div className="space-y-2">
                  {videoAnalyses.slice(0, 3).map((v) => {
                    const { level, emoji } = getVideoAnxiety(v.analysis)
                    return (
                      <div key={v.id}>
                        <button
                          onClick={() => setExpandedVideo(expandedVideo === v.id ? null : v.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                              level === 'Calm' ? 'bg-green-100' :
                              level === 'Mild' ? 'bg-yellow-100' :
                              level === 'Moderate' ? 'bg-orange-100' : 'bg-red-100'
                            }`}>
                              {emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-amber-950">
                                {level} anxiety
                              </p>
                              <p className="text-xs text-amber-500">
                                {new Date(v.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <span className="text-amber-400 text-xs">
                              {expandedVideo === v.id ? '▲' : '▼'}
                            </span>
                          </div>
                        </button>
                        
                        {expandedVideo === v.id && (
                          <div className="ml-11 mt-1 p-3 bg-purple-50 rounded-lg text-sm">
                            <p className="text-purple-800 text-xs whitespace-pre-line">
                              {v.analysis.substring(0, 500)}
                              {v.analysis.length > 500 && '...'}
                            </p>
                            <Link 
                              href="/videos" 
                              className="text-purple-600 text-xs underline mt-2 inline-block"
                            >
                              View full analysis →
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Link href="/mission" className="bg-amber-600 text-white py-3 rounded-xl font-medium text-center text-sm">
                New Session
              </Link>
              <Link href="/departure-practice" className="bg-amber-100 text-amber-700 py-3 rounded-xl font-medium text-center text-sm">
                Practice Cues
              </Link>
              <Link href="/videos" className="bg-purple-100 text-purple-700 py-3 rounded-xl font-medium text-center text-sm">
                Upload Video
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}