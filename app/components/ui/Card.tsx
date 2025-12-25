import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  pressable?: boolean
  onClick?: () => void
}

export function Card({ 
  children, 
  variant = 'elevated', 
  padding = 'md',
  className = '',
  pressable = false,
  onClick
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all'
  
  const variantStyles = {
    elevated: 'bg-white shadow-md border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-amber-50 border border-amber-100',
  }

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const pressableStyles = pressable 
    ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
    : ''

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${pressableStyles} ${className}`

  if (pressable) {
    return (
      <button
        type="button"
        className={combinedClassName}
        onClick={onClick}
        style={{ textAlign: 'left', width: '100%' }}
      >
        {children}
      </button>
    )
  }

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  )
}