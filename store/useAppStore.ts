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
  ytdStoreMetrics: StoreMetric[]

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
  fetchYtdStoreMetrics: () => Promise<void>
  fetchAll: () => Promise<void>

  // Mutations — set full arrays
  setLeads: (leads: Lead[]) => void
  setTasks: (tasks: Task[]) => void
  setEvents: (events: CalendarEvent[]) => void
  setCallLogs: (logs: CallLog[]) => void
  setOkrs: (okrs: OKR[]) => void
  setContentPosts: (posts: Post[]) => void
  setStoreMetrics: (metrics: StoreMetric[]) => void
  setYtdStoreMetrics: (metrics: StoreMetric[]) => void

  // Mutations — granular (no re-fetch needed)
  addLead: (lead: Lead) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  removeLead: (id: string) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  addEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void
  addCallLog: (log: CallLog) => void
  removeCallLog: (id: string) => void
  addStoreMetric: (metric: StoreMetric) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  leads: [],
  tasks: [],
  events: [],
  callLogs: [],
  okrs: [],
  contentPosts: [],
  storeMetrics: [],
  ytdStoreMetrics: [],
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

  fetchYtdStoreMetrics: async () => {
    const now = new Date()
    const firstDayOfYear = `${now.getFullYear()}-01-01`
    const { data } = await storeMetricsService.getByDateRange(firstDayOfYear)
    if (data) set({ ytdStoreMetrics: data })
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
        get().fetchYtdStoreMetrics(),
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
  setYtdStoreMetrics: (ytdStoreMetrics) => set({ ytdStoreMetrics }),

  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (id, updates) => set((state) => ({ leads: state.leads.map((l) => l.id === id ? { ...l, ...updates } : l) })),
  removeLead: (id) => set((state) => ({ leads: state.leads.filter((l) => l.id !== id) })),

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) => set((state) => ({ tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
  removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

  addCallLog: (log) => set((state) => ({ callLogs: [log, ...state.callLogs] })),
  removeCallLog: (id) => set((state) => ({ callLogs: state.callLogs.filter((c) => c.id !== id) })),

  addStoreMetric: (metric) => set((state) => ({ storeMetrics: [metric, ...state.storeMetrics] })),
}))
