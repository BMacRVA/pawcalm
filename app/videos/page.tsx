'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [dogId, setDogId] = useState<string | null>(null)

  useEffect(() => {
    fetchUserAndVideos()
  }, [])

  const fetchUserAndVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    setUserId(user.id)

    const { data: dog } = await supabase
      .from('dogs')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    if (dog) setDogId(dog.id)

    const { data: videoData } = await supabase
      .from('videos')
      .select('*')
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (videoData) setVideos(videoData)

    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    setUploadProgress(0)

    try {
      const response = await fetch('/api/video-upload', { method: 'POST' })
      const { uploadUrl, uploadId } = await response.json()
      if (!uploadUrl) throw new Error('Failed to get upload URL')

      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
      xhr.onload = async () => {
        if (xhr.status === 200) {
          const { data: video } = await supabase
            .from('videos')
            .insert({ owner_id: userId, dog_id: dogId, mux_asset_id: uploadId, status: 'processing' })
            .select()
            .single()
          if (video) setVideos([video, ...videos])
        }
        setUploading(false)
        setUploadProgress(0)
      }
      xhr.onerror = () => {
        setUploading(false)
        alert('Upload failed')
      }
      xhr.open('PUT', uploadUrl)
      xhr.send(file)
    } catch (error) {
      setUploading(false)
      alert('Upload failed')
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return
    await supabase.from('videos').update({ deleted_at: new Date().toISOString() }).eq('id', videoId)
    setVideos(videos.filter(v => v.id !== videoId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard" className="text-emerald-600 hover:underline">← Back to Dashboard</a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎥 Training Videos</h1>
          <p className="text-gray-600 mb-6">Upload your training session videos. They are encrypted and private.</p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            {uploading ? (
              <div>
                <p className="text-gray-600 mb-4">Uploading... {uploadProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-emerald-600 h-3 rounded-full" style={{ width: uploadProgress + '%' }} />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Click to select a video</p>
                <label className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-emerald-700">
                  Select Video
                  <input type="file" accept="video/*" onChange={handleUpload} className="hidden" />
                </label>
                <p className="text-sm text-gray-400 mt-4">🔒 Videos are encrypted end-to-end</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Videos ({videos.length})</h2>

          {videos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No videos uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {video.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {video.status === 'ready' && (
                      <button
                        onClick={() => window.location.href = '/videos/' + video.id}
                        className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Watch
                      </button>
                    )}
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}