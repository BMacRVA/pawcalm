'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';

export interface CueCardProps {
  id: string;
  icon: string;
  name: string;
  practiceCount: number;
  isMastered: boolean;
  isLocked?: boolean;
  priority?: 'high' | 'medium' | 'low';
  onPress: () => void;
}

export function CueCard({ 
  id, 
  icon, 
  name, 
  practiceCount, 
  isMastered, 
  isLocked = false, 
  priority, 
  onPress 
}: CueCardProps) {
  const progressPercentage = (practiceCount / 5) * 100;
  
  const priorityStyles = {
    high: 'border-l-4 border-l-red-400',
    medium: 'border-l-4 border-l-amber-400',
    low: 'border-l-4 border-l-blue-400',
  };

  return (
    <button
      onClick={onPress}
      disabled={isLocked}
      className={`
        w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left 
        transition-all duration-150 
        hover:shadow-md hover:scale-[1.01] 
        active:scale-[0.99] 
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:scale-100
        ${priority ? priorityStyles[priority] : ''} 
        ${isMastered ? 'bg-green-50 border-green-100' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isMastered ? 'bg-green-100' : 'bg-amber-100'}`}>
          {isLocked ? <Lock className="w-5 h-5 text-gray-400" /> : icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
            {isMastered && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
          </div>

          {/* Progress bar - show only if not mastered and not locked */}
          {!isMastered && !isLocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{practiceCount}/5 calm responses</span>
                <span className="text-xs font-medium text-amber-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }} 
                />
              </div>
            </div>
          )}

          {isMastered && <p className="text-sm text-green-600 mt-1">Mastered! 🎉</p>}
          {isLocked && <p className="text-sm text-gray-400 mt-1">Complete other cues first</p>}
        </div>
      </div>
    </button>
  );
}

export function CueList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-3 ${className}`}>{children}</div>;
}

export default CueCard;