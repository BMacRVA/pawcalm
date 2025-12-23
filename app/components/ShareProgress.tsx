'use client'

import { useState } from 'react'

type ShareProps = {
  dogName: string
  streak: number
  sessions: number
  improvement: string
}

export default function ShareProgress({ dogName, streak, sessions, improvement }: ShareProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `🐕 ${dogName} is making progress with separation anxiety training!\n\n` +
    `🔥 ${streak}-day streak\n` +
    `📊 ${sessions} sessions completed\n` +
    `${improvement}\n\n` +
    `Training with @PawCalm - try it free: https://pawcalm.ai`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dogName}'s Progress`,
          text: shareText,
          url: 'https://pawcalm.ai'
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
      <p className="font-semibold mb-2">🎉 Share {dogName}'s progress!</p>
      <p className="text-white/80 text-sm mb-3">Inspire other dog owners and help spread the word.</p>
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-medium transition"
        >
          {copied ? '✓ Copied!' : '📤 Share'}
        </button>
        <button
          onClick={handleTwitter}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          𝕏
        </button>
        <button
          onClick={handleFacebook}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          f
        </button>
      </div>
    </div>
  )
}