import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Lead, Task, CalendarEvent, CallLog, OKR, Post } from '@/types'

export interface StoreMetric {
  id?: string
  store_name: string
  sales: number | string
  spend: number | string
  roas: number | string
  date: string
}

interface AppState {
  // Data
  leads: Lead[]
  tasks: Task[]
  events: CalendarEvent[]
  callLogs: CallLog[]
  okrs: OKR[]
  contentPosts: Post[]
  storeMetrics: StoreMetric[]

  // Loading
  loading: boolean
  error: string | null

  // Actions — fetch individual
  fetchLeads: () => Promise<void>
  fetchTasks: () => Promise<void>
  fetchEvents: () => Promise<void>
  fetchCallLogs: () => Promise<void>
  fetchOkrs: () => Promise<void>
  fetchContentPosts: () => Promise<void>
  fetchStoreMetrics: () => Promise<void>
  fetchAll: () => Promise<void>

  // Mutations
  setLeads: (leads: Lead[]) => void
  setTasks: (tasks: Task[]) => void
  setEvents: (events: CalendarEvent[]) => void
  setCallLogs: (logs: CallLog[]) => void
  setOkrs: (okrs: OKR[]) => void
  setContentPosts: (posts: Post[]) => void
  setStoreMetrics: (metrics: StoreMetric[]) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  leads: [],
  tasks: [],
  events: [],
  callLogs: [],
  okrs: [],
  contentPosts: [],
  storeMetrics: [],
  loading: false,
  error: null,

  fetchLeads: async () => {
    const { data, error } = await supabase
      .from('leads').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      set({ leads: data.map((l: any) => ({
        id: l.id, name: l.name, email: l.email, source: l.source,
        status: l.status, value: l.value, product: l.product, createdAt: l.created_at
      }))})
    }
  },

  fetchTasks: async () => {
    const { data, error } = await supabase
      .from('tasks').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      set({ tasks: data.map((t: any) => ({
        id: t.id, title: t.title, type: t.type, completed: t.completed, category: t.category
      }))})
    }
  },

  fetchEvents: async () => {
    const { data, error } = await supabase
      .from('events').select('*').order('start_time', { ascending: true })
    if (!error && data) {
      set({ events: data.map((e: any) => ({
        id: e.id, title: e.title, start: e.start_time, end: e.end_time,
        type: e.type, attendees: e.attendees, dayOffset: e.day_offset
      }))})
    }
  },

  fetchCallLogs: async () => {
    const { data, error } = await supabase
      .from('call_logs').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      set({ callLogs: data.map((c: any) => ({
        id: c.id, leadName: c.lead_name, date: c.date, duration: c.duration,
        type: c.type, status: c.status, sentiment: c.sentiment,
        transcriptSnippet: c.transcript_snippet, summary: c.summary
      }))})
    }
  },

  fetchOkrs: async () => {
    const { data, error } = await supabase
      .from('okrs').select('*').order('created_at', { ascending: true })
    if (!error && data) {
      set({ okrs: data.map((o: any) => ({
        id: o.id, unit: o.unit, objective: o.objective,
        progress: o.progress, keyResults: o.key_results
      }))})
    }
  },

  fetchContentPosts: async () => {
    const { data, error } = await supabase
      .from('content_posts').select('*').order('created_at', { ascending: false })
    if (!error && data) set({ contentPosts: data })
  },

  fetchStoreMetrics: async () => {
    const now = new Date()
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const { data, error } = await supabase
      .from('store_metrics').select('*').gte('date', firstDayOfMonth).order('date', { ascending: false })
    if (!error && data) set({ storeMetrics: data })
  },

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      await Promise.all([
        get().fetchLeads(),
        get().fetchTasks(),
        get().fetchEvents(),
        get().fetchCallLogs(),
        get().fetchOkrs(),
        get().fetchContentPosts(),
        get().fetchStoreMetrics(),
      ])
    } catch (err) {
      set({ error: 'Erro ao sincronizar dados' })
      console.error('fetchAll error:', err)
    } finally {
      set({ loading: false })
    }
  },

  setLeads: (leads) => set({ leads }),
  setTasks: (tasks) => set({ tasks }),
  setEvents: (events) => set({ events }),
  setCallLogs: (callLogs) => set({ callLogs }),
  setOkrs: (okrs) => set({ okrs }),
  setContentPosts: (contentPosts) => set({ contentPosts }),
  setStoreMetrics: (storeMetrics) => set({ storeMetrics }),
}))
