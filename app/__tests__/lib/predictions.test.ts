import { describe, it, expect } from 'vitest'
import {
  getPredictions,
  getTopPrediction,
  DogProfile,
  ProgressData,
} from '../../lib/predictions'

describe('Predictions System', () => {
  const defaultProfile: DogProfile = {
    breed: 'Labrador',
    age: 'adult',
    severity: 'moderate',
    baseline: 5,
  }

  const emptyProgress: ProgressData = {
    totalPractices: 0,
    calmResponses: 0,
    cuesMastered: 0,
    totalCues: 0,
    daysSinceStart: 0,
    currentStreak: 0,
    sessionsCompleted: 0,
    longestAbsence: 0,
  }

  describe('getPredictions', () => {
    it('returns building data message for new users', () => {
      const result = getPredictions(defaultProfile, emptyProgress)
      expect(result.some(p => p.type === 'milestone' && p.title === 'Building Data')).toBe(true)
    })

    it('returns cue mastery estimate when cues not mastered', () => {
      const progress = { ...emptyProgress, totalPractices: 10, daysSinceStart: 5, cuesMastered: 1 }
      const result = getPredictions(defaultProfile, progress)
      expect(result.some(p => p.type === 'mastery' && p.title === 'Cue Mastery Estimate')).toBe(true)
    })

    it('returns warning during plateau period', () => {
      const progress = { ...emptyProgress, daysSinceStart: 20, cuesMastered: 1 }
      const result = getPredictions(defaultProfile, progress)
      expect(result.some(p => p.type === 'warning')).toBe(true)
    })

    it('returns streak encouragement near 7 days', () => {
      const progress = { ...emptyProgress, currentStreak: 5 }
      const result = getPredictions(defaultProfile, progress)
      expect(result.some(p => p.title === 'Almost a Week!')).toBe(true)
    })
  })

  describe('getTopPrediction', () => {
    it('prioritizes warnings over other types', () => {
      const progress = { ...emptyProgress, daysSinceStart: 20, cuesMastered: 1, currentStreak: 5 }
      const result = getTopPrediction(defaultProfile, progress)
      expect(result?.type).toBe('warning')
    })

    it('returns something for any input', () => {
      const progress = { ...emptyProgress, cuesMastered: 3, totalPractices: 100 }
      const result = getTopPrediction(defaultProfile, progress)
      expect(result).not.toBeNull()
    })
  })
})