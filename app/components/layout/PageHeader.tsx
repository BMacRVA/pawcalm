'use client'

import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import FeedbackModal from '../FeedbackModal'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  showFeedback?: boolean
}

export function PageHeader({ title, subtitle, showBack, backHref, onBack, showFeedback = true }: PageHeaderProps) {
  const router = useRouter()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-[#FDFBF7] border-b border-gray-100">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBack && (
                <button 
                  onClick={handleBack}
                  className="p-2 -ml-2 hover:bg-amber-100 rounded-full transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>
            
            {showFeedback && (
              <button
                onClick={() => setFeedbackOpen(true)}
                className="p-2 hover:bg-amber-100 rounded-full transition"
                title="Give feedback"
              >
                <MessageCircle className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </header>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}