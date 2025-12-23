'use client'

import { useEffect, useState } from 'react'
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
  const [showTips, setShowTips] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    
    // Poll for updates every 5 seconds if any videos are processing
    const interval = setInterval(() => {
      loadData()
    }, 5000)
    
    return () => clearInterval(interval)
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
      setDogId(dog.id)

      const { data: videoData } = await supabase
        .from('video_analyses')
        .select('*')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })

      if (videoData) setVideos(videoData)
    }

    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !dogId) return

    // Validate file
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file')
      return
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      alert('Video must be under 100MB')
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileName = `${dogId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      // Create analysis record
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

      // Trigger AI analysis
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: analysisRecord.id,
          videoUrl: publicUrl,
          dogName 
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      // Reload videos
      loadData()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    }

    setUploading(false)
  }

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
          <h1 className="text-2xl font-bold text-amber-950 mb-1">Video Analysis</h1>
          <p className="text-amber-800/70 text-sm">
            Upload videos of {dogName || 'your dog'} alone. Our AI will help identify anxiety triggers and behaviors.
          </p>
        </div>

        {/* Recording Tips */}
        {showTips && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                📋 How to Record
              </h2>
              <button 
                onClick={() => setShowTips(false)}
                className="text-blue-400 hover:text-blue-600 text-sm"
              >
                Hide
              </button>
            </div>
            
            <div className="space-y-3 text-blue-800 text-sm">
              <div>
                <p className="font-medium mb-1">✅ Best Practices:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Record for 5-15 minutes after you leave</li>
                  <li>• Use a phone, tablet, or pet camera</li>
                  <li>• Position camera to see door and {dogName || 'dog'}'s usual spot</li>
                  <li>• Include audio — barking/whining is key data</li>
                  <li>• Record during a REAL departure, not a test</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium mb-1">🎯 What to Look For:</p>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>Body language:</strong> Pacing, panting, trembling, drooling</li>
                  <li>• <strong>Vocalizations:</strong> Barking, whining, howling</li>
                  <li>• <strong>Destructive behavior:</strong> Scratching doors, chewing</li>
                  <li>• <strong>Timing:</strong> When anxiety peaks vs. when they settle</li>
                  <li>• <strong>Triggers:</strong> What cues cause the most reaction</li>
                </ul>
              </div>

              <div className="bg-blue-100 rounded-lg p-3 mt-3">
                <p className="font-medium text-blue-900">🔒 Privacy Note:</p>
                <p className="text-blue-800 text-xs mt-1">
                  Videos are stored securely and you can delete them anytime. We'll provide guidance on what to look for in your footage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="bg-white rounded-xl border-2 border-dashed border-amber-300 p-8 text-center mb-6">
          {uploading ? (
            <div>
              <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-amber-800 font-medium">Uploading & analyzing...</p>
              <p className="text-amber-600 text-sm">This may take a minute</p>
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
                <span className="text-4xl mb-3 block">📤</span>
                <p className="text-amber-950 font-semibold mb-1">Upload Video</p>
                <p className="text-amber-700/70 text-sm">MP4, MOV, or WebM • Max 100MB</p>
              </div>
            </label>
          )}
        </div>

        {/* Quick Record Option */}
        <div className="bg-amber-50 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <strong>💡 Quick tip:</strong> Don't have a video yet? Set up your phone to record before your next departure. 
            Even 5 minutes of footage helps us understand {dogName || 'your dog'}'s behavior.
          </p>
        </div>

        {/* Previous Videos */}
        {videos.length > 0 && (
          <div>
            <h2 className="font-semibold text-amber-950 mb-4">Previous Analyses</h2>
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-amber-700/70">
                        {new Date(video.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        video.status === 'analyzed' 
                          ? 'bg-green-100 text-green-700'
                          : video.status === 'processing'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {video.status === 'analyzed' ? '✓ Analyzed' : 
                         video.status === 'processing' ? '⏳ Processing' : '✗ Failed'}
                      </span>
                    </div>

                    {video.status === 'analyzed' && video.analysis && (
                      <>
                        {/* Triggers */}
                        {video.triggers_detected && video.triggers_detected.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-amber-700 mb-2">Triggers Detected:</p>
                            <div className="flex flex-wrap gap-2">
                              {video.triggers_detected.map((trigger, i) => (
                                <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full">
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Analysis */}
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-amber-700 mb-1">AI Guidance:</p>
                          <p className="text-amber-900 text-sm whitespace-pre-line">{video.analysis}</p>
                        </div>
                      </>
                    )}

                    {video.status === 'processing' && (
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-amber-700 text-sm">Analyzing video... Check back in a few minutes.</p>
                      </div>
                    )}

                    {video.status === 'failed' && (
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-red-700 text-sm">Analysis failed. Please try uploading again.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {videos.length === 0 && !showTips && (
          <div className="text-center py-8">
            <p className="text-amber-700/70 mb-2">No videos yet</p>
            <button 
              onClick={() => setShowTips(true)}
              className="text-amber-600 hover:underline text-sm"
            >
              Show recording tips
            </button>
          </div>
        )}
      </div>
    </div>
  )
}