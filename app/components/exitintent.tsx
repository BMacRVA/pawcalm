'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ExitIntent() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('exitIntentShown')) return

    // Desktop: mouse leaves viewport toward top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !sessionStorage.getItem('exitIntentShown')) {
        setShow(true)
        sessionStorage.setItem('exitIntentShown', 'true')
      }
    }

    // Mobile: show after 30 seconds if still on page
    const mobileTimer = setTimeout(() => {
      if (window.innerWidth < 768 && !sessionStorage.getItem('exitIntentShown')) {
        setShow(true)
        sessionStorage.setItem('exitIntentShown', 'true')
      }
    }, 30000)

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(mobileTimer)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to signup with email
    window.location.href = `/signup?email=${encodeURIComponent(email)}`
  }

  const handleClose = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">🐕</span>
          <h2 className="text-2xl font-bold text-amber-950 mb-2">
            Wait! Don't leave your anxious pup behind
          </h2>
          <p className="text-amber-800/70">
            Get your first personalized mission free. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none text-amber-950 placeholder:text-amber-400"
          />
          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
          >
            Get My Free Mission →
          </button>
        </form>

        <p className="text-center text-amber-700/60 text-sm mt-4">
          Join {Math.floor(Math.random() * 3) + 4} other dog owners who signed up today
        </p>

        <button
          onClick={handleClose}
          className="w-full text-amber-700/60 text-sm mt-4 hover:text-amber-800"
        >
          No thanks, I'll let my dog figure it out
        </button>
      </div>
    </div>
  )
}