'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaText: string;
  onAction: () => void;
  variant?: 'default' | 'celebration' | 'gentle';
  badge?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  ctaText,
  onAction,
  variant = 'default',
  badge,
}: ActionCardProps) {
  const variantStyles = {
    default: {
      container: 'bg-gradient-to-br from-amber-500 to-amber-600',
      icon: 'bg-amber-400/30 text-white',
      title: 'text-white',
      description: 'text-amber-100',
      button: 'bg-white text-amber-600 hover:bg-amber-50',
      badge: 'bg-amber-400/30 text-white',
    },
    celebration: {
      container: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: 'bg-green-400/30 text-white',
      title: 'text-white',
      description: 'text-green-100',
      button: 'bg-white text-green-600 hover:bg-green-50',
      badge: 'bg-green-400/30 text-white',
    },
    gentle: {
      container: 'bg-gradient-to-br from-blue-400 to-blue-500',
      icon: 'bg-blue-300/30 text-white',
      title: 'text-white',
      description: 'text-blue-100',
      button: 'bg-white text-blue-600 hover:bg-blue-50',
      badge: 'bg-blue-400/30 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg ${styles.container}`}>
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
      
      <div className="relative z-10">
        {badge && (
          <span className={`inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
            {badge}
          </span>
        )}
        <div className={`w-12 h-12 mb-4 rounded-xl flex items-center justify-center ${styles.icon}`}>
          {icon}
        </div>
        <h2 className={`text-xl font-bold mb-2 ${styles.title}`}>{title}</h2>
        <p className={`text-sm mb-5 leading-relaxed ${styles.description}`}>{description}</p>
        <button
          onClick={onAction}
          className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.98] shadow-md ${styles.button}`}
        >
          {ctaText}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ActionCard;