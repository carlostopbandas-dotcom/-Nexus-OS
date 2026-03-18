import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:   'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        ghost:     'text-current hover:bg-white/10',
        danger:    'bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg',
        icon:      'p-2 text-current hover:bg-white/10',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-2xl',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), 'hover:scale-105', className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'
