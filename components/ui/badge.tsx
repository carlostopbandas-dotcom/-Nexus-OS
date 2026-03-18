import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center font-bold uppercase tracking-wide rounded-full',
  {
    variants: {
      variant: {
        default:   'bg-slate-100 text-slate-700',
        primary:   'bg-blue-100 text-blue-700',
        success:   'bg-emerald-100 text-emerald-700',
        warning:   'bg-amber-100 text-amber-700',
        danger:    'bg-rose-100 text-rose-700',
        info:      'bg-sky-100 text-sky-700',
        // Business units
        nexus:     'bg-blue-100 text-blue-700',
        mivave:    'bg-violet-100 text-violet-700',
        vcchic:    'bg-pink-100 text-pink-700',
        moriel:    'bg-teal-100 text-teal-700',
        sezo:      'bg-orange-100 text-orange-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-[9px]',
        md: 'px-3 py-1 text-[11px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'sm' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}
