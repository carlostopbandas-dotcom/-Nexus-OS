import { Loader2, Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { LoginPage } from './LoginPage'
import { supabase } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

function PendingActivationPage() {
  return (
    <div className="flex h-screen bg-slate-900 items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm mx-4">
        <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20">
          <Clock size={28} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-black text-xl mb-2">Aguardando ativação</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Sua conta ainda não foi ativada. Entre em contato com o CEO para receber as permissões de acesso.
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, userRole, profileLoading } = useAuth()

  if (loading || profileLoading) {
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

  if (userRole === null) {
    return <PendingActivationPage />
  }

  return <>{children}</>
}
