'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from './supabase';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    dogsEnrolled: 0,
    sessionsLogged: 0,
    videosAvailable: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [dogsResult, sessionsResult, videosResult] = await Promise.all([
        supabase.from('dogs').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        dogsEnrolled: dogsResult.count || 0,
        sessionsLogged: sessionsResult.count || 0,
        videosAvailable: videosResult.count || 0
      });
    }

    fetchStats();
  }, []);

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    window.location.href = `/signup?email=${encodeURIComponent(email)}`;
  };

  const showStats = stats.dogsEnrolled > 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Beta Banner */}
      <div className="bg-amber-950 text-amber-100 text-center py-2 px-4 text-sm">
        <span className="font-medium">🐕 Early Access</span>
        {showStats && ` — Join ${stats.dogsEnrolled} dog${stats.dogsEnrolled === 1 ? '' : 's'} already using PawCalm`}
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-amber-900/5">
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
            className="bg-amber-900 hover:bg-amber-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Free during beta • No credit card required
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-amber-950 tracking-tight leading-[1.1] mb-6">
            Calm your anxious dog
            <span className="block text-amber-700">with daily AI missions</span>
          </h1>

          <p className="text-lg md:text-xl text-amber-900/70 mb-10 max-w-xl mx-auto leading-relaxed">
            5-minute personalized exercises that actually work. 
            Track progress. See results in weeks, not months.
          </p>

          <form onSubmit={handleQuickSignup} className="max-w-md mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-4 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none text-amber-950 placeholder:text-amber-400 text-lg"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-600/25 disabled:opacity-50 whitespace-nowrap"
              >
                {isLoading ? 'Loading...' : 'Get Started →'}
              </button>
            </div>
          </form>

          <p className="text-amber-700/60 text-sm">
            {showStats ? `Join ${stats.dogsEnrolled} dog owner${stats.dogsEnrolled === 1 ? '' : 's'} • ` : ''}
            Takes 30 seconds to set up
          </p>
        </div>
      </section>

      {/* Social Proof Strip - Only shows if we have real data */}
      {showStats && (
        <section className="bg-amber-950 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">
              <div>
                <div className="text-3xl font-bold text-white">{stats.dogsEnrolled}</div>
                <div className="text-amber-300/80 text-sm">Dog{stats.dogsEnrolled === 1 ? '' : 's'} enrolled</div>
              </div>
              {stats.sessionsLogged > 0 && (
                <>
                  <div className="hidden md:block w-px h-12 bg-amber-700"></div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.sessionsLogged}</div>
                    <div className="text-amber-300/80 text-sm">Sessions logged</div>
                  </div>
                </>
              )}
              {stats.videosAvailable > 0 && (
                <>
                  <div className="hidden md:block w-px h-12 bg-amber-700"></div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.videosAvailable}</div>
                    <div className="text-amber-300/80 text-sm">Training videos</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Problem → Solution */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-950 mb-4">
              Dog anxiety is exhausting
            </h2>
            <p className="text-amber-800/70 text-lg max-w-2xl mx-auto">
              The barking. The destruction. The guilt of leaving them alone. 
              Generic advice doesn't work because every dog is different.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Personalized missions',
                desc: 'AI creates exercises specifically for your dog\'s triggers and your schedule'
              },
              {
                icon: '📊',
                title: 'Track what works',
                desc: 'Log sessions, see patterns, and watch your dog\'s anxiety score improve'
              },
              {
                icon: '🎬',
                title: 'Pro trainer videos',
                desc: 'Watch exactly how to do each technique from certified behaviorists'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-white rounded-3xl p-8 border border-amber-100 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-900/5 transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-amber-950 mb-2">{feature.title}</h3>
                <p className="text-amber-800/70">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-amber-50 to-[#FDFBF7]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-950 text-center mb-16">
            Start in 2 minutes
          </h2>

          <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
            {[
              { step: '1', title: 'Tell us about your dog', desc: 'Breed, age, and what triggers their anxiety' },
              { step: '2', title: 'Get your first mission', desc: 'A 5-minute exercise tailored to start today' },
              { step: '3', title: 'Log & improve', desc: 'Track sessions and watch progress over time' }
            ].map((item, i) => (
              <div key={i} className="flex md:flex-col items-start gap-4 md:text-center md:items-center">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-amber-950 text-lg">{item.title}</h3>
                  <p className="text-amber-800/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-amber-950 rounded-3xl p-8 md:p-12 text-center">
            <div className="text-5xl mb-6">🐕</div>
            <blockquote className="text-xl md:text-2xl text-amber-50 leading-relaxed mb-8">
              "My rescue Luna used to destroy the apartment when I left. After 3 weeks of PawCalm missions, 
              she actually stays calm. I can finally go to work without anxiety myself."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-800 flex items-center justify-center text-amber-200 font-semibold">
                SM
              </div>
              <div className="text-left">
                <div className="font-medium text-white">Sarah M.</div>
                <div className="text-amber-400 text-sm">Luna's owner • Austin, TX</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-950 text-center mb-12">
            Common questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Will this work for my dog?",
                a: "PawCalm adapts to your specific dog—their triggers, your schedule, your living situation. It's not one-size-fits-all advice."
              },
              {
                q: "How is this different from YouTube videos?",
                a: "We create a personalized sequence of exercises based on your dog's progress. Plus, we track what's working and adjust."
              },
              {
                q: "What if I only have 5 minutes?",
                a: "Perfect. Missions are designed for busy people. Short, consistent practice beats long, sporadic sessions."
              },
              {
                q: "Is it really free?",
                a: "Yes, during beta. We're building this with early users. Your feedback shapes the product."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6">
                <h3 className="font-semibold text-amber-950 mb-2">{faq.q}</h3>
                <p className="text-amber-800/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-950 mb-6">
            Your dog deserves to feel safe
          </h2>
          <p className="text-lg text-amber-800/70 mb-10">
            Start your first mission today. Free during beta.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-10 py-5 rounded-2xl font-semibold text-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-600/25"
          >
            Create Your Dog's Profile →
          </Link>
          <p className="mt-6 text-amber-700/60 text-sm">
            No credit card required • Takes 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🐾</span>
              </div>
              <span className="font-semibold text-amber-950">PawCalm</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-700">
              <Link href="/terms" className="hover:text-amber-900">Terms</Link>
              <Link href="/privacy" className="hover:text-amber-900">Privacy</Link>
              <Link href="/disclaimer" className="hover:text-amber-900">Disclaimer</Link>
              <a href="mailto:hello@pawcalm.ai" className="hover:text-amber-900">Contact</a>
            </div>
            <div className="text-sm text-amber-600">
              © 2025 PawCalm
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}