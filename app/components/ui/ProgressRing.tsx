'use client';

import React, { useEffect, useState } from 'react';

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = 'primary',
  showLabel = true,
  label,
  animate = true,
  children,
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(animate ? 0 : progress);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimatedProgress(progress), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  const colorClasses = {
    primary: { stroke: 'stroke-amber-600', text: 'text-amber-600', bg: 'stroke-amber-100' },
    success: { stroke: 'stroke-green-600', text: 'text-green-600', bg: 'stroke-green-100' },
    warning: { stroke: 'stroke-yellow-500', text: 'text-yellow-600', bg: 'stroke-yellow-100' },
    error: { stroke: 'stroke-red-600', text: 'text-red-600', bg: 'stroke-red-100' },
  };

  const colors = colorClasses[color];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.bg}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${colors.stroke} transition-all duration-1000 ease-out`}
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? children : showLabel ? (
          <>
            <span className={`text-2xl font-bold ${colors.text}`}>{Math.round(animatedProgress)}%</span>
            {label && <span className="text-xs text-gray-500 mt-0.5">{label}</span>}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default ProgressRing;