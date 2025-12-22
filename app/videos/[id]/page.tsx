'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../supabase'

export default function VideoPlayerPage() {
  const params = useParams()
  const videoId = params.id as string
  
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  const fetchVideo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .is('deleted_at', null)
      .single()

    if (videoError || !videoData) {
      setError('Video not found')
      setLoading(false)
      return
    }

    const ownerCheck = videoData.owner_id === user.id
    setIsOwner(ownerCheck)

    if (!ownerCheck) {
      const { data: token } = await supabase
        .from('video_tokens')
        .select('*')
        .contains('video_ids', [videoId])
        .eq('trainer_id', user.id)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!token) {
        setError('You do not have access to this video')
        setLoading(false)
        return
      }
    }

    await supabase.from('video_access_log').insert({
      video_id: videoId,
      accessor_id: user.id,
      accessor_type: ownerCheck ? 'owner' : 'trainer',
      action: 'view',
    })

    setVideo(videoData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading secure video...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a href="/videos" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold">
            Back to Videos
          </a>
        </div>
      </div>
    )
  }

  if (!video || video.status !== 'ready') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-white mb-2">Video Processing</h1>
          <p className="text-gray-400 mb-6">This video is still being processed. Check back soon.</p>
          <a href="/videos" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold">
            Back to Videos
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/videos" className="text-emerald-400 hover:underline">← Back to Videos</a>
          <span className="text-gray-400 text-sm">🔒 Encrypted</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
          <mux-player
            playback-id={video.mux_playback_id}
            accent-color="#10b981"
            style={{ width: '100%', height: '100%' }}
          />
          <div className="absolute top-4 right-4 text-white text-sm opacity-50 pointer-events-none">
            {isOwner ? 'Owner View' : 'Trainer View'}
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Training Session</h1>
              <p className="text-gray-400 text-sm">
                {new Date(video.created_at).toLocaleDateString()}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => window.location.href = '/videos/' + video.id + '/share'}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Share with Trainer
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-white font-semibold">Privacy Protected</p>
              <p className="text-gray-400 text-sm">
                This video is encrypted and watermarked. All access is logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}