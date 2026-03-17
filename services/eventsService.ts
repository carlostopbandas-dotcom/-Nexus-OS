import { supabase } from '@/lib/supabase'
import type { CalendarEvent } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

const mapEvent = (e: Record<string, unknown>): CalendarEvent => ({
  id: e.id as string,
  title: e.title as string,
  start: e.start_time as string,
  end: e.end_time as string,
  type: e.type as CalendarEvent['type'],
  attendees: e.attendees as string[] | undefined,
  dayOffset: e.day_offset as number,
})

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
