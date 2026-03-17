import { create } from 'zustand'
import type { Lead, Task, CalendarEvent, CallLog, OKR, Post } from '@/types'
import { leadsService } from '@/services/leadsService'
import { tasksService } from '@/services/tasksService'
import { eventsService } from '@/services/eventsService'
import { callLogsService } from '@/services/callLogsService'
import { okrsService } from '@/services/okrsService'
import { contentPostsService } from '@/services/contentPostsService'
import { storeMetricsService } from '@/services/storeMetricsService'

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
    const { data } = await leadsService.getAll()
    if (data) set({ leads: data })
  },

  fetchTasks: async () => {
    const { data } = await tasksService.getAll()
    if (data) set({ tasks: data })
  },

  fetchEvents: async () => {
    const { data } = await eventsService.getAll()
    if (data) set({ events: data })
  },

  fetchCallLogs: async () => {
    const { data } = await callLogsService.getAll()
    if (data) set({ callLogs: data })
  },

  fetchOkrs: async () => {
    const { data } = await okrsService.getAll()
    if (data) set({ okrs: data })
  },

  fetchContentPosts: async () => {
    const { data } = await contentPostsService.getAll()
    if (data) set({ contentPosts: data })
  },

  fetchStoreMetrics: async () => {
    const now = new Date()
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const { data } = await storeMetricsService.getByDateRange(firstDayOfMonth)
    if (data) set({ storeMetrics: data })
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
