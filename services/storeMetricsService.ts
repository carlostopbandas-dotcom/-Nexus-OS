import { supabase } from '@/lib/supabase'
import type { StoreMetric } from '@/store/useAppStore'

type ServiceResult<T> = { data: T | null; error: string | null }

export const storeMetricsService = {
  async getAll(): Promise<ServiceResult<StoreMetric[]>> {
    const { data, error } = await supabase
      .from('store_metrics')
      .select('*')
      .order('date', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async getById(id: string): Promise<ServiceResult<StoreMetric>> {
    const { data, error } = await supabase
      .from('store_metrics')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async getByDateRange(startDate: string): Promise<ServiceResult<StoreMetric[]>> {
    const { data, error } = await supabase
      .from('store_metrics')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async create(metric: Omit<StoreMetric, 'id'>): Promise<ServiceResult<StoreMetric>> {
    const { data, error } = await supabase
      .from('store_metrics')
      .insert(metric)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async update(id: string, updates: Partial<StoreMetric>): Promise<ServiceResult<StoreMetric>> {
    const { data, error } = await supabase
      .from('store_metrics')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase.from('store_metrics').delete().eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}
