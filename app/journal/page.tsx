'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { Loader2, Send } from 'lucide-react'

type JournalEntry = {
  id: string
  content: string
  ai_response: string | null
  created_at: string
}

export default function JournalPage() {
  const { dog, loading: dogLoading } = useSelectedDog()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadEntries = async () => {
      if (!dog) return

      const { data } = await supabase
        .from('journal_entries')
        .select('id, content, ai_response, created_at')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: true })
        .limit(50)

      setEntries(data || [])
      setLoading(false)
    }

    if (dog) {
      loadEntries()
    }
  }, [dog])

  useEffect(() => {
    // Scroll to bottom when entries change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const sendMessage = async () => {
    if (!dog || !message.trim() || sending) return

    const userMessage = message.trim()
    setMessage('')
    setSending(true)

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`
    setEntries(prev => [...prev, {
      id: tempId,
      content: userMessage,
      ai_response: null,
      created_at: new Date().toISOString()
    }])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const response = await fetch('/api/journal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogId: dog.id,
          userId: user?.id,
          message: userMessage
        })
      })

      const data = await response.json()

      if (data.response) {
        // Update with AI response
        setEntries(prev => prev.map(e => 
          e.id === tempId 
            ? { ...e, ai_response: data.response }
            : e
        ))
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }

    setSending(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 border-b border-gray-100 bg-[#FDFBF7]">
        <h1 className="text-xl font-bold text-gray-900">Coach</h1>
        <p className="text-sm text-gray-500">I remember everything about {dog?.name}&apos;s journey</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">💬</span>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Hi! I&apos;m {dog?.name}&apos;s coach
            </h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
              I track all your progress, remember our conversations, and I&apos;m here whenever you need guidance.
            </p>
            <p className="text-amber-600 text-sm font-medium">
              How&apos;s training going today?
            </p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const showDate = index === 0 || 
              formatDate(entry.created_at) !== formatDate(entries[index - 1].created_at)
            
            return (
              <div key={entry.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="text-xs text-gray-400 bg-[#FDFBF7] px-3">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                )}
                
                {/* User message */}
                <div className="flex justify-end mb-2">
                  <div className="bg-amber-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{entry.content}</p>
                  </div>
                </div>

                {/* AI response */}
                {entry.ai_response ? (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%] shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">🐾</span>
                        <span className="text-xs font-medium text-amber-600">Coach</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.ai_response}</p>
                    </div>
                  </div>
                ) : sending && index === entries.length - 1 ? (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`How's ${dog?.name} doing?`}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="w-10 h-10 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}