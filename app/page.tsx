'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from './supabase';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ 
    practices: 0, 
    cuesMastered: 0,
    calmRate: 0
  });

  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: dogs } = await supabase
            .from('dogs')
            .select('id')
            .eq('user_id', session.user.id)
            .limit(1)
          window.location.href = dogs && dogs.length > 0 ? '/dashboard' : '/onboarding'
        }
      }
    }
    handleAuthRedirect()
  }, [])

  useEffect(() => {
    async function fetchStats() {
      // Get total practices and calculate calm rate
      const { data: practices } = await supabase
        .from('cue_practices')
        .select('cues')
      
      let totalReps = 0
      let calmReps = 0
      
      practices?.forEach(p => {
        p.cues?.forEach((c: { response: string }) => {
          totalReps++
          if (c.response === 'calm') calmReps++
        })
      })
      
      // Get mastered cues count
      const { count: masteredCount } = await supabase
        .from('custom_cues')
        .select('*', { count: 'exact', head: true })
        .gte('calm_count', 5)
      
      setStats({ 
        practices: totalReps,
        cuesMastered: masteredCount || 0,
        calmRate: totalReps > 0 ? Math.round((calmReps / totalReps) * 100) : 0
      })
    }
    fetchStats()
  }, [])

  const handleQuickSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    window.location.href = `/signup?email=${encodeURIComponent(email)}`
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Nav */}
      <nav className="bg-[#FDFBF7] border-b border-amber-900/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🐾</span>
            </div>
            <span className="font-semibold text-amber-950 text-xl tracking-tight">PawCalm</span>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-amber-700 hover:text-amber-800 text-sm font-medium">
              Log in
            </Link>
            <Link href="/signup" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-4 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
            
            {/* Left: Hero */}
            <div className="lg:flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-950 tracking-tight leading-tight mb-4">
                Science-backed training for
                <span className="block text-amber-600">separation anxiety</span>
              </h1>

              <p className="text-base sm:text-lg text-amber-800/70 mb-6 max-w-md mx-auto lg:mx-0">
                Based on proven methods from certified trainers. Track daily progress, get AI guidance, and help your dog feel calm when you leave.
              </p>

              {/* How it works */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left max-w-md mx-auto lg:mx-0">
                <p className="text-sm font-semibold text-amber-900 mb-3">How it works:</p>
                <div className="space-y-2 text-sm text-amber-800/80">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600">1.</span>
                    <span>Practice departure cues (keys, shoes, door) without leaving</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600">2.</span>
                    <span>Log how your dog reacts — calm, noticed, or anxious</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600">3.</span>
                    <span>Chat with your AI coach for personalized guidance</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleQuickSignup} className="mb-4 max-w-md mx-auto lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none text-amber-950 placeholder:text-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isLoading ? '...' : 'Start Free →'}
                  </button>
                </div>
              </form>

              <p className="text-amber-700/60 text-sm">
                Free during beta • No credit card required
              </p>

              {stats.practices > 0 && (
                <div className="mt-4 inline-flex flex-wrap items-center gap-3 text-sm text-amber-800">
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                    <span>🎯</span>
                    <span><strong>{stats.practices}</strong> practices logged</span>
                  </div>
                  {stats.cuesMastered > 0 && (
                    <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full text-green-800">
                      <span>✓</span>
                      <span><strong>{stats.cuesMastered}</strong> cues mastered</span>
                    </div>
                  )}
                  {stats.calmRate > 0 && (
                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full text-blue-800">
                      <span>😎</span>
                      <span><strong>{stats.calmRate}%</strong> calm rate</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: App Preview */}
            <div className="hidden lg:block lg:flex-1 max-w-md">
              {/* Practice Preview */}
              <div className="bg-white rounded-2xl shadow-lg shadow-amber-900/10 overflow-hidden border border-amber-100 mb-4">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white">
                  <p className="text-amber-200 text-xs font-medium">Daily Practice</p>
                  <h3 className="text-lg font-bold">Quick Cue Training</h3>
                </div>

                <div className="p-4">
                  <div className="text-center mb-4">
                    <span className="text-4xl">🔑</span>
                    <p className="font-semibold text-gray-900 mt-2">Pick up your keys</p>
                    <p className="text-sm text-gray-500">How did your dog react?</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                      <span className="text-2xl">😎</span>
                      <span className="font-medium text-green-800">Calm</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-2xl">🙂</span>
                      <span className="font-medium text-amber-800">Noticed</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-2xl">😰</span>
                      <span className="font-medium text-red-800">Anxious</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coach Preview */}
              <div className="bg-white rounded-2xl shadow-lg shadow-amber-900/10 overflow-hidden border border-amber-100">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span>💬</span>
                    <span className="font-semibold text-gray-900">AI Coach</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3 max-w-[85%]">
                    <p className="text-sm text-gray-700">
                      Great progress! Your dog stayed calm 4 times today. Try the shoe cue next — it&apos;s often easier after keys. 🎉
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 py-4 px-4 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-amber-700">
          <span>© 2025 PawCalm</span>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/how-it-works" className="hover:text-amber-900">How it works</Link>
            <Link href="/faq" className="hover:text-amber-900">FAQ</Link>
            <Link href="/terms" className="hover:text-amber-900">Terms</Link>
            <Link href="/privacy" className="hover:text-amber-900">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}