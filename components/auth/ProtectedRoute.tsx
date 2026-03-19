import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { LoginPage } from './LoginPage'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-xs font-bold uppercase tracking-widest">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
