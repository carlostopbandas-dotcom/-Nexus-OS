import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  roles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { userRole } = useAuth()
  if (!userRole || !roles.includes(userRole)) return <>{fallback}</>
  return <>{children}</>
}
