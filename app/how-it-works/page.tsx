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

        {/* 3 Steps */}
        <div className="space-y-8 mb-16">
          {[
            {
              step: '1',
              title: 'Tell us about your dog',
              desc: 'Share your dog\'s breed, age, and what triggers their anxiety. Does your dog panic when you grab your keys? Bark when you put on shoes? We tailor everything to their specific triggers.',
              icon: '🐕'
            },
            {
              step: '2',
              title: 'Get daily 5-minute missions',
              desc: 'Our AI creates personalized exercises based on proven desensitization techniques. Each mission builds on the last, gradually increasing difficulty as your dog improves.',
              icon: '🎯'
            },
            {
              step: '3',
              title: 'Track progress & adjust',
              desc: 'Log each session with a simple mood check. We track what\'s working and adjust your missions automatically. Watch your dog\'s anxiety score improve over time.',
              icon: '📈'
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

        {/* Features */}
        <h2 className="text-2xl font-bold text-amber-950 text-center mb-8">
          What you get
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: '🎯',
              title: 'Personalized missions',
              desc: 'AI creates exercises for your dog\'s specific triggers and your schedule'
            },
            {
              icon: '📊',
              title: 'Progress tracking',
              desc: 'Log sessions, see patterns, and watch anxiety scores improve'
            },
            {
              icon: '🎬',
              title: 'Trainer videos',
              desc: 'Watch exactly how to do each technique from certified behaviorists'
            },
            {
              icon: '⏱️',
              title: 'Just 5 minutes',
              desc: 'Short, consistent practice beats long, sporadic sessions'
            },
            {
              icon: '🧠',
              title: 'Science-backed',
              desc: 'Based on proven desensitization and counter-conditioning techniques'
            },
            {
              icon: '💬',
              title: 'Daily check-ins',
              desc: 'Quick mood logs help us adjust your plan automatically'
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-amber-100 text-center">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-amber-950 mb-1">{feature.title}</h3>
              <p className="text-amber-800/70 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-amber-950 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to help your dog?</h2>
          <p className="text-amber-300 mb-6">Start your first mission in under 2 minutes</p>
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
            <Link href="/disclaimer" className="hover:text-amber-900">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}