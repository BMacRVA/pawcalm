'use client'

import { useState, useEffect } from 'react'

export default function ExitIntent() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('exitIntentShown')) return

    // Desktop: mouse leaves viewport toward top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !sessionStorage.getItem('exitIntentShown')) {
        setShow(true)
        sessionStorage.setItem('exitIntentShown', 'true')
      }
    }

    // Mobile: only show if they've been on page 90+ seconds AND scrolled back to top
    let timeOnPage = 0
    const timer = setInterval(() => {
      timeOnPage++
    }, 1000)

    const handleScroll = () => {
      const scrolledToTop = window.scrollY < 100
      const beenHereAwhile = timeOnPage >= 90
      const isMobile = window.innerWidth < 768
      
      if (isMobile && scrolledToTop && beenHereAwhile && !sessionStorage.getItem('exitIntentShown')) {
        setShow(true)
        sessionStorage.setItem('exitIntentShown', 'true')
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
      clearInterval(timer)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/signup?email=${encodeURIComponent(email)}`
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShow(false)} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none">
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
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]">
            Get My Free Mission →
          </button>
        </form>

        <button onClick={() => setShow(false)} className="w-full text-amber-700/60 text-sm mt-4 hover:text-amber-800">
          No thanks, I'll let my dog figure it out
        </button>
      </div>
    </div>
  )
}