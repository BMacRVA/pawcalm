// Progress Milestones - Celebrate every small win

export type Milestone = {
  id: string
  title: string
  description: string
  emoji: string
  category: 'engagement' | 'cues' | 'sessions' | 'consistency' | 'breakthrough'
  unlockedAt?: string
}

export type MilestoneProgress = {
  totalPractices: number
  totalCues: number
  cuesMastered: number
  totalSessions: number
  longestAbsence: number
  currentStreak: number
  longestStreak: number
  daysActive: number
  calmResponses: number
  firstPracticeDate: string | null
  journalEntries: number
}

// All possible milestones
const ALL_MILESTONES: Milestone[] = [
  // Engagement milestones - just showing up matters
  { id: 'first_open', title: 'First Step', description: 'You opened the app and started your journey', emoji: '🌱', category: 'engagement' },
  { id: 'first_practice', title: 'First Try', description: 'You practiced your first cue', emoji: '🎯', category: 'engagement' },
  { id: 'five_practices', title: 'Getting Started', description: 'Completed 5 cue practices', emoji: '✋', category: 'engagement' },
  { id: 'ten_practices', title: 'Building Momentum', description: 'Completed 10 cue practices', emoji: '🔟', category: 'engagement' },
  { id: 'twenty_five_practices', title: 'Dedicated', description: 'Completed 25 cue practices', emoji: '💪', category: 'engagement' },
  { id: 'fifty_practices', title: 'Committed', description: 'Completed 50 cue practices', emoji: '🌟', category: 'engagement' },
  { id: 'hundred_practices', title: 'Expert Practitioner', description: 'Completed 100 cue practices', emoji: '💯', category: 'engagement' },

  // Cue milestones
  { id: 'first_calm', title: 'First Calm Response', description: 'Your dog stayed calm for the first time!', emoji: '😌', category: 'cues' },
  { id: 'three_calm_streak', title: 'Calm Streak', description: '3 calm responses in a row on one cue', emoji: '🔥', category: 'cues' },
  { id: 'first_mastery', title: 'First Cue Mastered', description: 'Your dog mastered their first cue!', emoji: '🏆', category: 'cues' },
  { id: 'three_mastered', title: 'Triple Mastery', description: 'Mastered 3 cues - ready for absences!', emoji: '🎓', category: 'cues' },
  { id: 'five_mastered', title: 'Cue Champion', description: 'Mastered 5 different cues', emoji: '👑', category: 'cues' },
  { id: 'all_cues_mastered', title: 'Complete Mastery', description: 'Every cue is mastered!', emoji: '🌈', category: 'cues' },

  // Session milestones
  { id: 'first_session', title: 'First Absence', description: 'Completed your first absence session', emoji: '🚪', category: 'sessions' },
  { id: 'first_success', title: 'Successful Absence', description: 'Your dog stayed calm while you were gone!', emoji: '🎉', category: 'sessions' },
  { id: 'five_sessions', title: 'Session Regular', description: 'Completed 5 absence sessions', emoji: '📈', category: 'sessions' },
  { id: 'five_minutes', title: '5 Minute Mark', description: 'Your dog was calm for 5 minutes alone', emoji: '⏱️', category: 'sessions' },
  { id: 'fifteen_minutes', title: 'Quarter Hour', description: '15 minutes of calm absence', emoji: '🕐', category: 'sessions' },
  { id: 'thirty_minutes', title: 'Half Hour Hero', description: '30 minutes of calm absence!', emoji: '🏅', category: 'sessions' },
  { id: 'one_hour', title: 'Hour of Freedom', description: 'A full hour of calm absence', emoji: '🎖️', category: 'sessions' },

  // Consistency milestones
  { id: 'three_day_streak', title: '3 Day Streak', description: 'Practiced 3 days in a row', emoji: '🔥', category: 'consistency' },
  { id: 'seven_day_streak', title: 'Week Warrior', description: 'A full week of daily practice!', emoji: '📅', category: 'consistency' },
  { id: 'fourteen_day_streak', title: 'Two Week Champion', description: '14 days of consistency', emoji: '⭐', category: 'consistency' },
  { id: 'thirty_day_streak', title: 'Monthly Master', description: '30 days straight - incredible!', emoji: '👑', category: 'consistency' },
  { id: 'week_active', title: 'First Week', description: 'Active for 7 days', emoji: '📆', category: 'consistency' },
  { id: 'month_active', title: 'One Month Journey', description: 'On this journey for a month', emoji: '🗓️', category: 'consistency' },

  // Breakthrough milestones
  { id: 'first_journal', title: 'Reflective', description: 'Wrote your first journal entry', emoji: '📝', category: 'breakthrough' },
  { id: 'ten_journals', title: 'Dedicated Journaler', description: '10 journal entries - tracking your journey', emoji: '📓', category: 'breakthrough' },
  { id: 'overcame_setback', title: 'Resilient', description: 'Bounced back after a tough day', emoji: '💪', category: 'breakthrough' },
  { id: 'pattern_discovered', title: 'Pattern Spotter', description: 'AI found a pattern in your progress', emoji: '🔍', category: 'breakthrough' },
]

export function checkMilestones(progress: MilestoneProgress, existingMilestones: string[]): Milestone[] {
  const newMilestones: Milestone[] = []
  const now = new Date().toISOString()

  const checks: Record<string, boolean> = {
    // Engagement
    first_practice: progress.totalPractices >= 1,
    five_practices: progress.totalPractices >= 5,
    ten_practices: progress.totalPractices >= 10,
    twenty_five_practices: progress.totalPractices >= 25,
    fifty_practices: progress.totalPractices >= 50,
    hundred_practices: progress.totalPractices >= 100,

    // Cues
    first_calm: progress.calmResponses >= 1,
    first_mastery: progress.cuesMastered >= 1,
    three_mastered: progress.cuesMastered >= 3,
    five_mastered: progress.cuesMastered >= 5,
    all_cues_mastered: progress.totalCues > 0 && progress.cuesMastered >= progress.totalCues,

    // Sessions
    first_session: progress.totalSessions >= 1,
    five_sessions: progress.totalSessions >= 5,
    five_minutes: progress.longestAbsence >= 5,
    fifteen_minutes: progress.longestAbsence >= 15,
    thirty_minutes: progress.longestAbsence >= 30,
    one_hour: progress.longestAbsence >= 60,

    // Consistency
    three_day_streak: progress.currentStreak >= 3 || progress.longestStreak >= 3,
    seven_day_streak: progress.currentStreak >= 7 || progress.longestStreak >= 7,
    fourteen_day_streak: progress.currentStreak >= 14 || progress.longestStreak >= 14,
    thirty_day_streak: progress.currentStreak >= 30 || progress.longestStreak >= 30,
    week_active: progress.daysActive >= 7,
    month_active: progress.daysActive >= 30,

    // Breakthroughs
    first_journal: progress.journalEntries >= 1,
    ten_journals: progress.journalEntries >= 10,
  }

  for (const milestone of ALL_MILESTONES) {
    if (checks[milestone.id] && !existingMilestones.includes(milestone.id)) {
      newMilestones.push({ ...milestone, unlockedAt: now })
    }
  }

  return newMilestones
}

export function getMilestonesByCategory(unlockedIds: string[]): Record<string, Milestone[]> {
  const result: Record<string, Milestone[]> = {
    engagement: [],
    cues: [],
    sessions: [],
    consistency: [],
    breakthrough: [],
  }

  for (const milestone of ALL_MILESTONES) {
    const isUnlocked = unlockedIds.includes(milestone.id)
    result[milestone.category].push({
      ...milestone,
      unlockedAt: isUnlocked ? 'unlocked' : undefined,
    })
  }

  return result
}

export function getNextMilestones(progress: MilestoneProgress, unlockedIds: string[]): Milestone[] {
  const next: Milestone[] = []

  // Find the next milestone in each category
  const categories = ['engagement', 'cues', 'sessions', 'consistency']
  
  for (const category of categories) {
    const categoryMilestones = ALL_MILESTONES.filter(m => m.category === category)
    const nextInCategory = categoryMilestones.find(m => !unlockedIds.includes(m.id))
    if (nextInCategory) {
      next.push(nextInCategory)
    }
  }

  return next.slice(0, 3) // Return top 3 next milestones
}

export function calculateMilestoneProgress(
  milestoneId: string, 
  progress: MilestoneProgress
): { current: number; target: number; percentage: number } | null {
  const targets: Record<string, { current: number; target: number }> = {
    five_practices: { current: progress.totalPractices, target: 5 },
    ten_practices: { current: progress.totalPractices, target: 10 },
    twenty_five_practices: { current: progress.totalPractices, target: 25 },
    fifty_practices: { current: progress.totalPractices, target: 50 },
    hundred_practices: { current: progress.totalPractices, target: 100 },
    three_mastered: { current: progress.cuesMastered, target: 3 },
    five_mastered: { current: progress.cuesMastered, target: 5 },
    five_sessions: { current: progress.totalSessions, target: 5 },
    five_minutes: { current: progress.longestAbsence, target: 5 },
    fifteen_minutes: { current: progress.longestAbsence, target: 15 },
    thirty_minutes: { current: progress.longestAbsence, target: 30 },
    one_hour: { current: progress.longestAbsence, target: 60 },
    three_day_streak: { current: progress.currentStreak, target: 3 },
    seven_day_streak: { current: progress.currentStreak, target: 7 },
    fourteen_day_streak: { current: progress.currentStreak, target: 14 },
    thirty_day_streak: { current: progress.currentStreak, target: 30 },
    ten_journals: { current: progress.journalEntries, target: 10 },
  }

  const data = targets[milestoneId]
  if (!data) return null

  return {
    current: data.current,
    target: data.target,
    percentage: Math.min(100, Math.round((data.current / data.target) * 100)),
  }
}