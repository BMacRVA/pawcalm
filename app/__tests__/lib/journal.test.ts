import { describe, it, expect } from 'vitest'
import {
  getJournalPrompt,
  extractTags,
  analyzeJournalPatterns,
  getRelevantCommunityPattern,
  JournalEntry,
} from '../../lib/journal'

describe('Journal System', () => {
  describe('getJournalPrompt', () => {
    it('returns mastery celebration prompt when cue just mastered', () => {
      const result = getJournalPrompt({ justMastered: true })
      expect(result.id).toBe('mastery_celebration')
      expect(result.category).toBe('celebration')
    })

    it('returns setback prompt after recent setback', () => {
      const result = getJournalPrompt({ recentSetback: true })
      expect(result.id).toBe('setback_reflection')
      expect(result.category).toBe('challenge')
    })

    it('returns welcome back prompt after 3+ days inactive', () => {
      const result = getJournalPrompt({ daysInactive: 5 })
      expect(result.id).toBe('return_reflection')
      expect(result.category).toBe('reflection')
    })

    it('returns default prompt when no context', () => {
      const result = getJournalPrompt({})
      expect(result.prompt).toBeTruthy()
    })
  })

  describe('extractTags', () => {
    it('extracts time of day tags', () => {
      expect(extractTags('We practiced this morning')).toContain('morning')
      expect(extractTags('Evening session went well')).toContain('evening')
    })

    it('extracts mood/energy tags', () => {
      expect(extractTags('I was really tired today')).toContain('low_energy')
      expect(extractTags('Feeling stressed about work')).toContain('owner_stressed')
    })

    it('extracts external factor tags', () => {
      expect(extractTags('Thunder scared him')).toContain('loud_noises')
      expect(extractTags('After a long walk')).toContain('exercise')
    })

    it('returns empty array for content with no tags', () => {
      const result = extractTags('Just a regular day')
      expect(result.length).toBe(0)
    })
  })

  describe('analyzeJournalPatterns', () => {
    it('returns early message with fewer than 3 entries', () => {
      const entries: JournalEntry[] = [
        { id: '1', dog_id: 1, content: 'Test', mood: 'good', tags: [], ai_insights: null, created_at: new Date().toISOString() },
      ]
      const result = analyzeJournalPatterns(entries)
      expect(result.insights[0]).toContain('few more entries')
      expect(result.moodTrend).toBe('unknown')
    })
  })

  describe('getRelevantCommunityPattern', () => {
    it('returns loud noises pattern', () => {
      const result = getRelevantCommunityPattern(['loud_noises'])
      expect(result?.pattern).toContain('storms')
    })

    it('returns null for irrelevant tags', () => {
      const result = getRelevantCommunityPattern(['random_tag'])
      expect(result).toBeNull()
    })
  })
})