import { supabase } from '@/lib/supabase'
import type { CallLog } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

const mapCallLog = (c: Record<string, unknown>): CallLog => ({
  id: c.id as string,
  leadName: c.lead_name as string,
  date: c.date as string,
  duration: c.duration as string,
  type: c.type as CallLog['type'],
  status: c.status as CallLog['status'],
  sentiment: c.sentiment as CallLog['sentiment'],
  transcriptSnippet: c.transcript_snippet as string,
  summary: c.summary as string | undefined,
  recordingUrl: c.recording_url as string | undefined,
})

export const callLogsService = {
  async getAll(): Promise<ServiceResult<CallLog[]>> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapCallLog), error: null }
  },

  async getById(id: string): Promise<ServiceResult<CallLog>> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapCallLog(data), error: null }
  },

  async getByLeadId(leadId: string): Promise<ServiceResult<CallLog[]>> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapCallLog), error: null }
  },

  async create(callLog: Omit<CallLog, 'id'>): Promise<ServiceResult<CallLog>> {
    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        lead_name: callLog.leadName,
        date: callLog.date,
        duration: callLog.duration,
        type: callLog.type,
        status: callLog.status,
        sentiment: callLog.sentiment,
        transcript_snippet: callLog.transcriptSnippet,
        summary: callLog.summary,
        recording_url: callLog.recordingUrl,
      })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapCallLog(data), error: null }
  },

  async update(id: string, updates: Partial<CallLog>): Promise<ServiceResult<CallLog>> {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.leadName !== undefined) dbUpdates.lead_name = updates.leadName
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.sentiment !== undefined) dbUpdates.sentiment = updates.sentiment
    if (updates.transcriptSnippet !== undefined) dbUpdates.transcript_snippet = updates.transcriptSnippet
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary
    if (updates.recordingUrl !== undefined) dbUpdates.recording_url = updates.recordingUrl
    const { data, error } = await supabase
      .from('call_logs')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapCallLog(data), error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase.from('call_logs').delete().eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}
