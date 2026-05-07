import { supabase } from '@/lib/supabase'
import type { CalendarEvent } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

const mapEvent = (e: Record<string, unknown>): CalendarEvent => {
  const startRaw = (e.start_time as string) ?? ''
  let start: string
  let dayOffset: number

  if (startRaw.includes('T')) {
    // ISO datetime do Google Calendar (ex: '2026-05-07T10:00:00-03:00')
    const dt = new Date(startRaw)
    start = dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'America/Sao_Paulo',
    })
    const todayBR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const eventDayBR = dt.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    dayOffset = Math.round((new Date(eventDayBR).getTime() - new Date(todayBR).getTime()) / 86400000)
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(startRaw)) {
    // Evento dia-todo do Google Calendar (ex: '2026-05-10')
    start = 'allday'
    const todayBR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    dayOffset = Math.round((new Date(startRaw).getTime() - new Date(todayBR).getTime()) / 86400000)
  } else {
    // Formato legado HH:mm (eventos criados manualmente no Nexus)
    start = startRaw
    dayOffset = (e.day_offset as number) ?? 0
  }

  return {
    id: e.id as string,
    title: e.title as string,
    start,
    end: e.end_time as string,
    type: e.type as CalendarEvent['type'],
    attendees: e.attendees as string[] | undefined,
    dayOffset,
  }
}

export const eventsService = {
  async getAll(): Promise<ServiceResult<CalendarEvent[]>> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapEvent), error: null }
  },

  async getById(id: string): Promise<ServiceResult<CalendarEvent>> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapEvent(data), error: null }
  },

  async create(event: Omit<CalendarEvent, 'id'>): Promise<ServiceResult<CalendarEvent>> {
    const { data, error } = await supabase
      .from('events')
      .insert({ title: event.title, start_time: event.start, end_time: event.end, type: event.type, attendees: event.attendees, day_offset: event.dayOffset })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapEvent(data), error: null }
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<ServiceResult<CalendarEvent>> {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.start !== undefined) dbUpdates.start_time = updates.start
    if (updates.end !== undefined) dbUpdates.end_time = updates.end
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.attendees !== undefined) dbUpdates.attendees = updates.attendees
    if (updates.dayOffset !== undefined) dbUpdates.day_offset = updates.dayOffset
    const { data, error } = await supabase
      .from('events')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapEvent(data), error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase.from('events').delete().eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}
