import { supabase } from '@/lib/supabase'
import type { OKR } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

const mapOkr = (o: Record<string, unknown>): OKR => ({
  id: o.id as string,
  unit: o.unit as OKR['unit'],
  objective: o.objective as string,
  progress: o.progress as number,
  keyResults: o.key_results as OKR['keyResults'],
})

export const okrsService = {
  async getAll(): Promise<ServiceResult<OKR[]>> {
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapOkr), error: null }
  },

  async getById(id: string): Promise<ServiceResult<OKR>> {
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapOkr(data), error: null }
  },

  async create(okr: Omit<OKR, 'id'>): Promise<ServiceResult<OKR>> {
    const { data, error } = await supabase
      .from('okrs')
      .insert({ unit: okr.unit, objective: okr.objective, progress: okr.progress, key_results: okr.keyResults })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapOkr(data), error: null }
  },

  async update(id: string, updates: Partial<OKR>): Promise<ServiceResult<OKR>> {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit
    if (updates.objective !== undefined) dbUpdates.objective = updates.objective
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress
    if (updates.keyResults !== undefined) dbUpdates.key_results = updates.keyResults
    const { data, error } = await supabase
      .from('okrs')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapOkr(data), error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase.from('okrs').delete().eq('id', id)
    return { data: null, error: error?.message ?? null }
  },

  async updateKeyResult(
    okrId: string,
    keyResults: Array<{ text: string; completed: boolean }>
  ): Promise<ServiceResult<OKR>> {
    return okrsService.update(okrId, { keyResults })
  },
}
