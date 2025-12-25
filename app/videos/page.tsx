'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Upload, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Lightbulb, Video } from 'lucide-react'

type VideoType = {
  id: string
  created_at: string
  video_url: string
  analysis: string | null
  status: 'processing' | 'analyzed' | 'failed'
  triggers_detected: string[] | null
}

export default function VideosPage() {
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [videos, setVideos] = useState<VideoType[]>([])
  const [uploading, setUploading] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

  const loadVideos = useCallback(async () => {
    if (!dog) return

    const { data: videoData } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })

    if (videoData) setVideos(videoData)
    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      loadVideos()
    }
  }, [dog, loadVideos])

  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'processing')
    
    if (hasProcessing) {
      const interval = setInterval(() => {
        loadVideos()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [videos, loadVideos])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !dog) return

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
      const fileName = `${dog.id}/${Date.now()}-${file.name}`
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
          dog_id: dog.id,
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
          dogName: dog.name
        })
      })

      if (response.ok) {
        loadVideos()
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
  const isLoading = dogLoading || loading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-200" />
          <div className="h-4 w-24 bg-purple-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader 
        title={`${dog?.name}'s Videos`} 
        subtitle="Track behavior when alone"
        showBack
        backHref="/dashboard"
      />
      
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Trend Summary */}
          {analyzedVideos.length >= 2 && (
            <Card 
              variant="elevated" 
              padding="md"
              className={
                trend === 'improving' ? 'bg-green-50 border-green-200' :
                trend === 'worsening' ? 'bg-orange-50 border-orange-200' :
                'bg-blue-50 border-blue-200'
              }
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  trend === 'improving' ? 'bg-green-100' :
                  trend === 'worsening' ? 'bg-orange-100' :
                  'bg-blue-100'
                }`}>
                  {trend === 'improving' ? <TrendingUp className="w-5 h-5 text-green-600" /> : 
                   trend === 'worsening' ? <TrendingDown className="w-5 h-5 text-orange-600" /> : 
                   <Minus className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <p className={`font-semibold ${
                    trend === 'improving' ? 'text-green-800' :
                    trend === 'worsening' ? 'text-orange-800' :
                    'text-blue-800'
                  }`}>
                    {trend === 'improving' ? `${dog?.name} is improving!` :
                     trend === 'worsening' ? `${dog?.name} needs more practice` :
                     `${dog?.name} is holding steady`}
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
            </Card>
          )}

          {/* Upload Button */}
          <Card variant="outlined" padding="lg" className="border-2 border-dashed border-purple-300">
            {uploading ? (
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-purple-800 font-medium">Analyzing {dog?.name}&apos;s behavior...</p>
                <p className="text-purple-600 text-sm">This takes about 30 seconds</p>
              </div>
            ) : (
              <label className="cursor-pointer block text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7 text-purple-600" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">Upload New Video</p>
                <p className="text-gray-500 text-sm">MP4, MOV, or WebM • Max 100MB</p>
              </label>
            )}
          </Card>

          {/* Tips toggle */}
          <button 
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            <Lightbulb className="w-4 h-4" />
            Recording tips
            {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTips && (
            <Card variant="elevated" padding="md" className="bg-blue-50 border-blue-100">
              <div className="space-y-2 text-blue-800 text-sm">
                <p className="font-semibold">📹 Best practices:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Record 5-15 minutes after you leave</li>
                  <li>• Position camera to see {dog?.name}&apos;s usual spots</li>
                  <li>• Include audio if possible</li>
                  <li>• Upload weekly to track progress</li>
                </ul>
              </div>
            </Card>
          )}

          {/* Video Timeline */}
          {videos.length > 0 ? (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                Video History ({videos.length})
              </h2>
              <div className="space-y-3">
                {videos.map((video) => {
                  const anxiety = video.analysis ? getAnxietyLevel(video.analysis) : null
                  const vibeCheck = video.analysis ? getVibeCheck(video.analysis) : ''
                  const isExpanded = expandedVideo === video.id

                  return (
                    <Card key={video.id} variant="elevated" padding="none" className="overflow-hidden">
                      <button
                        className="w-full p-4 text-left hover:bg-gray-50 transition"
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
                                : video.status === 'processing' ? 'bg-purple-100'
                                : 'bg-red-100'
                            }`}>
                              {video.status === 'analyzed' && anxiety ? anxiety.emoji :
                               video.status === 'processing' ? '⏳' : '❌'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(video.created_at).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-gray-500">
                                {video.status === 'analyzed' && anxiety 
                                  ? `${anxiety.level} anxiety`
                                  : video.status === 'processing' 
                                  ? 'Analyzing...'
                                  : 'Analysis failed'}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Vibe check preview */}
                        {video.status === 'analyzed' && vibeCheck && !isExpanded && (
                          <p className="text-sm text-gray-600 mt-2 italic line-clamp-1">
                            &quot;{vibeCheck}&quot;
                          </p>
                        )}
                      </button>

                      {/* Expanded analysis */}
                      {isExpanded && video.status === 'analyzed' && video.analysis && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {video.triggers_detected && video.triggers_detected.length > 0 && (
                            <div className="mt-3 mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Triggers detected:</p>
                              <div className="flex flex-wrap gap-2">
                                {video.triggers_detected.map((trigger, i) => (
                                  <span key={i} className="bg-red-50 text-red-700 text-xs px-3 py-1 rounded-full border border-red-100">
                                    {trigger}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="bg-purple-50 rounded-xl p-4 mt-3">
                            <p className="text-purple-900 text-sm whitespace-pre-line">{video.analysis}</p>
                          </div>
                        </div>
                      )}

                      {isExpanded && video.status === 'processing' && (
                        <div className="px-4 pb-4">
                          <div className="bg-purple-50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                              <p className="text-purple-700 text-sm">Analyzing {dog?.name}&apos;s behavior...</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isExpanded && video.status === 'failed' && (
                        <div className="px-4 pb-4">
                          <div className="bg-red-50 rounded-xl p-4 text-center">
                            <p className="text-red-700 text-sm">Analysis failed. Try uploading again.</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card variant="elevated" padding="lg" className="text-center">
              <span className="text-5xl mb-4 block">🎬</span>
              <h2 className="text-lg font-bold text-gray-900 mb-2">No videos yet</h2>
              <p className="text-gray-600">
                Upload your first video to see how {dog?.name} does when alone!
              </p>
            </Card>
          )}

          {/* Encouragement */}
          {videos.length > 0 && videos.length < 4 && (
            <Card variant="filled" padding="md" className="text-center">
              <p className="text-amber-800 text-sm">
                <strong>💡 Pro tip:</strong> Upload videos weekly to track {dog?.name}&apos;s progress. 
                The more data, the better insights!
              </p>
            </Card>
          )}

          {videos.length >= 4 && (
            <Card variant="elevated" padding="md" className="text-center bg-green-50 border-green-100">
              <p className="text-green-800 text-sm">
                <strong>🌟 Great job!</strong> You&apos;ve uploaded {videos.length} videos. 
                Keep it up to track {dog?.name}&apos;s long-term progress!
              </p>
            </Card>
          )}

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}