'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'

type Video = {
  id: string
  created_at: string
  video_url: string
  analysis: string | null
  status: 'processing' | 'analyzed' | 'failed'
  triggers_detected: string[] | null
}

export default function VideosPage() {
  const [dogName, setDogName] = useState('')
  const [dogId, setDogId] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [uploading, setUploading] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

  const loadData = useCallback(async () => {
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
      setDogId(dog.id)

      const { data: videoData } = await supabase
        .from('video_analyses')
        .select('*')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })

      if (videoData) setVideos(videoData)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'processing')
    
    if (hasProcessing) {
      const interval = setInterval(() => {
        loadData()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [videos, loadData])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !dogId) return

    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('Video must be under 100MB')
      return
    }

    setUploading(true)

    try {
      const fileName = `${dogId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      const { data: analysisRecord, error: insertError } = await supabase
        .from('video_analyses')
        .insert({
          dog_id: dogId,
          video_url: publicUrl,
          status: 'processing'
        })
        .select()
        .single()

      if (insertError) throw insertError

      setVideos(prev => [{
        id: analysisRecord.id,
        created_at: analysisRecord.created_at,
        video_url: publicUrl,
        analysis: null,
        status: 'processing',
        triggers_detected: null
      }, ...prev])

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: analysisRecord.id,
          videoUrl: publicUrl,
          dogName 
        })
      })

      if (response.ok) {
        loadData()
      } else {
        setVideos(prev => prev.map(v => 
          v.id === analysisRecord.id ? { ...v, status: 'failed' as const } : v
        ))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    }

    setUploading(false)
  }

  const getAnxietyLevel = (analysis: string): { level: string; emoji: string; color: string } => {
    const lower = analysis.toLowerCase()
    if (lower.includes('none 😎') || lower.includes('level: none')) 
      return { level: 'Calm', emoji: '😎', color: 'green' }
    if (lower.includes('mild 😊') || lower.includes('level: mild')) 
      return { level: 'Mild', emoji: '😊', color: 'yellow' }
    if (lower.includes('moderate 😟') || lower.includes('level: moderate')) 
      return { level: 'Moderate', emoji: '😟', color: 'orange' }
    if (lower.includes('severe 😰') || lower.includes('level: severe')) 
      return { level: 'Severe', emoji: '😰', color: 'red' }
    return { level: 'Unknown', emoji: '❓', color: 'gray' }
  }

  const getVibeCheck = (analysis: string): string => {
    const match = analysis.match(/## .+'s Vibe Check 🐕\n([^\n]+)/)
    if (match) return match[1]
    const vibeMatch = analysis.match(/Vibe Check[^\n]*\n([^\n]+)/)
    if (vibeMatch) return vibeMatch[1]
    return ''
  }

  // Calculate trend
  const getTrend = () => {
    const analyzed = videos.filter(v => v.status === 'analyzed' && v.analysis)
    if (analyzed.length < 2) return null

    const recent = analyzed.slice(0, Math.ceil(analyzed.length / 2))
    const older = analyzed.slice(Math.ceil(analyzed.length / 2))

    const scoreMap: Record<string, number> = { 'Calm': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3 }
    
    const recentAvg = recent.reduce((sum, v) => {
      const { level } = getAnxietyLevel(v.analysis!)
      return sum + (scoreMap[level] ?? 1)
    }, 0) / recent.length

    const olderAvg = older.reduce((sum, v) => {
      const { level } = getAnxietyLevel(v.analysis!)
      return sum + (scoreMap[level] ?? 1)
    }, 0) / older.length

    if (recentAvg < olderAvg - 0.3) return 'improving'
    if (recentAvg > olderAvg + 0.3) return 'worsening'
    return 'stable'
  }

  const trend = getTrend()
  const analyzedVideos = videos.filter(v => v.status === 'analyzed')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🎥</span>
          <h1 className="text-2xl font-bold text-amber-950 mb-1">{dogName}'s Video Diary</h1>
          <p className="text-amber-800/70 text-sm">
            Upload videos regularly to track {dogName}'s progress over time
          </p>
        </div>

        {/* Trend Summary */}
        {analyzedVideos.length >= 2 && (
          <div className={`rounded-xl p-4 mb-6 ${
            trend === 'improving' ? 'bg-green-50 border border-green-200' :
            trend === 'worsening' ? 'bg-orange-50 border border-orange-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {trend === 'improving' ? '📈' : trend === 'worsening' ? '📉' : '➡️'}
              </span>
              <div>
                <p className={`font-semibold ${
                  trend === 'improving' ? 'text-green-800' :
                  trend === 'worsening' ? 'text-orange-800' :
                  'text-blue-800'
                }`}>
                  {trend === 'improving' ? `${dogName} is improving!` :
                   trend === 'worsening' ? `${dogName} needs more practice` :
                   `${dogName} is holding steady`}
                </p>
                <p className={`text-sm ${
                  trend === 'improving' ? 'text-green-700' :
                  trend === 'worsening' ? 'text-orange-700' :
                  'text-blue-700'
                }`}>
                  Based on {analyzedVideos.length} video analyses
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="bg-white rounded-xl border-2 border-dashed border-amber-300 p-6 text-center mb-4">
          {uploading ? (
            <div>
              <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-amber-800 font-medium">Analyzing {dogName}'s behavior...</p>
              <p className="text-amber-600 text-sm">This takes about 30 seconds</p>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={handleUpload}
                className="hidden"
              />
              <div>
                <span className="text-3xl mb-2 block">📤</span>
                <p className="text-amber-950 font-semibold mb-1">Upload New Video</p>
                <p className="text-amber-700/70 text-sm">MP4, MOV, or WebM • Max 100MB</p>
              </div>
            </label>
          )}
        </div>

        {/* Tips toggle */}
        <button 
          onClick={() => setShowTips(!showTips)}
          className="text-amber-600 hover:underline text-sm mb-4 flex items-center gap-1"
        >
          {showTips ? '▼' : '▶'} Recording tips
        </button>

        {showTips && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="space-y-2 text-blue-800 text-sm">
              <p><strong>📹 Best practices:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Record 5-15 minutes after you leave</li>
                <li>• Position camera to see {dogName}'s usual spots</li>
                <li>• Include audio if possible</li>
                <li>• Upload weekly to track progress</li>
              </ul>
            </div>
          </div>
        )}

        {/* Video Timeline */}
        {videos.length > 0 ? (
          <div>
            <h2 className="font-semibold text-amber-950 mb-4">
              Video History ({videos.length} {videos.length === 1 ? 'video' : 'videos'})
            </h2>
            <div className="space-y-3">
              {videos.map((video) => {
                const anxiety = video.analysis ? getAnxietyLevel(video.analysis) : null
                const vibeCheck = video.analysis ? getVibeCheck(video.analysis) : ''
                const isExpanded = expandedVideo === video.id

                return (
                  <div 
                    key={video.id} 
                    className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden"
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-amber-50/50 transition"
                      onClick={() => setExpandedVideo(isExpanded ? null : video.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                            video.status === 'analyzed' && anxiety
                              ? anxiety.color === 'green' ? 'bg-green-100'
                                : anxiety.color === 'yellow' ? 'bg-yellow-100'
                                : anxiety.color === 'orange' ? 'bg-orange-100'
                                : anxiety.color === 'red' ? 'bg-red-100'
                                : 'bg-gray-100'
                              : video.status === 'processing' ? 'bg-amber-100'
                              : 'bg-red-100'
                          }`}>
                            {video.status === 'analyzed' && anxiety ? anxiety.emoji :
                             video.status === 'processing' ? '⏳' : '❌'}
                          </div>
                          <div>
                            <p className="font-medium text-amber-950">
                              {new Date(video.created_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-amber-700/70">
                              {video.status === 'analyzed' && anxiety 
                                ? `${anxiety.level} anxiety`
                                : video.status === 'processing' 
                                ? 'Analyzing...'
                                : 'Analysis failed'}
                            </p>
                          </div>
                        </div>
                        <span className="text-amber-400">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Vibe check preview */}
                      {video.status === 'analyzed' && vibeCheck && !isExpanded && (
                        <p className="text-sm text-amber-700 mt-2 italic line-clamp-1">
                          "{vibeCheck}"
                        </p>
                      )}
                    </div>

                    {/* Expanded analysis */}
                    {isExpanded && video.status === 'analyzed' && video.analysis && (
                      <div className="px-4 pb-4 border-t border-amber-100">
                        {video.triggers_detected && video.triggers_detected.length > 0 && (
                          <div className="mt-3 mb-3">
                            <p className="text-xs font-medium text-amber-700 mb-2">Triggers:</p>
                            <div className="flex flex-wrap gap-2">
                              {video.triggers_detected.map((trigger, i) => (
                                <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full">
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-amber-50 rounded-lg p-3 mt-3">
                          <p className="text-amber-900 text-sm whitespace-pre-line">{video.analysis}</p>
                        </div>
                      </div>
                    )}

                    {isExpanded && video.status === 'processing' && (
                      <div className="px-4 pb-4">
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                            <p className="text-amber-700 text-sm">Analyzing {dogName}'s behavior...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isExpanded && video.status === 'failed' && (
                      <div className="px-4 pb-4">
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <p className="text-red-700 text-sm">Analysis failed. Try uploading again.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-amber-100">
            <span className="text-4xl mb-3 block">🎬</span>
            <p className="text-amber-950 font-medium mb-1">No videos yet</p>
            <p className="text-amber-700/70 text-sm">
              Upload your first video to see how {dogName} does when alone!
            </p>
          </div>
        )}

        {/* Encouragement */}
        {videos.length > 0 && videos.length < 4 && (
          <div className="mt-6 bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-amber-800 text-sm">
              <strong>💡 Pro tip:</strong> Upload videos weekly to track {dogName}'s progress. 
              The more data, the better insights!
            </p>
          </div>
        )}

        {videos.length >= 4 && (
          <div className="mt-6 bg-green-50 rounded-xl p-4 text-center">
            <p className="text-green-800 text-sm">
              <strong>🌟 Great job!</strong> You've uploaded {videos.length} videos. 
              Keep it up to track {dogName}'s long-term progress!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}