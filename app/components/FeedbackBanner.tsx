'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import FeedbackModal from './FeedbackModal'

const instaUrl = "https://instagram.com/pawcalm.ai"

export default function FeedbackBanner() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <>
      <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium px-4">
        <div className="flex items-center justify-center gap-4">
          <span>
            Beta - Follow us on Instagram{' '}
            <a href={instaUrl} target="_blank" className="underline">
              @pawcalm.ai
            </a>
          </span>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Feedback</span>
          </button>
        </div>
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}