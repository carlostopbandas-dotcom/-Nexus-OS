import React from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'

const sizeClasses = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

function getInitials(email: string | undefined, name: string | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
  }
  if (email) {
    const local = email.split('@')[0]
    const parts = local.split(/[._-]/)
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
  }
  return '?'
}

export interface AvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ size = 'md', className }: AvatarProps) {
  const { user } = useAuth()
  const initials = getInitials(
    user?.email,
    user?.user_metadata?.full_name ?? user?.user_metadata?.name
  )

  return (
    <div
      className={cn(
        'rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-xl ring-2 ring-blue-500/20',
        sizeClasses[size],
        className
      )}
      aria-label={`Avatar: ${initials}`}
    >
      {initials}
    </div>
  )
}
