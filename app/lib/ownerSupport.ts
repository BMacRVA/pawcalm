// Owner Support System - Makes owners feel seen, supported, and motivated

export type OwnerState = {
  daysSinceLastPractice: number
  daysSinceLastSession: number
  practicesThisWeek: number
  recentResponses: string[]
  recentOwnerFeelings: string[]
  consecutiveAnxiousResponses: number
  consecutiveFrustratedSessions: number
  currentStreak: number
  longestStreak: number
  cuesMastered: number
  totalCues: number
  isFirstPractice: boolean
  isFirstMastery: boolean
  isFirstSuccessfulSession: boolean
  justHitStreak: number | null
  justMasteredCue: string | null
}

export type SupportMessage = {
  type: 'encouragement' | 'celebration' | 'welcome_back' | 'tough_day' | 'tip'
  title: string
  message: string
  emoji: string
  action?: {
    label: string
    href: string
  }
}

export function getOwnerSupportMessage(state: OwnerState, dogName: string): SupportMessage | null {
  
  // Priority 1: Celebrate milestones
  if (state.justMasteredCue) {
    return {
      type: 'celebration',
      title: '🏆 Cue Mastered!',
      message: `${dogName} has mastered "${state.justMasteredCue}"! This is real, measurable progress. You're doing amazing work.`,
      emoji: '🏆',
      action: { label: 'See Progress', href: '/progress' }
    }
  }

  if (state.justHitStreak === 3) {
    return {
      type: 'celebration',
      title: '3 Days Strong! 💪',
      message: `Three days in a row! You're building a habit. ${dogName} is already learning that consistency means safety.`,
      emoji: '💪'
    }
  }

  if (state.justHitStreak === 7) {
    return {
      type: 'celebration', 
      title: '🔥 One Week Streak!',
      message: `7 days in a row! Consistency is the #1 predictor of success. ${dogName} is lucky to have you.`,
      emoji: '🔥'
    }
  }

  if (state.justHitStreak === 14) {
    return {
      type: 'celebration',
      title: '⭐ Two Week Champion!',
      message: `14 days of dedication. Most people give up by now. You're in the top 10% of committed dog parents.`,
      emoji: '⭐'
    }
  }

  if (state.justHitStreak === 30) {
    return {
      type: 'celebration',
      title: '👑 30 Day Legend!',
      message: `A full month of showing up for ${dogName}. This level of commitment is rare and beautiful.`,
      emoji: '👑'
    }
  }

  // Priority 2: Welcome back after absence
  if (state.daysSinceLastPractice >= 7) {
    return {
      type: 'welcome_back',
      title: 'Welcome back! 💛',
      message: `Life gets busy - no judgment here. ${dogName} might need a few easy wins to rebuild confidence. Start with the cue that's closest to mastered.`,
      emoji: '💛',
      action: { label: 'Easy Practice', href: '/departure-practice' }
    }
  }

  if (state.daysSinceLastPractice >= 3) {
    return {
      type: 'welcome_back',
      title: `${dogName} missed you!`,
      message: `It's been a few days. That's okay! Even one quick practice today keeps the momentum going.`,
      emoji: '🐕',
      action: { label: 'Quick Practice', href: '/departure-practice' }
    }
  }

  // Priority 3: Support after tough times
  if (state.consecutiveAnxiousResponses >= 3) {
    return {
      type: 'tough_day',
      title: "Tough stretch - and that's okay",
      message: `${dogName} has been anxious lately. This happens! It might mean we need to make things easier. Try practicing a cue ${dogName} has done well with before, or take a rest day.`,
      emoji: '💙',
      action: { label: 'Try Easier Cue', href: '/departure-practice' }
    }
  }

  if (state.consecutiveFrustratedSessions >= 2) {
    return {
      type: 'tough_day',
      title: 'We see you working hard',
      message: `Training is emotionally tough on humans too. It's okay to feel frustrated. Would you like to skip today and just give ${dogName} some extra love?`,
      emoji: '🫂'
    }
  }

  // Priority 4: First-time celebrations
  if (state.isFirstMastery) {
    return {
      type: 'celebration',
      title: 'Your first mastered cue! 🎉',
      message: `This is HUGE. You've proven the method works for ${dogName}. The next ones will come faster.`,
      emoji: '🎉'
    }
  }

  // Priority 5: Encouragement based on progress
  if (state.currentStreak >= 3 && state.practicesThisWeek >= 5) {
    return {
      type: 'encouragement',
      title: "You're on fire! 🔥",
      message: `${state.currentStreak} day streak and ${state.practicesThisWeek} practices this week. ${dogName} is making real progress because of YOUR consistency.`,
      emoji: '🔥'
    }
  }

  // Priority 6: Tips
  if (state.cuesMastered >= 3 && state.daysSinceLastSession > 5) {
    return {
      type: 'tip',
      title: "Ready for the next step? 🚀",
      message: `You've mastered ${state.cuesMastered} cues! It might be time to try a short absence session. That's where the real magic happens.`,
      emoji: '🚀',
      action: { label: 'Try Absence Training', href: '/mission' }
    }
  }

  return null
}

export function getPostPracticeMessage(
  response: 'calm' | 'slight_reaction' | 'anxious',
  consecutiveCalm: number,
  consecutiveAnxious: number,
  dogName: string
): string {
  
  if (response === 'calm') {
    if (consecutiveCalm === 1) return `Great start! ${dogName} is learning.`
    if (consecutiveCalm === 3) return `Three calm responses in a row! ${dogName} is really getting this.`
    if (consecutiveCalm >= 5) return `${dogName} is a superstar! This cue is almost mastered.`
    return `Excellent! Keep building on this success.`
  }

  if (response === 'slight_reaction') {
    return `A small reaction is still progress. ${dogName} noticed but stayed relatively calm - that's the goal!`
  }

  if (response === 'anxious') {
    if (consecutiveAnxious === 1) return `That's okay! One anxious response doesn't erase progress. ${dogName} might just need more time with this one.`
    if (consecutiveAnxious === 2) return `Two tough ones in a row. Maybe try a different cue, or take a break and come back later.`
    if (consecutiveAnxious >= 3) return `${dogName} is having a hard time today. That's valuable data! Consider ending on an easy win with a mastered cue, or just give cuddles.`
  }

  return ''
}