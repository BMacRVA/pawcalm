'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'error';
}

export function StatCard({ icon, label, value, trend, trendValue, color = 'default' }: StatCardProps) {
  const colorStyles = {
    default: { icon: 'bg-amber-100 text-amber-600', value: 'text-gray-900' },
    success: { icon: 'bg-green-100 text-green-600', value: 'text-green-600' },
    warning: { icon: 'bg-yellow-100 text-yellow-600', value: 'text-yellow-600' },
    error: { icon: 'bg-red-100 text-red-600', value: 'text-red-600' },
  };

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  };

  const trendColors = { up: 'text-green-600', down: 'text-red-600', neutral: 'text-gray-500' };
  const styles = colorStyles[color];

  return (
    <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
      <div className={`w-8 h-8 mb-2 rounded-lg flex items-center justify-center ${styles.icon}`}>
        {icon}
      </div>
      <div className={`text-xl font-bold ${styles.value} truncate`}>{value}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xs text-gray-500 truncate">{label}</span>
        {trend && trendValue && (
          <span className={`flex items-center gap-0.5 text-xs ${trendColors[trend]}`}>
            {trendIcons[trend]}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCardRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3">{children}</div>;
}

export default StatCard;