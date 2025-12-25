'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  getJournalPrompt, 
  extractTags, 
  analyzeJournalPatterns,
  getRelevantCommunityPattern,
  type JournalEntry,
  type JournalPrompt 
} from '../lib/journal'
import { PenLine, Sparkles, TrendingUp, Users, ChevronRight } from 'lucide-react'

const MOODS = [
  { value: 'great', label: 'Great', emoji: '🌟' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'tough', label: 'Tough', emoji: '😓' },
  { value: 'hard', label: 'Hard', emoji: '😢' },
]

export default function JournalPage() {
  const router = useRouter()
  const { dog, loading: dogLoading } = useSelectedDog()
  
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null)
  const [insights, setInsights] = useState<ReturnType<typeof analyzeJournalPatterns> | null>(null)
  const [showInsights, setShowInsights] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!dog) return

    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('dog_id', dog.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setEntries(data as JournalEntry[])
      
      // Analyze patterns if we have enough entries
      if (data.length >= 3) {
        const analysis = analyzeJournalPatterns(data as JournalEntry[])
        setInsights(analysis)
      }
    }

    setLoading(false)
  }, [dog])

  useEffect(() => {
    if (dog) {
      loadEntries()
      
      // Get contextual prompt
      const journalPrompt = getJournalPrompt({})
      setPrompt(journalPrompt)
    }
  }, [dog, loadEntries])

  const saveEntry = async () => {
    if (!dog || !content.trim() || !mood) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const tags = extractTags(content)

    const { error } = await supabase.from('journal_entries').insert({
      dog_id: dog.id,
      user_id: user.id,
      content: content.trim(),
      mood,
      tags,
    })

    if (!error) {
      setContent('')
      setMood('')
      setShowNewEntry(false)
      loadEntries()
    }

    setSaving(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getMoodEmoji = (moodValue: string) => {
    return MOODS.find(m => m.value === moodValue)?.emoji || '😐'
  }

  if (dogLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-200" />
          <div className="h-4 w-24 bg-amber-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader 
        title="Journal" 
        subtitle={`Track ${dog?.name}'s journey`}
        showBack
        backHref="/dashboard"
      />

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">

          {/* New Entry Button or Form */}
          {!showNewEntry ? (
            <Button onClick={() => setShowNewEntry(true)} fullWidth size="lg">
              <PenLine className="w-5 h-5" />
              Write Entry
            </Button>
          ) : (
            <Card variant="elevated" padding="lg">
              {/* Prompt */}
              {prompt && (
                <div className="bg-amber-50 rounded-lg p-3 mb-4">
                  <p className="text-amber-800 text-sm">{prompt.prompt}</p>
                </div>
              )}

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? How did training go?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400 resize-none mb-4"
                rows={4}
                autoFocus
              />

              {/* Mood Selection */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">How are you feeling?</p>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className={`flex-1 py-2 rounded-lg border-2 transition ${
                        mood === m.value
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => { setShowNewEntry(false); setContent(''); setMood('') }}
                  variant="secondary"
                  fullWidth
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveEntry}
                  disabled={!content.trim() || !mood}
                  loading={saving}
                  fullWidth
                >
                  Save
                </Button>
              </div>
            </Card>
          )}

          {/* AI Insights Card */}
          {insights && insights.insights.length > 0 && (
            <Card 
              variant="outlined" 
              padding="md" 
              pressable
              onClick={() => setShowInsights(!showInsights)}
              className="bg-purple-50 border-purple-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-purple-900">AI Insights Available</h3>
                  <p className="text-sm text-purple-700">
                    {insights.insights.length} pattern{insights.insights.length !== 1 ? 's' : ''} found in your journal
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 text-purple-400 transition ${showInsights ? 'rotate-90' : ''}`} />
              </div>

              {showInsights && (
                <div className="mt-4 pt-4 border-t border-purple-200 space-y-3">
                  {insights.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800">{insight}</p>
                    </div>
                  ))}
                  
                  {insights.recommendations.length > 0 && (
                    <div className="bg-purple-100 rounded-lg p-3 mt-3">
                      <p className="text-sm font-medium text-purple-900 mb-1">💡 Recommendation</p>
                      <p className="text-sm text-purple-800">{insights.recommendations[0]}</p>
                    </div>
                  )}

                  {/* Mood trend */}
                  {insights.moodTrend !== 'unknown' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-purple-700">Mood trend:</span>
                      <span className={`text-sm font-medium ${
                        insights.moodTrend === 'improving' ? 'text-green-600' :
                        insights.moodTrend === 'declining' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {insights.moodTrend === 'improving' && '📈 Improving'}
                        {insights.moodTrend === 'stable' && '➡️ Stable'}
                        {insights.moodTrend === 'declining' && '📉 Needs attention'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Community Patterns (show if relevant) */}
          {entries.length > 0 && entries[0].tags.length > 0 && (
            (() => {
              const communityPattern = getRelevantCommunityPattern(entries[0].tags)
              if (!communityPattern) return null
              
              return (
                <Card variant="outlined" padding="md" className="bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">You're not alone</h3>
                      <p className="text-sm text-blue-700 mt-1">{communityPattern.pattern}</p>
                      <p className="text-sm text-blue-800 mt-2 font-medium">💡 {communityPattern.advice}</p>
                      <p className="text-xs text-blue-500 mt-1">{communityPattern.frequency}% of owners experience this</p>
                    </div>
                  </div>
                </Card>
              )
            })()
          )}

          {/* Journal Entries */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {entries.length > 0 ? `Your Entries (${entries.length})` : 'No entries yet'}
            </h2>

            {entries.length === 0 ? (
              <Card variant="filled" padding="lg" className="text-center">
                <span className="text-4xl mb-3 block">📝</span>
                <p className="text-gray-600">
                  Start journaling to track patterns and get personalized insights about {dog?.name}'s progress.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <Card key={entry.id} variant="elevated" padding="md">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{entry.content}</p>
                        
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 4).map(tag => (
                              <span 
                                key={tag} 
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                              >
                                {tag.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}