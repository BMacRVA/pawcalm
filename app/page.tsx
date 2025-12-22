'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from './supabase';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ dogsEnrolled: 0, sessionsLogged: 0 });

  // Handle OAuth redirect
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
      const [dogsResult, sessionsResult] = await Promise.all([
        supabase.from('dogs').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        dogsEnrolled: dogsResult.count || 0,
        sessionsLogged: sessionsResult.count || 0,
      });
    }
    fetchStats();
  }, []);

  const handleQuickSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    window.location.href = `/signup?email=${encodeURIComponent(email)}`;
  };

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
          <Link 
            href="/signup"
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero + Demo in one view */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-4 py-8 lg:py-0">
        
        {/* Left: Hero copy + CTA */}
        <div className="max-w-md text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold text-amber-950 tracking-tight leading-[1.1] mb-4">
            Calm your anxious dog
            <span className="block text-amber-600">in 5 min/day</span>
          </h1>
          
          <p className="text-lg text-amber-800/70 mb-6">
            AI-powered daily missions personalized for your dog's anxiety triggers.
          </p>

          <form onSubmit={handleQuickSignup} className="mb-4">
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

          {/* Mini social proof */}
          {stats.dogsEnrolled > 0 && (
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-4 text-sm">
              <div className="flex -space-x-2">
                {['🐕', '🐶', '🦮', '🐩'].slice(0, Math.min(stats.dogsEnrolled, 4)).map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <span className="text-amber-800">
                <strong>{stats.dogsEnrolled}</strong> dog{stats.dogsEnrolled !== 1 && 's'} enrolled
                {stats.sessionsLogged > 0 && <> • <strong>{stats.sessionsLogged}</strong> sessions</>}
              </span>
            </div>
          )}
        </div>

        {/* Right: Demo Mission Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl shadow-amber-900/10 overflow-hidden border border-amber-100">
            {/* Mission Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-200 text-xs font-medium">Today's Mission</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Day 3</span>
              </div>
              <h3 className="text-lg font-bold">Departure Desensitization</h3>
            </div>

            {/* Steps */}
            <div className="p-4 space-y-3">
              {/* Step 1 - Visible */}
              <div className="flex gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <p className="text-amber-950 text-sm font-medium">Pick up keys, put them down</p>
                  <p className="text-amber-700/70 text-xs">Repeat 3x without eye contact</p>
                </div>
              </div>

              {/* Step 2 - Blurred */}
              <Link href="/signup" className="block relative group cursor-pointer">
                <div className="flex gap-3 p-3 bg-gray-100 rounded-xl blur-[2px]">
                  <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-gray-950 text-sm font-medium">Walk toward the door</p>
                    <p className="text-gray-700/70 text-xs">Build up gradually</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-amber-950 text-white text-xs px-3 py-1.5 rounded-full group-hover:bg-amber-800 transition-colors">
                    🔒 Sign up to unlock
                  </span>
                </div>
              </Link>

              {/* Step 3 - Blurred */}
              <Link href="/signup" className="block relative group cursor-pointer">
                <div className="flex gap-3 p-3 bg-gray-100 rounded-xl blur-[2px]">
                  <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="text-gray-950 text-sm font-medium">Full departure practice</p>
                    <p className="text-gray-700/70 text-xs">Reward calm behavior</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Card CTA */}
            <Link href="/signup" className="block p-4 bg-amber-50 border-t border-amber-100 text-center hover:bg-amber-100 transition-colors">
              <span className="text-amber-700 font-semibold text-sm">Get your personalized plan →</span>
            </Link>
          </div>

          {/* Testimonial under card */}
          <div className="mt-4 p-4 bg-amber-950 rounded-xl text-center">
            <p className="text-amber-50 text-sm italic mb-2">
              "After 3 weeks, Luna actually stays calm when I leave."
            </p>
            <p className="text-amber-400 text-xs">— Sarah M., Austin TX</p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-amber-200 py-4 px-4 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-amber-700">
          <span>© 2025 PawCalm</span>
          <div className="flex gap-4">
            <Link href="/how-it-works" className="hover:text-amber-900">How it works</Link>
            <Link href="/faq" className="hover:text-amber-900">FAQ</Link>
            <Link href="/terms" className="hover:text-amber-900">Terms</Link>
            <Link href="/privacy" className="hover:text-amber-900">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-amber-900">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}