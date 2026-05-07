import { supabase } from '@/lib/supabase'

export interface CalendarSyncLog {
  id: string
  status: 'success' | 'error' | 'partial'
  imported: number
  exported: number
  errorMsg: string | null
  syncedAt: string
}

type ServiceResult<T> = { data: T | null; error: string | null }

export const calendarSyncService = {
  async getSyncStatus(): Promise<ServiceResult<CalendarSyncLog>> {
    const { data, error } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') return { data: null, error: error.message }
    if (!data) return { data: null, error: null }

    return {
      data: {
        id: data.id,
        status: data.status as CalendarSyncLog['status'],
        imported: data.imported ?? 0,
        exported: data.exported ?? 0,
        errorMsg: data.error_msg ?? null,
        syncedAt: data.synced_at,
      },
      error: null,
    }
  },

  async triggerSync(): Promise<ServiceResult<{ imported: number; exported: number }>> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { data: null, error: 'Sessão inválida' }

    try {
      const response = await fetch('/api/calendar/google-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = await response.json()
      if (!response.ok) return { data: null, error: body.error ?? 'Sync falhou' }
      return { data: { imported: body.imported ?? 0, exported: body.exported ?? 0 }, error: null }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },

  async isConfigured(): Promise<boolean> {
    const { data } = await supabase
      .from('calendar_sync_log')
      .select('id')
      .eq('status', 'success')
      .limit(1)
      .single()
    return !!data
  },
}
