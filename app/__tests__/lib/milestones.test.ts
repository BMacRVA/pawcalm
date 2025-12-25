import { describe, it, expect } from 'vitest'
import {
  checkMilestones,
  getMilestonesByCategory,
  getNextMilestones,
  calculateMilestoneProgress,
  MilestoneProgress,
} from '../../lib/milestones'

describe('Milestones System', () => {
  const emptyProgress: MilestoneProgress = {
    totalPractices: 0,
    totalCues: 0,
    cuesMastered: 0,
    totalSessions: 0,
    longestAbsence: 0,
    currentStreak: 0,
    longestStreak: 0,
    daysActive: 0,
    calmResponses: 0,
    firstPracticeDate: null,
    journalEntries: 0,
  }

  describe('checkMilestones', () => {
    it('returns no milestones for empty progress', () => {
      const result = checkMilestones(emptyProgress, [])
      expect(result).toEqual([])
    })

    it('unlocks first_practice after 1 practice', () => {
      const progress = { ...emptyProgress, totalPractices: 1 }
      const result = checkMilestones(progress, [])
      expect(result.some(m => m.id === 'first_practice')).toBe(true)
    })

    it('unlocks first_calm after 1 calm response', () => {
      const progress = { ...emptyProgress, calmResponses: 1, totalPractices: 1 }
      const result = checkMilestones(progress, [])
      expect(result.some(m => m.id === 'first_calm')).toBe(true)
    })

    it('unlocks five_practices after 5 practices', () => {
      const progress = { ...emptyProgress, totalPractices: 5 }
      const result = checkMilestones(progress, [])
      expect(result.some(m => m.id === 'five_practices')).toBe(true)
    })

    it('unlocks three_day_streak after 3 day streak', () => {
      const progress = { ...emptyProgress, currentStreak: 3 }
      const result = checkMilestones(progress, [])
      expect(result.some(m => m.id === 'three_day_streak')).toBe(true)
    })

    it('does not unlock already unlocked milestones', () => {
      const progress = { ...emptyProgress, totalPractices: 5 }
      const existing = ['first_practice', 'five_practices']
      const result = checkMilestones(progress, existing)
      expect(result.some(m => m.id === 'first_practice')).toBe(false)
    })
  })

  describe('getMilestonesByCategory', () => {
    it('returns all categories', () => {
      const result = getMilestonesByCategory([])
      expect(result).toHaveProperty('engagement')
      expect(result).toHaveProperty('cues')
      expect(result).toHaveProperty('sessions')
      expect(result).toHaveProperty('consistency')
      expect(result).toHaveProperty('breakthrough')
    })
  })

  describe('getNextMilestones', () => {
    it('returns next milestones for new user', () => {
      const result = getNextMilestones(emptyProgress, [])
      expect(result.length).toBeGreaterThan(0)
      expect(result.length).toBeLessThanOrEqual(3)
    })
  })

  describe('calculateMilestoneProgress', () => {
    it('calculates progress for five_practices', () => {
      const progress = { ...emptyProgress, totalPractices: 3 }
      const result = calculateMilestoneProgress('five_practices', progress)
      expect(result).toEqual({ current: 3, target: 5, percentage: 60 })
    })

    it('returns null for unknown milestone', () => {
      const result = calculateMilestoneProgress('unknown_milestone', emptyProgress)
      expect(result).toBeNull()
    })
  })
})