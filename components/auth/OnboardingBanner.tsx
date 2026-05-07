import React, { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { onboardingService } from '@/services/onboardingService'
import { useAuth } from '@/components/auth/AuthProvider'

const ROLE_MESSAGES: Record<string, { title: string; body: string }> = {
  ceo: {
    title: 'Bem-vindo ao Nexus OS, CEO!',
    body: 'Aqui você centraliza estratégia, financeiro, CRM, agenda e operações de todas as unidades da 3D Digital e do Grupo VcChic.',
  },
  gestor_vcchic: {
    title: 'Bem-vindo ao Nexus OS!',
    body: 'Você tem acesso às métricas de e-commerce, OKRs e dados financeiros do Grupo VcChic.',
  },
  vendedor_sdr: {
    title: 'Bem-vindo ao Nexus OS!',
    body: 'Use o CRM e o Smart Calls para gerenciar seus leads e acompanhar o pipeline de vendas.',
  },
  assistente: {
    title: 'Bem-vindo ao Nexus OS!',
    body: 'Você tem acesso à agenda, tarefas e CRM para suporte às operações do time.',
  },
}

const DEFAULT_MESSAGE = {
  title: 'Bem-vindo ao Nexus OS!',
  body: 'Navegue pelo menu lateral para acessar as funcionalidades disponíveis para o seu perfil.',
}

const OnboardingBanner: React.FC = () => {
  const { userRole } = useAuth()
  const [visible, setVisible] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    onboardingService.isOnboarded().then(({ data }) => {
      if (data === false) setVisible(true)
    })
  }, [])

  const handleDismiss = async () => {
    setDismissing(true)
    await onboardingService.markOnboarded()
    setVisible(false)
    setDismissing(false)
  }

  if (!visible) return null

  const msg = ROLE_MESSAGES[userRole ?? ''] ?? DEFAULT_MESSAGE

  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
      <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-blue-900">{msg.title}</p>
        <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{msg.body}</p>
      </div>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        className="shrink-0 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
      >
        <X size={12} />
        Entendido
      </button>
    </div>
  )
}

export default OnboardingBanner
