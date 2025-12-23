'use client'

type WeeklySummaryProps = {
  dogName: string
  sessions: number
  greatCount: number
  streak: number
  trend: 'improving' | 'stable' | 'declining' | 'new'
}

export default function WeeklySummary({ dogName, sessions, greatCount, streak, trend }: WeeklySummaryProps) {
  const getMessage = () => {
    if (sessions === 0) return `No sessions this week. ${dogName} is waiting for you!`
    if (trend === 'improving') return `${dogName} is making real progress! Keep it up.`
    if (trend === 'declining') return `Tough week, but that's okay. Consistency matters most.`
    return `You're building good habits with ${dogName}. Stay consistent!`
  }

  const getEmoji = () => {
    if (sessions === 0) return '😴'
    if (trend === 'improving') return '🚀'
    if (greatCount >= 3) return '⭐'
    if (streak >= 5) return '🔥'
    return '💪'
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-amber-950">{dogName}'s Week</h3>
        <span className="text-2xl">{getEmoji()}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{sessions}</p>
          <p className="text-xs text-amber-700/70">sessions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{greatCount}</p>
          <p className="text-xs text-amber-700/70">great</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{streak}</p>
          <p className="text-xs text-amber-700/70">streak</p>
        </div>
      </div>

      <p className="text-sm text-amber-800">{getMessage()}</p>
    </div>
  )
}