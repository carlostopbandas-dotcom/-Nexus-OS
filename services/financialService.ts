import { supabase } from '@/lib/supabase'

export interface StoreFinancials {
  store: string
  revenue: number
  adSpend: number
  roas: number | null
  grossProfit: number
  adsConfigured: boolean
  period: { start: string; end: string }
}

export interface GroupSummary {
  totalRevenue: number
  totalAdSpend: number
  totalGrossProfit: number
  roas: number | null
  adsConfigured: boolean
  stores: StoreFinancials[]
  period: { start: string; end: string }
}

type ServiceResult<T> = { data: T | null; error: string | null }

const STORES = ['vcchic', 'moriel', 'sezo'] as const

export const financialService = {
  async getStoreFinancials(
    store: string,
    period: { start: string; end: string }
  ): Promise<ServiceResult<StoreFinancials>> {
    try {
      const [metricsRes, adsRes] = await Promise.all([
        supabase
          .from('store_metrics')
          .select('sales')
          .eq('store_name', store)
          .gte('date', period.start)
          .lte('date', period.end),
        supabase
          .from('ads_campaigns_cache')
          .select('spend')
          .eq('store_name', store)
          .gte('date_start', period.start)
          .lte('date_end', period.end),
      ])

      if (metricsRes.error) return { data: null, error: metricsRes.error.message }
      if (adsRes.error) return { data: null, error: adsRes.error.message }

      const revenue = (metricsRes.data ?? []).reduce((sum, r) => sum + (r.sales ?? 0), 0)
      const adSpend = (adsRes.data ?? []).reduce((sum, r) => sum + (r.spend ?? 0), 0)
      const adsConfigured = (adsRes.data ?? []).length > 0
      const roas = adsConfigured && adSpend > 0 ? revenue / adSpend : null
      const grossProfit = revenue - adSpend

      return {
        data: { store, revenue, adSpend, roas, grossProfit, adsConfigured, period },
        error: null,
      }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },

  async getGroupSummary(
    period: { start: string; end: string }
  ): Promise<ServiceResult<GroupSummary>> {
    try {
      const results = await Promise.all(
        STORES.map(store => financialService.getStoreFinancials(store, period))
      )

      const errors = results.filter(r => r.error)
      if (errors.length > 0) return { data: null, error: errors[0].error }

      const stores = results.map(r => r.data!)
      const totalRevenue = stores.reduce((sum, s) => sum + s.revenue, 0)
      const totalAdSpend = stores.reduce((sum, s) => sum + s.adSpend, 0)
      const totalGrossProfit = stores.reduce((sum, s) => sum + s.grossProfit, 0)
      const adsConfigured = stores.some(s => s.adsConfigured)
      const roas = adsConfigured && totalAdSpend > 0 ? totalRevenue / totalAdSpend : null

      return {
        data: { totalRevenue, totalAdSpend, totalGrossProfit, roas, adsConfigured, stores, period },
        error: null,
      }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },
}
