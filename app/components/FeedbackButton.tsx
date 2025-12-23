'use client'

import { useState } from 'react'
import { supabase } from '../supabase'

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [type, setType] = useState<'love' | 'issue' | 'idea'>('love')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('feedback').insert([{
      user_id: user?.id,
      type,
      message: feedback,
      page: window.location.pathname
    }])

    setLoading(false)
    setSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      setSubmitted(false)
      setFeedback('')
    }, 2000)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-110 z-40"
        title="Give feedback"
      >
        💬
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <span className="text-5xl mb-4 block">💚</span>
                <h2 className="text-xl font-bold text-amber-950">Thanks!</h2>
                <p className="text-amber-800/70">Your feedback helps us improve.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-amber-950 mb-1">How's PawCalm working?</h2>
                <p className="text-amber-800/70 text-sm mb-4">Your feedback shapes what we build next.</p>

                <form onSubmit={handleSubmit}>
                  {/* Type selector */}
                  <div className="flex gap-2 mb-4">
                    {[
                      { value: 'love', emoji: '💚', label: 'Love it' },
                      { value: 'issue', emoji: '🐛', label: 'Issue' },
                      { value: 'idea', emoji: '💡', label: 'Idea' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value as 'love' | 'issue' | 'idea')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                          type === option.value
                            ? 'bg-amber-100 border-2 border-amber-500 text-amber-800'
                            : 'bg-gray-100 border-2 border-transparent text-gray-600'
                        }`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={
                      type === 'love' ? "What's working well?" :
                      type === 'issue' ? "What's broken or frustrating?" :
                      "What would make PawCalm better?"
                    }
                    className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-amber-950 placeholder:text-amber-400 mb-4"
                    rows={4}
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading || !feedback.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-gray-300"
                  >
                    {loading ? 'Sending...' : 'Send Feedback'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}