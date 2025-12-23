'use client'

import { useState } from 'react'

export default function ShareProgress({ dogName, streak, sessions, improvement }: { dogName: string; streak: number; sessions: number; improvement: string }) {
  const [copied, setCopied] = useState(false)
  const shareText = `🐕 ${dogName} is making progress!\n🔥 ${streak}-day streak\n📊 ${sessions} sessions\n${improvement}\n\nTry PawCalm free: https://pawcalm.ai`

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${dogName}'s Progress`, text: shareText, url: 'https://pawcalm.ai' }) } catch {}
    } else {
      navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
      <p className="font-semibold mb-2">🎉 Share {dogName}'s progress!</p>
      <p className="text-white/80 text-sm mb-3">Inspire other dog owners.</p>
      <button onClick={handleShare} className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-medium transition">{copied ? '✓ Copied!' : '📤 Share'}</button>
    </div>
  )
}