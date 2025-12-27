import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Nav */}
      <nav className="bg-[#FDFBF7] border-b border-amber-900/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🐾</span>
            </div>
            <span className="font-semibold text-amber-950 text-xl tracking-tight">PawCalm</span>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
          </Link>
          <Link 
            href="/signup"
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
          >
            Start Free
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-amber-950 text-center mb-4">
          How PawCalm Works
        </h1>
        <p className="text-amber-800/70 text-center text-lg mb-12 max-w-2xl mx-auto">
          A simple, science-backed approach to helping your dog overcome separation anxiety
        </p>

        {/* The Science */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">💡 The Science</h2>
          <p className="text-blue-800/80 mb-3">
            Dogs with separation anxiety often react to <strong>departure cues</strong> — the things you do before leaving, 
            like picking up keys, putting on shoes, or touching the door handle.
          </p>
          <p className="text-blue-800/80">
            By practicing these cues <strong>without actually leaving</strong>, your dog learns they don&apos;t always mean 
            goodbye. This is called <strong>desensitization</strong>, and it&apos;s the gold standard in treating separation anxiety.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="space-y-8 mb-16">
          {[
            {
              step: '1',
              title: 'Add your dog',
              desc: 'Just enter your dog\'s name to get started. We\'ll create a personalized set of departure cues based on the most common anxiety triggers — keys, shoes, door, jacket, and more.',
              icon: '🐕'
            },
            {
              step: '2',
              title: 'Practice cues daily',
              desc: 'Each day, spend 5 minutes practicing 3-5 cues. Pick up your keys and put them down. Touch the door handle. Put on your shoes — then sit back down. Log whether your dog stayed calm, noticed, or got anxious.',
              icon: '🔑'
            },
            {
              step: '3',
              title: 'Chat with your AI coach',
              desc: 'Your personal coach knows your dog\'s entire history — every practice, every reaction, every pattern. Ask questions, report struggles, celebrate wins. Get specific, actionable guidance tailored to your dog.',
              icon: '💬'
            }
          ].map((item) => (
            <div key={item.step} className="flex gap-6 items-start bg-white rounded-2xl p-6 border border-amber-100">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                  <h2 className="text-xl font-semibold text-amber-950">{item.title}</h2>
                </div>
                <p className="text-amber-800/70">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progression */}
        <h2 className="text-2xl font-bold text-amber-950 text-center mb-8">
          Your journey
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold text-amber-950">Level 1: Departure Cues</h3>
            </div>
            <p className="text-amber-800/70 text-sm mb-3">
              Practice cues without leaving. Master 5+ calm responses on each cue.
            </p>
            <div className="text-xs text-amber-600 font-medium">
              ✓ Keys • Shoes • Door • Jacket • Bag
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🚪</span>
              <h3 className="font-semibold text-amber-950">Level 2: Absence Training</h3>
            </div>
            <p className="text-amber-800/70 text-sm mb-3">
              Start with 30-second departures. Gradually increase to minutes, then hours.
            </p>
            <div className="text-xs text-gray-400 font-medium">
              🔒 Unlocks after mastering 3 cues
            </div>
          </div>
        </div>

        {/* Features */}
        <h2 className="text-2xl font-bold text-amber-950 text-center mb-8">
          What you get
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: '🧠',
              title: 'AI Coach',
              desc: 'A personal trainer who knows your dog\'s history and gives specific advice'
            },
            {
              icon: '📊',
              title: 'Progress tracking',
              desc: 'See calm rates improve, track streaks, and celebrate mastered cues'
            },
            {
              icon: '⏱️',
              title: 'Just 5 minutes',
              desc: 'Short, consistent practice beats long, sporadic sessions'
            },
            {
              icon: '🎯',
              title: 'Adaptive goals',
              desc: 'Daily goals adjust based on your streak and consistency'
            },
            {
              icon: '🔬',
              title: 'Science-backed',
              desc: 'Based on proven desensitization and counter-conditioning techniques'
            },
            {
              icon: '🐕',
              title: 'Multi-dog support',
              desc: 'Track progress for multiple dogs, each with their own cues'
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-amber-100 text-center">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-amber-950 mb-1">{feature.title}</h3>
              <p className="text-amber-800/70 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-16">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">📅 What to expect</h2>
          <div className="space-y-3 text-amber-800/80">
            <div className="flex gap-3">
              <span className="font-semibold text-amber-700 w-24 flex-shrink-0">Week 1-2:</span>
              <span>Build the habit. Practice cues daily, even if your dog reacts.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-amber-700 w-24 flex-shrink-0">Week 3-4:</span>
              <span>Most dogs show noticeable improvement. Cues start getting mastered.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-amber-700 w-24 flex-shrink-0">Week 5+:</span>
              <span>Begin absence training. Short departures, then gradually longer.</span>
            </div>
          </div>
          <p className="text-amber-700 text-sm mt-4 italic">
            Setbacks are normal — your AI coach will help you work through them.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center bg-amber-950 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to help your dog?</h2>
          <p className="text-amber-300 mb-6">Start practicing in under 2 minutes</p>
          <Link
            href="/signup"
            className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
          >
            Start Free →
          </Link>
          <p className="text-amber-400 text-sm mt-4">Free during beta • No credit card required</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 py-4 px-4 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-amber-700">
          <span>© 2025 PawCalm</span>
          <div className="flex gap-4">
            <Link href="/how-it-works" className="hover:text-amber-900 font-medium">How it works</Link>
            <Link href="/faq" className="hover:text-amber-900">FAQ</Link>
            <Link href="/terms" className="hover:text-amber-900">Terms</Link>
            <Link href="/privacy" className="hover:text-amber-900">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}