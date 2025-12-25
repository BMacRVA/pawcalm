'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';

export interface SessionCardProps {
  id: string;
  date: Date | string;
  duration: number;
  targetDuration?: number;
  missionTitle?: string;
  missionSteps?: string[];
  stepsCompleted?: number;
  stepsTotal?: number;
  dogResponse: 'great' | 'okay' | 'struggled';
  ownerFeeling?: 'confident' | 'neutral' | 'anxious';
  notes?: string;
  type?: 'absence' | 'cue';
}

export function SessionCard({
  id,
  date,
  duration,
  targetDuration,
  missionTitle,
  missionSteps,
  stepsCompleted,
  stepsTotal,
  dogResponse,
  ownerFeeling,
  notes,
  type = 'absence'
}: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const responseConfig = {
    great: { 
      emoji: '😊', 
      label: 'Great', 
      color: 'bg-green-100 text-green-700 border-green-200', 
      borderColor: 'border-l-green-500' 
    },
    okay: { 
      emoji: '😐', 
      label: 'Okay', 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
      borderColor: 'border-l-yellow-500' 
    },
    struggled: { 
      emoji: '😟', 
      label: 'Struggled', 
      color: 'bg-red-100 text-red-700 border-red-200', 
      borderColor: 'border-l-red-500' 
    },
  };

  const response = responseConfig[dogResponse];

  const formatDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 shadow-sm overflow-hidden ${response.borderColor}`}>
      {/* Main content - always visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(date)}</span>
              <span>•</span>
              <span>{formatTime(date)}</span>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">
              {missionTitle || `${type === 'cue' ? 'Cue Practice' : 'Absence Session'}`}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {duration} min
                {targetDuration && targetDuration !== duration && (
                  <span className="text-gray-400"> / {targetDuration} min target</span>
                )}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${response.color}`}>
              <span>{response.emoji}</span>
              <span>{response.label}</span>
            </span>
            <span className="text-gray-400">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {/* Steps progress */}
          {stepsCompleted !== undefined && stepsTotal !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Steps completed</span>
                <span className="font-medium text-gray-900">{stepsCompleted}/{stepsTotal}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${(stepsCompleted / stepsTotal) * 100}%` }} 
                />
              </div>
            </div>
          )}

          {/* Mission steps */}
          {missionSteps && missionSteps.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Session steps</h4>
              <ul className="space-y-1.5">
                {missionSteps.map((step, index) => (
                  <li 
                    key={index} 
                    className={`text-sm pl-4 relative ${stepsCompleted && index < stepsCompleted ? 'text-gray-600' : 'text-gray-400'}`}
                  >
                    <span className={`absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full ${stepsCompleted && index < stepsCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Owner feeling */}
          {ownerFeeling && (
            <div className="text-sm mb-3">
              <span className="text-gray-600">How you felt: </span>
              <span className="font-medium text-gray-900 capitalize">{ownerFeeling}</span>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h4>
              <p className="text-sm text-gray-700">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-3 ${className}`}>{children}</div>;
}

export default SessionCard;