import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface InsightData {
  [key: string]: any
}

async function saveInsight(key: string, value: InsightData) {
  await supabase
    .from('aggregate_insights')
    .upsert({
      insight_key: key,
      insight_value: value,
      calculated_at: new Date().toISOString()
    }, { onConflict: 'insight_key' })
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all practices
    const { data: allPractices } = await supabase
      .from('cue_practices')
      .select('created_at, cues, time_of_day, dog_id')
      .order('created_at', { ascending: false })
      .limit(5000)

    // Fetch all cues
    const { data: allCues } = await supabase
      .from('custom_cues')
      .select('id, name, calm_count, total_practices, mastered_at, created_at, dog_id')

    // Fetch all dogs
    const { data: allDogs } = await supabase
      .from('dogs')
      .select('id, created_at')

    if (!allPractices || !allCues || !allDogs) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // ===== INSIGHT 1: Best Practice Time =====
    const timeStats: Record<string, { total: number; calm: number }> = {
      morning: { total: 0, calm: 0 },
      afternoon: { total: 0, calm: 0 },
      evening: { total: 0, calm: 0 }
    }

    allPractices.forEach(p => {
      const time = p.time_of_day || 'morning'
      p.cues?.forEach((c: any) => {
        if (timeStats[time]) {
          timeStats[time].total++
          if (c.response === 'calm') timeStats[time].calm++
        }
      })
    })

    let bestTime = 'morning'
    let bestTimeRate = 0
    Object.entries(timeStats).forEach(([time, stats]) => {
      if (stats.total >= 10) {
        const rate = Math.round((stats.calm / stats.total) * 100)
        if (rate > bestTimeRate) {
          bestTimeRate = rate
          bestTime = time
        }
      }
    })

    await saveInsight('best_practice_time', {
      time: bestTime,
      calm_rate: bestTimeRate,
      all_times: {
        morning: timeStats.morning.total > 0 ? Math.round((timeStats.morning.calm / timeStats.morning.total) * 100) : 0,
        afternoon: timeStats.afternoon.total > 0 ? Math.round((timeStats.afternoon.calm / timeStats.afternoon.total) * 100) : 0,
        evening: timeStats.evening.total > 0 ? Math.round((timeStats.evening.calm / timeStats.evening.total) * 100) : 0
      },
      sample_size: Object.values(timeStats).reduce((sum, s) => sum + s.total, 0)
    })

    // ===== INSIGHT 2: Hardest/Easiest Cues =====
    const cueStats: Record<string, { name: string; total: number; calm: number; mastered: number; avgPracticesToMaster: number[] }> = {}

    allCues.forEach(cue => {
      const name = cue.name.toLowerCase().trim()
      if (!cueStats[name]) {
        cueStats[name] = { name: cue.name, total: 0, calm: 0, mastered: 0, avgPracticesToMaster: [] }
      }
      cueStats[name].total += cue.total_practices || 0
      cueStats[name].calm += cue.calm_count || 0
      if (cue.mastered_at) {
        cueStats[name].mastered++
        cueStats[name].avgPracticesToMaster.push(cue.total_practices || 0)
      }
    })

    // Sort by difficulty (lowest calm rate = hardest)
    const cueArray = Object.values(cueStats)
      .filter(c => c.total >= 10)
      .map(c => ({
        name: c.name,
        calm_rate: Math.round((c.calm / c.total) * 100),
        total_practices: c.total,
        times_mastered: c.mastered,
        avg_practices_to_master: c.avgPracticesToMaster.length > 0 
          ? Math.round(c.avgPracticesToMaster.reduce((a, b) => a + b, 0) / c.avgPracticesToMaster.length)
          : null
      }))
      .sort((a, b) => a.calm_rate - b.calm_rate)

    const hardestCues = cueArray.slice(0, 3)
    const easiestCues = cueArray.slice(-3).reverse()
    const mostMasteredCues = [...cueArray].sort((a, b) => b.times_mastered - a.times_mastered).slice(0, 3)

    await saveInsight('cue_difficulty', {
      hardest: hardestCues,
      easiest: easiestCues,
      most_mastered: mostMasteredCues
    })

    // ===== INSIGHT 3: Mastery Stats =====
    const masteredCues = allCues.filter(c => c.mastered_at)
    const dogsWithMastery = new Set(masteredCues.map(c => c.dog_id))
    
    // Calculate average days to first mastery
    const daysToFirstMastery: number[] = []
    const dogFirstMastery: Record<string, Date> = {}
    
    masteredCues.forEach(cue => {
      if (!dogFirstMastery[cue.dog_id] || new Date(cue.mastered_at) < dogFirstMastery[cue.dog_id]) {
        dogFirstMastery[cue.dog_id] = new Date(cue.mastered_at)
      }
    })

    const dogCreated: Record<string, Date> = {}
    allDogs.forEach(dog => {
      dogCreated[dog.id] = new Date(dog.created_at)
    })

    Object.entries(dogFirstMastery).forEach(([dogId, masteryDate]) => {
      if (dogCreated[dogId]) {
        const days = Math.floor((masteryDate.getTime() - dogCreated[dogId].getTime()) / (1000 * 60 * 60 * 24))
        if (days >= 0 && days < 365) {
          daysToFirstMastery.push(days)
        }
      }
    })

    const avgDaysToMastery = daysToFirstMastery.length > 0
      ? Math.round(daysToFirstMastery.reduce((a, b) => a + b, 0) / daysToFirstMastery.length)
      : null

    await saveInsight('mastery_stats', {
      total_cues_mastered: masteredCues.length,
      dogs_with_mastery: dogsWithMastery.size,
      total_dogs: allDogs.length,
      pct_dogs_with_mastery: allDogs.length > 0 ? Math.round((dogsWithMastery.size / allDogs.length) * 100) : 0,
      avg_days_to_first_mastery: avgDaysToMastery
    })

    // ===== INSIGHT 4: Practice Consistency =====
    const dogPracticeDays: Record<string, Set<string>> = {}
    
    allPractices.forEach(p => {
      if (!dogPracticeDays[p.dog_id]) {
        dogPracticeDays[p.dog_id] = new Set()
      }
      dogPracticeDays[p.dog_id].add(p.created_at.split('T')[0])
    })

    // Calculate average practices per active dog
    const activeDogs = Object.keys(dogPracticeDays).length
    const totalPracticeDays = Object.values(dogPracticeDays).reduce((sum, days) => sum + days.size, 0)
    const avgPracticeDaysPerDog = activeDogs > 0 ? Math.round(totalPracticeDays / activeDogs) : 0

    // Dogs practicing 3+ days per week in last 2 weeks have X% higher calm rate
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    const recentPractices = allPractices.filter(p => new Date(p.created_at) >= twoWeeksAgo)
    const consistentDogs = new Set<string>()
    const inconsistentDogs = new Set<string>()

    const recentDogDays: Record<string, Set<string>> = {}
    recentPractices.forEach(p => {
      if (!recentDogDays[p.dog_id]) recentDogDays[p.dog_id] = new Set()
      recentDogDays[p.dog_id].add(p.created_at.split('T')[0])
    })

    Object.entries(recentDogDays).forEach(([dogId, days]) => {
      if (days.size >= 6) consistentDogs.add(dogId) // 6+ days in 2 weeks = consistent
      else inconsistentDogs.add(dogId)
    })

    // Calculate calm rates for consistent vs inconsistent
    let consistentCalm = 0, consistentTotal = 0
    let inconsistentCalm = 0, inconsistentTotal = 0

    recentPractices.forEach(p => {
      p.cues?.forEach((c: any) => {
        if (consistentDogs.has(p.dog_id)) {
          consistentTotal++
          if (c.response === 'calm') consistentCalm++
        } else if (inconsistentDogs.has(p.dog_id)) {
          inconsistentTotal++
          if (c.response === 'calm') inconsistentCalm++
        }
      })
    })

    const consistentCalmRate = consistentTotal > 0 ? Math.round((consistentCalm / consistentTotal) * 100) : 0
    const inconsistentCalmRate = inconsistentTotal > 0 ? Math.round((inconsistentCalm / inconsistentTotal) * 100) : 0
    const consistencyBoost = consistentCalmRate - inconsistentCalmRate

    await saveInsight('consistency_stats', {
      avg_practice_days_per_dog: avgPracticeDaysPerDog,
      consistent_dogs: consistentDogs.size,
      inconsistent_dogs: inconsistentDogs.size,
      consistent_calm_rate: consistentCalmRate,
      inconsistent_calm_rate: inconsistentCalmRate,
      consistency_boost_pct: consistencyBoost > 0 ? consistencyBoost : 0
    })

    // ===== INSIGHT 5: Weekly Trends =====
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgoDate = new Date()
    twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14)

    const thisWeekPractices = allPractices.filter(p => new Date(p.created_at) >= oneWeekAgo)
    const lastWeekPractices = allPractices.filter(p => {
      const date = new Date(p.created_at)
      return date >= twoWeeksAgoDate && date < oneWeekAgo
    })

    let thisWeekCalm = 0, thisWeekTotal = 0
    let lastWeekCalm = 0, lastWeekTotal = 0

    thisWeekPractices.forEach(p => {
      p.cues?.forEach((c: any) => {
        thisWeekTotal++
        if (c.response === 'calm') thisWeekCalm++
      })
    })

    lastWeekPractices.forEach(p => {
      p.cues?.forEach((c: any) => {
        lastWeekTotal++
        if (c.response === 'calm') lastWeekCalm++
      })
    })

    const thisWeekCalmRate = thisWeekTotal > 0 ? Math.round((thisWeekCalm / thisWeekTotal) * 100) : 0
    const lastWeekCalmRate = lastWeekTotal > 0 ? Math.round((lastWeekCalm / lastWeekTotal) * 100) : 0

    await saveInsight('weekly_trends', {
      this_week: {
        total_practices: thisWeekTotal,
        calm_rate: thisWeekCalmRate,
        active_dogs: new Set(thisWeekPractices.map(p => p.dog_id)).size
      },
      last_week: {
        total_practices: lastWeekTotal,
        calm_rate: lastWeekCalmRate,
        active_dogs: new Set(lastWeekPractices.map(p => p.dog_id)).size
      },
      calm_rate_change: thisWeekCalmRate - lastWeekCalmRate
    })

    // ===== INSIGHT 6: Fun Facts / Milestones =====
    const totalPracticesEver = allPractices.reduce((sum, p) => sum + (p.cues?.length || 0), 0)
    const totalMasteredEver = masteredCues.length

    await saveInsight('platform_milestones', {
      total_practices: totalPracticesEver,
      total_cues_mastered: totalMasteredEver,
      total_dogs: allDogs.length,
      total_active_dogs: activeDogs
    })

    return NextResponse.json({
      success: true,
      insights_updated: [
        'best_practice_time',
        'cue_difficulty', 
        'mastery_stats',
        'consistency_stats',
        'weekly_trends',
        'platform_milestones'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Calculate insights error:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}