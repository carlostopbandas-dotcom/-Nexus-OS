import React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface FormFieldProps {
  label: string
  id: string
  error?: string
  className?: string
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-label'>
}

export function FormField({ label, id, error, className, inputProps }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-xs font-bold text-slate-700 uppercase tracking-wide"
      >
        {label}
      </label>
      <Input
        id={id}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
        className={cn(error && 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500', inputProps?.className)}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-rose-500 font-semibold">
          {error}
        </span>
      )}
    </div>
  )
}
