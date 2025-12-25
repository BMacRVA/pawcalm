import { describe, it, expect } from 'vitest'
import {
  getOwnerSupportMessage,
  getPostPracticeMessage,
  OwnerState,
} from '../../lib/ownerSupport'

describe('Owner Support System', () => {
  const emptyState: OwnerState = {
    daysSinceLastPractice: 0,
    daysSinceLastSession: 0,
    practicesThisWeek: 0,
    recentResponses: [],
    recentOwnerFeelings: [],
    consecutiveAnxiousResponses: 0,
    consecutiveFrustratedSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    cuesMastered: 0,
    totalCues: 0,
    isFirstPractice: false,
    isFirstMastery: false,
    isFirstSuccessfulSession: false,
    justHitStreak: null,
    justMasteredCue: null,
  }

  describe('getOwnerSupportMessage', () => {
    it('returns mastery celebration when cue just mastered', () => {
      const state = { ...emptyState, justMasteredCue: 'Keys' }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result?.type).toBe('celebration')
      expect(result?.title).toContain('Mastered')
      expect(result?.message).toContain('Keys')
    })

    it('returns streak celebration for 3 day streak', () => {
      const state = { ...emptyState, justHitStreak: 3 }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result?.type).toBe('celebration')
      expect(result?.title).toContain('3 Days')
    })

    it('returns streak celebration for 7 day streak', () => {
      const state = { ...emptyState, justHitStreak: 7 }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result?.type).toBe('celebration')
      expect(result?.title).toContain('Week')
    })

    it('returns welcome back after 7+ days inactive', () => {
      const state = { ...emptyState, daysSinceLastPractice: 10 }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result?.type).toBe('welcome_back')
      expect(result?.title).toContain('Welcome back')
    })

    it('returns welcome back after 3-6 days inactive', () => {
      const state = { ...emptyState, daysSinceLastPractice: 4 }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result?.type).toBe('welcome_back')
      expect(result?.message).toContain('few days')
    })

    it('returns tough day support after 3 consecutive anxious responses', () => {
      const state = { ...emptyState, consecutiveAnxiousResponses: 3 }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result?.type).toBe('tough_day')
      expect(result?.message).toContain('anxious')
    })

    it('returns null for neutral state', () => {
      const state = { ...emptyState, daysSinceLastPractice: 1, practicesThisWeek: 2 }
      const result = getOwnerSupportMessage(state, 'Rover')
      expect(result).toBeNull()
    })
  })

  describe('getPostPracticeMessage', () => {
    it('returns encouraging message for first calm', () => {
      const result = getPostPracticeMessage('calm', 1, 0, 'Rover')
      expect(result).toContain('Rover')
    })

    it('returns supportive message for slight reaction', () => {
      const result = getPostPracticeMessage('slight_reaction', 0, 0, 'Rover')
      expect(result).toContain('progress')
    })

    it('returns reassuring message for first anxious', () => {
      const result = getPostPracticeMessage('anxious', 0, 1, 'Rover')
      expect(result).toContain('okay')
    })
  })
})