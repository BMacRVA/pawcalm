// Journal System with AI Insights

export type JournalEntry = {
  id: string
  dog_id: number
  content: string
  mood: 'great' | 'good' | 'okay' | 'tough' | 'hard'
  tags: string[]
  ai_insights: string | null
  created_at: string
}

export type JournalPrompt = {
  id: string
  prompt: string
  category: 'reflection' | 'celebration' | 'challenge' | 'observation'
}

// Contextual prompts based on recent activity
export function getJournalPrompt(context: {
  lastResponse?: string
  streak?: number
  recentSetback?: boolean
  justMastered?: boolean
  daysInactive?: number
}): JournalPrompt {
  
  if (context.justMastered) {
    return {
      id: 'mastery_celebration',
      prompt: "You just mastered a cue! 🎉 How does it feel? What do you think made the difference?",
      category: 'celebration'
    }
  }

  if (context.recentSetback) {
    return {
      id: 'setback_reflection',
      prompt: "Today was tough. What happened? Sometimes writing it out helps us see patterns.",
      category: 'challenge'
    }
  }

  if (context.daysInactive && context.daysInactive >= 3) {
    return {
      id: 'return_reflection',
      prompt: "Welcome back! What's been going on? No judgment - life happens.",
      category: 'reflection'
    }
  }

  if (context.streak && context.streak >= 7) {
    return {
      id: 'streak_reflection',
      prompt: `${context.streak} days in a row! What's helping you stay consistent?`,
      category: 'celebration'
    }
  }

  if (context.lastResponse === 'calm') {
    return {
      id: 'calm_observation',
      prompt: "Your dog was calm! Did you notice anything different about today?",
      category: 'observation'
    }
  }

  if (context.lastResponse === 'anxious') {
    return {
      id: 'anxious_reflection',
      prompt: "Your dog was anxious. Any ideas why? (time of day, noises, your energy?)",
      category: 'observation'
    }
  }

  // Default prompts
  const defaults: JournalPrompt[] = [
    { id: 'general_1', prompt: "How did training go today?", category: 'reflection' },
    { id: 'general_2', prompt: "What did you notice about your dog today?", category: 'observation' },
    { id: 'general_3', prompt: "How are YOU feeling about the training journey?", category: 'reflection' },
    { id: 'general_4', prompt: "Any small wins to celebrate?", category: 'celebration' },
  ]

  return defaults[Math.floor(Math.random() * defaults.length)]
}

// Extract tags from journal content
export function extractTags(content: string): string[] {
  const tags: string[] = []
  const lowerContent = content.toLowerCase()

  // Time patterns
  if (lowerContent.includes('morning')) tags.push('morning')
  if (lowerContent.includes('afternoon')) tags.push('afternoon')
  if (lowerContent.includes('evening') || lowerContent.includes('night')) tags.push('evening')

  // Mood/energy patterns
  if (lowerContent.includes('tired') || lowerContent.includes('exhausted')) tags.push('low_energy')
  if (lowerContent.includes('stressed') || lowerContent.includes('anxious') || lowerContent.includes('worried')) tags.push('owner_stressed')
  if (lowerContent.includes('calm') || lowerContent.includes('relaxed')) tags.push('calm')
  if (lowerContent.includes('happy') || lowerContent.includes('excited') || lowerContent.includes('proud')) tags.push('positive')
  if (lowerContent.includes('frustrated') || lowerContent.includes('discouraged')) tags.push('frustrated')

  // External factors
  if (lowerContent.includes('thunder') || lowerContent.includes('storm') || lowerContent.includes('firework')) tags.push('loud_noises')
  if (lowerContent.includes('walk') || lowerContent.includes('exercise')) tags.push('exercise')
  if (lowerContent.includes('visitor') || lowerContent.includes('guest') || lowerContent.includes('someone came')) tags.push('visitors')
  if (lowerContent.includes('treat') || lowerContent.includes('food') || lowerContent.includes('kong')) tags.push('food_reward')

  // Progress patterns
  if (lowerContent.includes('better') || lowerContent.includes('improvement') || lowerContent.includes('progress')) tags.push('improvement')
  if (lowerContent.includes('worse') || lowerContent.includes('setback') || lowerContent.includes('regression')) tags.push('setback')
  if (lowerContent.includes('breakthrough') || lowerContent.includes('finally')) tags.push('breakthrough')

  // Behavior patterns
  if (lowerContent.includes('bark')) tags.push('barking')
  if (lowerContent.includes('whine') || lowerContent.includes('cry')) tags.push('whining')
  if (lowerContent.includes('pace') || lowerContent.includes('pacing')) tags.push('pacing')
  if (lowerContent.includes('follow')) tags.push('following')
  if (lowerContent.includes('destroy') || lowerContent.includes('chew') || lowerContent.includes('scratch')) tags.push('destructive')

  return [...new Set(tags)] // Remove duplicates
}

// Analyze patterns across journal entries
export function analyzeJournalPatterns(entries: JournalEntry[]): {
  insights: string[]
  commonTags: { tag: string; count: number }[]
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown'
  recommendations: string[]
} {
  if (entries.length < 3) {
    return {
      insights: ["Keep journaling! We need a few more entries to spot patterns."],
      commonTags: [],
      moodTrend: 'unknown',
      recommendations: ["Try to journal after each practice session."]
    }
  }

  // Count tags
  const tagCounts: Record<string, number> = {}
  entries.forEach(entry => {
    entry.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  const commonTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Analyze mood trend (recent vs older)
  const recentEntries = entries.slice(0, Math.ceil(entries.length / 2))
  const olderEntries = entries.slice(Math.ceil(entries.length / 2))

  const moodScore = (mood: string) => {
    const scores: Record<string, number> = { great: 5, good: 4, okay: 3, tough: 2, hard: 1 }
    return scores[mood] || 3
  }

  const recentAvg = recentEntries.reduce((sum, e) => sum + moodScore(e.mood), 0) / recentEntries.length
  const olderAvg = olderEntries.reduce((sum, e) => sum + moodScore(e.mood), 0) / olderEntries.length

  let moodTrend: 'improving' | 'stable' | 'declining' | 'unknown' = 'stable'
  if (recentAvg > olderAvg + 0.5) moodTrend = 'improving'
  if (recentAvg < olderAvg - 0.5) moodTrend = 'declining'

  // Generate insights
  const insights: string[] = []
  const recommendations: string[] = []

  // Time-based insights
  if (tagCounts['morning'] > tagCounts['evening']) {
    insights.push("You tend to practice more in the mornings.")
  }

  // Correlation insights
  if (tagCounts['exercise'] && tagCounts['calm']) {
    const exerciseEntries = entries.filter(e => e.tags.includes('exercise'))
    const calmAfterExercise = exerciseEntries.filter(e => e.tags.includes('calm')).length
    if (calmAfterExercise / exerciseEntries.length > 0.6) {
      insights.push("Your dog seems calmer on days with exercise. Keep that up!")
    }
  }

  if (tagCounts['owner_stressed'] && tagCounts['setback']) {
    insights.push("We noticed setbacks often happen when you're stressed. Dogs pick up on our energy.")
    recommendations.push("Try a quick breathing exercise before practice sessions.")
  }

  if (tagCounts['loud_noises'] && tagCounts['setback']) {
    insights.push("Loud noises seem to affect your training. This is very common!")
    recommendations.push("On noisy days, consider lighter practice or skip if your dog is already on edge.")
  }

  if (tagCounts['food_reward'] && tagCounts['improvement']) {
    insights.push("Food rewards seem to help! Keep using them strategically.")
  }

  if (moodTrend === 'improving') {
    insights.push("Your overall mood about training is improving! 📈")
  } else if (moodTrend === 'declining') {
    insights.push("Training has felt harder lately. That's okay - it comes in waves.")
    recommendations.push("Consider taking a lighter day or celebrating small wins.")
  }

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push("Keep up the great journaling habit!")
  }

  return { insights, commonTags, moodTrend, recommendations }
}

// Generate AI prompt for deeper insights (to be sent to OpenAI)
export function generateInsightPrompt(entries: JournalEntry[], dogName: string, breed: string): string {
  const recentEntries = entries.slice(0, 10).map(e => ({
    date: new Date(e.created_at).toLocaleDateString(),
    mood: e.mood,
    content: e.content,
    tags: e.tags
  }))

  return `You are an expert dog separation anxiety trainer analyzing journal entries from an owner working with their ${breed} named ${dogName}.

Recent journal entries:
${JSON.stringify(recentEntries, null, 2)}

Based on these entries, provide:
1. One specific pattern you notice (be concrete, reference their actual words)
2. One encouraging observation about their progress or effort
3. One actionable tip based on what they've shared

Keep your response warm, supportive, and under 150 words total. Don't be generic - reference specific things they wrote.`
}

// Common patterns seen across all users (for community insights)
export type CommunityPattern = {
  pattern: string
  frequency: number // percentage of users who experience this
  advice: string
}

export const COMMUNITY_PATTERNS: CommunityPattern[] = [
  {
    pattern: "Dogs often regress after storms or fireworks",
    frequency: 73,
    advice: "This is temporary! Return to easier exercises for a day or two."
  },
  {
    pattern: "Week 2-3 is the hardest for most owners",
    frequency: 68,
    advice: "You're not alone. Push through - it gets easier after this plateau."
  },
  {
    pattern: "Morning practice tends to be more successful",
    frequency: 61,
    advice: "Dogs are often calmer after a night's rest. Try earlier sessions."
  },
  {
    pattern: "Owner stress directly impacts dog anxiety",
    frequency: 82,
    advice: "Take a breath before training. Your calm energy helps your dog."
  },
  {
    pattern: "Exercise before practice improves outcomes",
    frequency: 67,
    advice: "A tired dog is a calmer dog. Try a walk before practice."
  },
  {
    pattern: "Setbacks after vacations or schedule changes",
    frequency: 71,
    advice: "Routine changes are hard on anxious dogs. Ease back in gently."
  },
]

export function getRelevantCommunityPattern(tags: string[]): CommunityPattern | null {
  if (tags.includes('loud_noises')) {
    return COMMUNITY_PATTERNS[0]
  }
  if (tags.includes('owner_stressed')) {
    return COMMUNITY_PATTERNS[3]
  }
  if (tags.includes('exercise')) {
    return COMMUNITY_PATTERNS[4]
  }
  if (tags.includes('setback')) {
    return COMMUNITY_PATTERNS[1]
  }
  return null
}