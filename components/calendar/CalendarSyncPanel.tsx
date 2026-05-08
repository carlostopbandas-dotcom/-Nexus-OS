import React, { useEffect, useState } from 'react'
import { Calendar, RefreshCw, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { calendarSyncService, type CalendarSyncLog } from '@/services/calendarSyncService'

const STATUS_CONFIG = {
  success: {
    icon: <CheckCircle2 size={14} className="text-emerald-500" />,
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Sincronizado',
  },
  error: {
    icon: <XCircle size={14} className="text-red-500" />,
    badge: 'bg-red-100 text-red-700',
    label: 'Erro',
  },
  partial: {
    icon: <AlertTriangle size={14} className="text-amber-500" />,
    badge: 'bg-amber-100 text-amber-700',
    label: 'Parcial',
  },
}

const CalendarSyncPanel: React.FC = () => {
  const [lastSync, setLastSync] = useState<CalendarSyncLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [notConfigured, setNotConfigured] = useState(false)

  const load = async () => {
    const { data } = await calendarSyncService.getSyncStatus()
    setLastSync(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSync = async () => {
    setSyncing(true)
    const { data, error } = await calendarSyncService.triggerSync()

    if (error) {
      if (error.includes('não configurado') || error.includes('503')) {
        setNotConfigured(true)
      }
      toast.error(`Sync falhou: ${error}`)
    } else if (data) {
      toast.success(`${data.imported} eventos importados, ${data.exported} exportados`)
      await load()
    }
    setSyncing(false)
  }

  if (loading) {
    return <div className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
  }

  if (notConfigured) {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 leading-relaxed space-y-1">
          <p className="font-black">Google Calendar não configurado</p>
          <p>Configure os seguintes secrets no Supabase Edge Functions:</p>
          <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
            <li>GOOGLE_CLIENT_ID</li>
            <li>GOOGLE_CLIENT_SECRET</li>
            <li>GOOGLE_REFRESH_TOKEN_CEO</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <Calendar size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Google Calendar
            </p>
            {lastSync ? (
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {STATUS_CONFIG[lastSync.status].icon}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[lastSync.status].badge}`}>
                  {STATUS_CONFIG[lastSync.status].label}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock size={9} />
                  {new Date(lastSync.syncedAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                {lastSync.status === 'success' && (
                  <span className="text-[10px] text-slate-400">
                    ↓{lastSync.imported} ↑{lastSync.exported}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 mt-0.5">Nunca sincronizado</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition-all self-start sm:self-auto flex-shrink-0"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
        </button>
      </div>

      {lastSync?.status === 'error' && lastSync.errorMsg && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 rounded-xl">
          <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-600">{lastSync.errorMsg}</p>
        </div>
      )}
    </div>
  )
}

export default CalendarSyncPanel
