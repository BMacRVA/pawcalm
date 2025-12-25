'use client'

import { Check, AlertCircle, Circle } from 'lucide-react'

interface CueCardProps {
  name: string
  calmCount: number
  totalCount: number
  onPractice?: () => void
}

export function CueCard({ name, calmCount, totalCount, onPractice }: CueCardProps) {
  const calmRate = totalCount > 0 ? calmCount / totalCount : 0
  const isMastered = calmCount >= 5 && calmRate >= 0.7
  const isStruggling = calmRate < 0.3 && totalCount >= 3
  
  const status = isMastered ? 'mastered' : isStruggling ? 'struggling' : 'working'
  
  const statusConfig = {
    mastered: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <Check className="w-4 h-4 text-green-600" />,
      badge: 'bg-green-100 text-green-700',
      badgeText: 'Mastered',
    },
    working: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Circle className="w-4 h-4 text-amber-500" />,
      badge: 'bg-amber-100 text-amber-700',
      badgeText: 'Working on it',
    },
    struggling: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      badge: 'bg-red-100 text-red-700',
      badgeText: 'Needs work',
    },
  }
  
  const config = statusConfig[status]

  return (
    <button
      onClick={onPractice}
      className={`w-full p-4 rounded-xl border-2 ${config.border} ${config.bg} text-left transition hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.badge.split(' ')[0]}`}>
            {config.icon}
          </div>
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">
              {calmCount}/{totalCount} calm • {totalCount > 0 ? Math.round(calmRate * 100) : 0}%
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.badge}`}>
          {config.badgeText}
        </span>
      </div>
    </button>
  )
}

interface CueListProps {
  children: React.ReactNode
}

export function CueList({ children }: CueListProps) {
  return (
    <div className="space-y-3">
      {children}
    </div>
  )
}