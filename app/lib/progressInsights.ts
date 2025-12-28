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
  // Dog responses from first week
  firstWeekResponses: ('calm' | 'noticed' | 'anxious')[]
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
  // Total practices count
  totalPractices: number
  // Best cue improvement (name and percentage points gained)
  bestCueImprovement?: {
    name: string
    startCalmRate: number
    currentCalmRate: number
    practiceCount: number
  }
}

export type ProgressInsight = {
  message: string
  emoji: string
  type: 'celebration' | 'encouragement' | 'trend' | 'milestone' | 'reassurance' | 'proof'
}

export function getProgressInsight(data: ProgressData, dogName: string): ProgressInsight {
  
  // Calculate trends
  const thisWeekPositive = data.thisWeekRatings.filter(r => r === 'good' || r === 'great').length
  const lastWeekPositive = data.lastWeekRatings.filter(r => r === 'good' || r === 'great').length
  const thisWeekTotal = data.thisWeekRatings.length
  const lastWeekTotal = data.lastWeekRatings.length
  
  const thisWeekCalm = data.thisWeekResponses.filter(r => r === 'calm').length
  const lastWeekCalm = data.lastWeekResponses.filter(r => r === 'calm').length
  const firstWeekCalm = data.firstWeekResponses.filter(r => r === 'calm').length
  
  const thisWeekResponseTotal = data.thisWeekResponses.length
  const lastWeekResponseTotal = data.lastWeekResponses.length
  const firstWeekResponseTotal = data.firstWeekResponses.length

  const thisWeekCalmRate = thisWeekResponseTotal > 0 ? thisWeekCalm / thisWeekResponseTotal : 0
  const lastWeekCalmRate = lastWeekResponseTotal > 0 ? lastWeekCalm / lastWeekResponseTotal : 0
  const firstWeekCalmRate = firstWeekResponseTotal > 0 ? firstWeekCalm / firstWeekResponseTotal : 0

  const thisWeekPositiveRate = thisWeekTotal > 0 ? thisWeekPositive / thisWeekTotal : 0
  const lastWeekPositiveRate = lastWeekTotal > 0 ? lastWeekPositive / lastWeekTotal : 0

  // Priority 1: Show proof when there's clear improvement from start
  if (data.daysSinceStart >= 7 && firstWeekResponseTotal >= 3 && thisWeekResponseTotal >= 3) {
    const improvementFromStart = Math.round((thisWeekCalmRate - firstWeekCalmRate) * 100)
    if (improvementFromStart >= 15) {
      return {
        message: `${dogName} is ${improvementFromStart}% calmer than week one. That's your consistency paying off.`,
        emoji: '📈',
        type: 'proof'
      }
    }
  }

  // Priority 2: Show specific cue improvement as proof
  if (data.bestCueImprovement && data.bestCueImprovement.practiceCount >= 5) {
    const improvement = data.bestCueImprovement.currentCalmRate - data.bestCueImprovement.startCalmRate
    if (improvement >= 20) {
      return {
        message: `"${data.bestCueImprovement.name}" went from ${data.bestCueImprovement.startCalmRate}% to ${data.bestCueImprovement.currentCalmRate}% calm. ${data.bestCueImprovement.practiceCount} practices did that.`,
        emoji: '✓',
        type: 'proof'
      }
    }
  }

  // Priority 3: Connect practice count to outcomes
  if (data.totalPractices >= 20 && thisWeekCalmRate >= 0.6) {
    return {
      message: `${data.totalPractices} practices in, and ${Math.round(thisWeekCalmRate * 100)}% calm this week. The method is working.`,
      emoji: '💪',
      type: 'proof'
    }
  }

  // Priority 4: First-time celebrations
  if (data.isFirstGreatEver && data.hadGreatThisWeek) {
    return {
      message: `Your first "great" session! That feeling is real progress.`,
      emoji: '🎉',
      type: 'celebration'
    }
  }

  // Priority 5: Streak milestones with method validation
  if (data.currentStreak >= 7) {
    return {
      message: `${data.currentStreak} days consistent. Research shows this is when dogs start to generalize - keep going.`,
      emoji: '🔥',
      type: 'proof'
    }
  }

  if (data.currentStreak === data.longestStreak && data.currentStreak >= 3) {
    return {
      message: `${data.currentStreak} days - your longest streak. Consistency is the #1 predictor of success.`,
      emoji: '🔥',
      type: 'milestone'
    }
  }

  // Priority 6: Mastery celebration with validation
  if (data.cuesMastered > 0 && data.cuesMastered === data.totalCues) {
    return {
      message: `All ${data.totalCues} cues mastered. ${dogName}'s nervous system is learning departure = safe.`,
      emoji: '🏆',
      type: 'proof'
    }
  }

  // Priority 7: Week-over-week dog improvement
  if (thisWeekResponseTotal >= 3 && lastWeekResponseTotal >= 3) {
    const weekOverWeekImprovement = Math.round((thisWeekCalmRate - lastWeekCalmRate) * 100)
    if (weekOverWeekImprovement >= 10) {
      return {
        message: `${dogName} is ${weekOverWeekImprovement}% calmer than last week. You're doing this right.`,
        emoji: '📈',
        type: 'proof'
      }
    }
  }

  // Priority 8: Sessions feeling easier (owner experience improving)
  if (thisWeekTotal >= 3 && lastWeekTotal >= 3) {
    if (thisWeekPositiveRate > lastWeekPositiveRate + 0.15) {
      return {
        message: `Sessions are feeling easier. That means the routine is becoming natural for both of you.`,
        emoji: '✨',
        type: 'trend'
      }
    }
  }

  // Priority 9: Validate the method for newer users
  if (data.totalSessions >= 5 && data.totalSessions < 15 && data.currentStreak >= 2) {
    return {
      message: `${data.totalSessions} sessions done. You're building the foundation - this is exactly how it works.`,
      emoji: '🌱',
      type: 'proof'
    }
  }

  // Priority 10: Tough week but still showing up
  if (thisWeekTotal >= 3) {
    const thisWeekTough = data.thisWeekRatings.filter(r => r === 'tough').length
    if (thisWeekTough >= thisWeekTotal * 0.5) {
      return {
        message: `Tough week - but showing up matters more than perfect sessions. ${dogName} is still learning.`,
        emoji: '💙',
        type: 'reassurance'
      }
    }
  }

  // Priority 11: Good week acknowledgment with validation
  if (thisWeekTotal >= 3 && thisWeekPositiveRate >= 0.6) {
    return {
      message: `Most sessions felt good this week. That's a sign you and ${dogName} are in sync.`,
      emoji: '✨',
      type: 'encouragement'
    }
  }

  // Priority 12: New user encouragement with expectation setting
  if (data.totalSessions < 10) {
    return {
      message: `You're building a foundation. Most dogs show real progress after 2-3 weeks of daily practice.`,
      emoji: '🌱',
      type: 'encouragement'
    }
  }

  // Priority 13: Streak encouragement with science
  if (data.currentStreak >= 3) {
    return {
      message: `${data.currentStreak} days in a row. ${dogName}'s brain is rewiring - each rep makes "alone" feel safer.`,
      emoji: '💪',
      type: 'proof'
    }
  }

  // Priority 14: General progress with validation
  if (data.cuesMastered > 0) {
    return {
      message: `${data.cuesMastered} cue${data.cuesMastered > 1 ? 's' : ''} mastered means ${data.cuesMastered} trigger${data.cuesMastered > 1 ? 's' : ''} that no longer scare ${dogName}.`,
      emoji: '📊',
      type: 'proof'
    }
  }

  // Default: Method validation
  return {
    message: `Every calm rep teaches ${dogName} that departure cues aren't scary. Keep going.`,
    emoji: '🐕',
    type: 'encouragement'
  }
}