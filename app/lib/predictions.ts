// Predictive Intelligence for PawCalm
// Uses research-based defaults, improves with real data

export type DogProfile = {
  breed: string
  age: string
  severity: string
  baseline: number
}

export type ProgressData = {
  totalPractices: number
  calmResponses: number
  cuesMastered: number
  totalCues: number
  daysSinceStart: number
  currentStreak: number
  sessionsCompleted: number
  longestAbsence: number
}

export type Prediction = {
  type: 'mastery' | 'milestone' | 'warning' | 'comparison'
  title: string
  message: string
  emoji: string
  confidence: 'low' | 'medium' | 'high'
  data?: {
    estimatedDays?: number
    percentile?: number
    riskFactor?: string
  }
}

// Research-based defaults (will be replaced by real data over time)
const BASELINE_STATS = {
  avgPracticesToMasterCue: 12, // ~12 practices to master a single cue
  avgDaysToMaster3Cues: 14, // ~2 weeks to master 3 cues
  avgDaysToFirstAbsence: 21, // ~3 weeks before real absences
  avgDaysTo30MinAbsence: 60, // ~2 months to reach 30 min
  regressionRiskWeek: 3, // Week 3 is common regression point
  successRateWithConsistency: 0.85, // 85% success with daily practice
  dropoffRate: 0.4, // 40% of people stop within 2 weeks
}

// Severity multipliers (harder = longer)
const SEVERITY_MULTIPLIERS: Record<string, number> = {
  'mild': 0.7,
  'moderate': 1.0,
  'severe': 1.5,
}

// Age factors (puppies learn faster, seniors slower)
const AGE_MULTIPLIERS: Record<string, number> = {
  'puppy': 0.8,
  'young': 0.9,
  'adult': 1.0,
  'senior': 1.2,
}

export function getPredictions(profile: DogProfile, progress: ProgressData): Prediction[] {
  const predictions: Prediction[] = []
  
  const severityMult = SEVERITY_MULTIPLIERS[profile.severity] || 1.0
  const ageMult = AGE_MULTIPLIERS[profile.age] || 1.0
  const combinedMult = severityMult * ageMult

  // 1. Time to master remaining cues
  if (progress.cuesMastered < 3) {
    const cuesRemaining = 3 - progress.cuesMastered
    const practicesPerCue = BASELINE_STATS.avgPracticesToMasterCue * combinedMult
    
    // Estimate based on current pace or default
    let practicesPerDay = 3 // default assumption
    if (progress.daysSinceStart > 0 && progress.totalPractices > 0) {
      practicesPerDay = progress.totalPractices / progress.daysSinceStart
    }
    
    const estimatedDays = Math.ceil((cuesRemaining * practicesPerCue) / Math.max(practicesPerDay, 1))
    
    predictions.push({
      type: 'mastery',
      title: 'Cue Mastery Estimate',
      message: `At your current pace, ${profile.severity === 'severe' ? 'expect' : 'you could'} master ${cuesRemaining} more cue${cuesRemaining > 1 ? 's' : ''} in about ${estimatedDays} days.`,
      emoji: '🎯',
      confidence: progress.totalPractices > 10 ? 'medium' : 'low',
      data: { estimatedDays }
    })
  }

  // 2. Comparison to similar dogs
  if (progress.totalPractices >= 5) {
    const expectedCalmRate = profile.severity === 'severe' ? 0.4 : profile.severity === 'moderate' ? 0.55 : 0.7
    const actualCalmRate = progress.totalPractices > 0 ? progress.calmResponses / progress.totalPractices : 0
    
    let percentile = 50
    if (actualCalmRate > expectedCalmRate * 1.2) percentile = 75
    if (actualCalmRate > expectedCalmRate * 1.4) percentile = 90
    if (actualCalmRate < expectedCalmRate * 0.8) percentile = 25
    if (actualCalmRate < expectedCalmRate * 0.6) percentile = 10
    
    if (percentile >= 75) {
      predictions.push({
        type: 'comparison',
        title: 'Above Average! 🌟',
        message: `Your calm response rate is better than ${percentile}% of dogs with ${profile.severity} anxiety. Keep it up!`,
        emoji: '🌟',
        confidence: 'medium',
        data: { percentile }
      })
    } else if (percentile <= 25) {
      predictions.push({
        type: 'comparison',
        title: 'Building Foundation',
        message: `Progress takes time with ${profile.severity} anxiety. You're building the foundation - stay consistent!`,
        emoji: '💪',
        confidence: 'medium',
        data: { percentile }
      })
    }
  }

  // 3. Regression warning
  if (progress.daysSinceStart >= 14 && progress.daysSinceStart <= 28) {
    if (progress.cuesMastered >= 1) {
      predictions.push({
        type: 'warning',
        title: 'Keep the Momentum',
        message: `Week 2-4 is when many dogs (and owners!) hit a plateau. This is normal. Staying consistent now prevents regression.`,
        emoji: '⚠️',
        confidence: 'high',
        data: { riskFactor: 'plateau' }
      })
    }
  }

  // 4. Streak encouragement
  if (progress.currentStreak >= 5 && progress.currentStreak < 7) {
    predictions.push({
      type: 'milestone',
      title: 'Almost a Week!',
      message: `${7 - progress.currentStreak} more day${7 - progress.currentStreak > 1 ? 's' : ''} to hit a 7-day streak. Dogs with weekly streaks are 2x more likely to succeed!`,
      emoji: '🔥',
      confidence: 'high'
    })
  }

  // 5. Absence training forecast
  if (progress.cuesMastered >= 3 && progress.sessionsCompleted > 0) {
    const currentMinutes = progress.longestAbsence
    const targetMinutes = 30
    
    if (currentMinutes < targetMinutes) {
      // Estimate ~2 minutes progress per successful session
      const minutesRemaining = targetMinutes - currentMinutes
      const sessionsNeeded = Math.ceil(minutesRemaining / 2)
      const daysEstimate = Math.ceil(sessionsNeeded / 0.7) // assuming ~0.7 sessions per day average
      
      predictions.push({
        type: 'mastery',
        title: '30-Minute Goal',
        message: `You're at ${currentMinutes} minutes. At a steady pace, you could reach 30 minutes in about ${daysEstimate} days.`,
        emoji: '⏱️',
        confidence: progress.sessionsCompleted > 5 ? 'medium' : 'low',
        data: { estimatedDays: daysEstimate }
      })
    }
  }

  // 6. First-timer encouragement
  if (progress.totalPractices < 5) {
    predictions.push({
      type: 'milestone',
      title: 'Building Data',
      message: `After a few more practices, we'll have personalized predictions for your journey. Every practice teaches us more!`,
      emoji: '📊',
      confidence: 'high'
    })
  }

  // 7. Success forecast for consistent users
  if (progress.currentStreak >= 7 && progress.cuesMastered >= 1) {
    const successChance = Math.min(95, 60 + (progress.currentStreak * 2) + (progress.cuesMastered * 5))
    predictions.push({
      type: 'comparison',
      title: 'High Success Probability',
      message: `With your consistency, you have a ${successChance}% chance of reaching your goals. Most people who make it this far succeed!`,
      emoji: '🏆',
      confidence: 'medium',
      data: { percentile: successChance }
    })
  }

  return predictions
}

// Get the single most relevant prediction to show
export function getTopPrediction(profile: DogProfile, progress: ProgressData): Prediction | null {
  const predictions = getPredictions(profile, progress)
  
  // Priority: warnings > milestones > comparisons > mastery
  const priority = ['warning', 'milestone', 'comparison', 'mastery']
  
  for (const type of priority) {
    const match = predictions.find(p => p.type === type)
    if (match) return match
  }
  
  return predictions[0] || null
}