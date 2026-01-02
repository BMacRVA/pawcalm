'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      { q: "Will this work for my dog?", a: "PawCalm adapts to your specific dog—their triggers, your schedule, your living situation. Whether your dog panics when you grab keys, put on shoes, or simply stand up, we create missions tailored to their specific anxiety patterns." },
      { q: "How long until I see results?", a: "Most users report noticeable improvement within 2-3 weeks of consistent practice. However, every dog is different. Severe cases may take longer, and we recommend consulting a professional behaviorist for extreme anxiety." },
      { q: "What if I only have 5 minutes a day?", a: "Perfect! Missions are designed for busy people. Research shows short, consistent practice (5 minutes daily) is more effective than long, sporadic sessions. Consistency is key." }
    ]
  },
  {
    category: 'About PawCalm',
    questions: [
      { q: "How is this different from YouTube videos?", a: "YouTube gives generic advice. PawCalm creates a personalized sequence of exercises based on YOUR dog's specific triggers and progress. We track what's working and automatically adjust your missions." },
      { q: "Is the AI actually helpful?", a: "Our AI provides suggestions based on desensitization and counter-conditioning principles. However, AI-generated content is for informational purposes only and is not a substitute for professional veterinary or certified behaviorist advice." },
      { q: "What are the trainer videos?", a: "Short demonstration videos from certified dog behaviorists showing exactly how to perform each technique. See proper timing, body language, and reward delivery." }
    ]
  },
  {
    category: 'Pricing & Beta',
    questions: [
      { q: "Is it really free?", a: "Yes, completely free during beta. We're building this with early users like you. Your feedback shapes the product. Eventually we'll introduce paid plans, but beta users will always get special treatment." },
      { q: "What does beta mean?", a: "We're still actively building PawCalm. You might encounter bugs or features that change. In exchange for your patience, you get free access and direct input on what we build next." },
      { q: "Will my data be safe?", a: "Yes. We take privacy seriously. Your data is encrypted, never sold, and you can delete your account anytime. See our Privacy Policy for details." }
    ]
  },
  {
    category: 'Safety & Limitations',
    questions: [
      { q: "Is this a replacement for a vet or trainer?", a: "No. PawCalm provides AI-generated suggestions for informational purposes only. For severe anxiety, aggression, or any medical concerns, please consult a veterinarian or certified animal behaviorist." },
      { q: "What if my dog shows aggression?", a: "Stop the exercise immediately and consult a professional. PawCalm is designed for separation anxiety, not aggression. If your dog shows any aggressive behavior, please seek help from a certified behaviorist." },
      { q: "Can this make my dogs anxiety worse?", a: "When done correctly, desensitization should not increase anxiety. However, moving too fast can cause setbacks. That's why we emphasize going at your dogs pace and logging honest feedback so we can adjust." }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <nav className="bg-[#FDFBF7] border-b border-amber-900/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🐾</span>
            </div>
            <span className="font-semibold text-amber-950 text-xl tracking-tight">PawCalm</span>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
          </Link>
          <Link href="/signup" className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105">
            Start Free
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-amber-950 text-center mb-4">Frequently Asked Questions</h1>
        <p className="text-amber-800/70 text-center text-lg mb-12">Everything you need to know about PawCalm</p>

        <div className="space-y-8">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-lg font-semibold text-amber-800 mb-4">{section.category}</h2>
              <div className="space-y-2">
                {section.questions.map((faq, questionIndex) => {
                  const id = `${sectionIndex}-${questionIndex}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} className="bg-white rounded-xl border border-amber-100 overflow-hidden">
                      <button onClick={() => setOpenIndex(isOpen ? null : id)} className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-amber-50 transition-colors">
                        <span className="font-medium text-amber-950">{faq.q}</span>
                        <span className={`text-amber-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {isOpen && <div className="px-5 pb-4 text-amber-800/70">{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-amber-950 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Still have questions?</h2>
          <p className="text-amber-300 mb-6">Start free and see for yourself, or reach out anytime</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105">Start Free →</Link>
            <a href="mailto:hello@pawcalm.ai" className="bg-amber-800 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105">Contact Us</a>
          </div>
        </div>
      </main>

      <footer className="border-t border-amber-200 py-4 px-4 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-amber-700">
          <span>© 2025 PawCalm</span>
          <div className="flex gap-4">
            <Link href="/how-it-works" className="hover:text-amber-900">How it works</Link>
            <Link href="/faq" className="hover:text-amber-900 font-medium">FAQ</Link>
            <Link href="/terms" className="hover:text-amber-900">Terms</Link>
            <Link href="/privacy" className="hover:text-amber-900">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-amber-900">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}