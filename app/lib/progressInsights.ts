// Progress Insights - Generates contextual, motivational messages based on owner's data

export type ProgressData = {
  // Session ratings from this week
  thisWeekRatings: ('tough' | 'okay' | 'good' | 'great')[]
  // Session ratings from last week
  lastWeekRatings: ('tough' | 'okay' | 'good' | 'great')[]
  // Dog responses this week
  thisWeekResponses: ('calm' | 'noticed' | 'anxious')[]
  // Dog responses last week
  lastWeekResponses: ('calm' | 'noticed' | 'anxious')[]
  // Current streak
  currentStreak: number
  // Longest streak ever
  longestStreak: number
  // Total sessions ever
  totalSessions: number
  // Cues mastered
  cuesMastered: number
  // Total cues
  totalCues: number
  // Days since first practice
  daysSinceStart: number
  // Had a 'great' rating this week
  hadGreatThisWeek: boolean
  // First 'great' rating ever
  isFirstGreatEver: boolean
}

export type ProgressInsight = {
  message: string
  emoji: string
  type: 'celebration' | 'encouragement' | 'trend' | 'milestone' | 'reassurance'
}

export function getProgressInsight(data: ProgressData, dogName: string): ProgressInsight {
  
  // Calculate trends
  const thisWeekPositive = data.thisWeekRatings.filter(r => r === 'good' || r === 'great').length
  const lastWeekPositive = data.lastWeekRatings.filter(r => r === 'good' || r === 'great').length
  const thisWeekTotal = data.thisWeekRatings.length
  const lastWeekTotal = data.lastWeekRatings.length
  
  const thisWeekCalm = data.thisWeekResponses.filter(r => r === 'calm').length
  const lastWeekCalm = data.lastWeekResponses.filter(r => r === 'calm').length
  const thisWeekResponseTotal = data.thisWeekResponses.length
  const lastWeekResponseTotal = data.lastWeekResponses.length

  const thisWeekPositiveRate = thisWeekTotal > 0 ? thisWeekPositive / thisWeekTotal : 0
  const lastWeekPositiveRate = lastWeekTotal > 0 ? lastWeekPositive / lastWeekTotal : 0
  
  const thisWeekCalmRate = thisWeekResponseTotal > 0 ? thisWeekCalm / thisWeekResponseTotal : 0
  const lastWeekCalmRate = lastWeekResponseTotal > 0 ? lastWeekCalm / lastWeekResponseTotal : 0

  // Priority 1: First-time celebrations
  if (data.isFirstGreatEver && data.hadGreatThisWeek) {
    return {
      message: `Your first "great" session! That feeling is real progress.`,
      emoji: '🎉',
      type: 'celebration'
    }
  }

  // Priority 2: Streak milestones
  if (data.currentStreak === data.longestStreak && data.currentStreak >= 3) {
    return {
      message: `${data.currentStreak} days - your longest streak yet!`,
      emoji: '🔥',
      type: 'milestone'
    }
  }

  // Priority 3: Mastery celebration
  if (data.cuesMastered > 0 && data.cuesMastered === data.totalCues) {
    return {
      message: `All ${data.totalCues} cues mastered! ${dogName} is ready for absence training.`,
      emoji: '🏆',
      type: 'celebration'
    }
  }

  // Priority 4: Sessions feeling easier (positive trend)
  if (thisWeekTotal >= 3 && lastWeekTotal >= 3) {
    if (thisWeekPositiveRate > lastWeekPositiveRate + 0.15) {
      return {
        message: `Sessions are feeling easier this week.`,
        emoji: '📈',
        type: 'trend'
      }
    }
  }

  // Priority 5: Dog improving (calm rate up)
  if (thisWeekResponseTotal >= 3 && lastWeekResponseTotal >= 3) {
    if (thisWeekCalmRate > lastWeekCalmRate + 0.15) {
      return {
        message: `${dogName} is staying calmer - your consistency is paying off.`,
        emoji: '💪',
        type: 'trend'
      }
    }
  }

  // Priority 6: Tough week but still showing up
  if (thisWeekTotal >= 3) {
    const thisWeekTough = data.thisWeekRatings.filter(r => r === 'tough').length
    if (thisWeekTough >= thisWeekTotal * 0.5) {
      return {
        message: `Tough week - but you're still showing up. That's what matters.`,
        emoji: '💙',
        type: 'reassurance'
      }
    }
  }

  // Priority 7: Good week acknowledgment
  if (thisWeekTotal >= 3 && thisWeekPositiveRate >= 0.6) {
    return {
      message: `Most sessions felt good this week. Keep it up!`,
      emoji: '✨',
      type: 'encouragement'
    }
  }

  // Priority 8: New user encouragement
  if (data.totalSessions < 10) {
    return {
      message: `You're building a foundation. Every session counts.`,
      emoji: '🌱',
      type: 'encouragement'
    }
  }

  // Priority 9: Streak encouragement
  if (data.currentStreak >= 3) {
    return {
      message: `${data.currentStreak} days in a row - ${dogName} is learning consistency means safety.`,
      emoji: '💪',
      type: 'encouragement'
    }
  }

  // Priority 10: General progress
  if (data.cuesMastered > 0) {
    return {
      message: `${data.cuesMastered} cue${data.cuesMastered > 1 ? 's' : ''} mastered. Real, measurable progress.`,
      emoji: '📊',
      type: 'milestone'
    }
  }

  // Default: Keep going
  return {
    message: `Every practice helps ${dogName} feel safer.`,
    emoji: '🐕',
    type: 'encouragement'
  }
}