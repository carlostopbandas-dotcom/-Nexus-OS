import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  'aria-label': string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, 'aria-label': ariaLabel, ...props }, ref) => (
    <input
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        'w-full h-10 px-3 text-sm rounded-xl border border-slate-200',
        'bg-white text-slate-900 placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
