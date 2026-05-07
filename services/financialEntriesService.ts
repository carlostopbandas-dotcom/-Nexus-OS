import { supabase } from '@/lib/supabase'

type ServiceResult<T> = { data: T | null; error: string | null }

export interface FinancialEntry {
  id: string
  business_unit: string
  entry_type: 'revenue' | 'expense' | 'cmv'
  category: string | null
  amount: number
  description: string | null
  entry_date: string
  created_at: string
  updated_at: string
}

export interface NewFinancialEntry {
  business_unit: string
  entry_type: 'revenue' | 'expense' | 'cmv'
  category?: string
  amount: number
  description?: string
  entry_date: string
}

export const financialEntriesService = {
  async getEntries({
    businessUnit,
    period,
    entryType,
  }: {
    businessUnit: string
    period: { start: string; end: string }
    entryType?: 'revenue' | 'expense' | 'cmv'
  }): Promise<ServiceResult<FinancialEntry[]>> {
    try {
      let query = supabase
        .from('financial_entries')
        .select('*')
        .eq('business_unit', businessUnit)
        .gte('entry_date', period.start)
        .lte('entry_date', period.end)
        .order('entry_date', { ascending: false })

      if (entryType) query = (query as typeof query).eq('entry_type', entryType)

      const { data, error } = await query
      if (error) return { data: null, error: error.message }
      return { data: data ?? [], error: null }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },

  async createEntry(entry: NewFinancialEntry): Promise<ServiceResult<FinancialEntry>> {
    try {
      const { data, error } = await supabase
        .from('financial_entries')
        .insert(entry)
        .select()
        .single()
      if (error) return { data: null, error: error.message }
      return { data, error: null }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },

  async updateEntry(
    id: string,
    updates: Partial<NewFinancialEntry>
  ): Promise<ServiceResult<FinancialEntry>> {
    try {
      const { data, error } = await supabase
        .from('financial_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return { data: null, error: error.message }
      return { data, error: null }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },

  async deleteEntry(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .delete()
        .eq('id', id)
      if (error) return { data: null, error: error.message }
      return { data: null, error: null }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },
}
