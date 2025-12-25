'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  pressable?: boolean;
  children: React.ReactNode;
}

export function Card({
  variant = 'elevated',
  padding = 'md',
  pressable = false,
  children,
  className = '',
  onClick,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-200 ease-out';

  const variantStyles = {
    elevated: 'bg-white shadow-md border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-amber-50 border border-amber-100',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const pressableStyles = pressable
    ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
    : '';

  if (pressable) {
    return (
      <button
        type="button"
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${pressableStyles} ${className} text-left w-full`}
        onClick={onClick}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 flex items-center gap-3 ${className}`}>{children}</div>;
}

export default Card;