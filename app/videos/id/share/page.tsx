'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../supabase'

export default function ShareVideoPage() {
  const params = useParams()
  const videoId = params.id as string

  const [trainers, setTrainers] = useState<any[]>([])
  const [existingTokens, setExistingTokens] = useState<any[]>([])
  const [selectedTrainer, setSelectedTrainer] = useState('')
  const [expiration, setExpiration] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [videoId])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    setUserId(user.id)

    const { data: video } = await supabase
      .from('videos')
      .select('owner_id')
      .eq('id', videoId)
      .single()

    if (!video || video.owner_id !== user.id) {
      window.location.href = '/videos'
      return
    }

    const { data: trainerData } = await supabase
      .from('trainers')
      .select('id, name, email')
      .eq('approved', true)
    if (trainerData) setTrainers(trainerData)

    const { data: tokenData } = await supabase
      .from('video_tokens')
      .select('*')
      .contains('video_ids', [videoId])
      .eq('owner_id', user.id)
      .is('revoked_at', null)
    if (tokenData) setExistingTokens(tokenData)

    setLoading(false)
  }

  const generateToken = () => {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
  }

  const hashToken = async (token: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hash = await window.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
  }

  const getExpirationDate = () => {
    const now = new Date()
    if (expiration === '1h') return new Date(now.getTime() + 60 * 60 * 1000)
    if (expiration === '24h') return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    if (expiration === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }

  const createShareToken = async () => {
    if (!selectedTrainer || !userId) return
    setCreating(true)

    const token = generateToken()
    const tokenHash = await hashToken(token)

    const { error } = await supabase.from('video_tokens').insert({
      owner_id: userId,
      trainer_id: selectedTrainer,
      video_ids: [videoId],
      token_hash: tokenHash,
      expires_at: getExpirationDate().toISOString(),
      can_view: true,
      can_comment: true,
      can_download: false,
    })

    setCreating(false)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setNewToken(token)
      fetchData()
    }
  }

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Revoke this access?')) return
    await supabase.from('video_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', tokenId)
    setExistingTokens(existingTokens.filter(t => t.id !== tokenId))
  }

  const getTrainerName = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId)
    return trainer?.name || 'Unknown'
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href={'/videos/' + videoId} className="text-emerald-600 hover:underline">← Back to Video</a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Share Video Securely</h1>
          <p className="text-gray-600 mb-8">Create a secure, time-limited access token for a trainer</p>

          {newToken ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
              <h3 className="font-bold text-emerald-800 mb-2">Token Created!</h3>
              <p className="text-sm text-emerald-700 mb-4">Share this token with your trainer.</p>
              <div className="bg-white rounded-lg p-3 font-mono text-xs break-all mb-4">{newToken}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(newToken); alert('Copied!') }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Copy Token
                </button>
                <button
                  onClick={() => setNewToken(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Trainer</label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 bg-white"
                >
                  <option value="">Choose a trainer...</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Access Expires In</label>
                <select
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 bg-white"
                >
                  <option value="1h">1 hour</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
              </div>

              <button
                onClick={createShareToken}
                disabled={!selectedTrainer || creating}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
              >
                {creating ? 'Creating...' : 'Generate Secure Token'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Access Tokens</h2>
          {existingTokens.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active tokens</p>
          ) : (
            <div className="space-y-4">
              {existingTokens.map((token) => (
                <div key={token.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{getTrainerName(token.trainer_id)}</p>
                    <p className="text-sm text-gray-500">Expires: {new Date(token.expires_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => revokeToken(token.id)}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}