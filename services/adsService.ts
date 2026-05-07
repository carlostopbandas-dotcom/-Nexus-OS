import { supabase } from '@/lib/supabase'

export interface AdsCampaign {
  id: string
  source: 'facebook' | 'google'
  storeName: string
  campaignId: string
  campaignName: string
  spend: number
  impressions: number
  clicks: number
  dateStart: string
  dateEnd: string
  fetchedAt: string
  ctr: number
}

export interface AdsSyncLog {
  id: string
  source: 'facebook' | 'google'
  storeName: string
  status: 'success' | 'error' | 'partial'
  records: number | null
  errorMsg: string | null
  syncedAt: string
}

type ServiceResult<T> = { data: T | null; error: string | null }

export const adsService = {
  async getCampaigns(
    store: string,
    dateRange?: { start: string; end: string }
  ): Promise<ServiceResult<AdsCampaign[]>> {
    let query = supabase
      .from('ads_campaigns_cache')
      .select('*')
      .eq('store_name', store)
      .order('spend', { ascending: false })

    if (dateRange) {
      query = query.gte('date_start', dateRange.start).lte('date_end', dateRange.end)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }

    return {
      data: (data ?? []).map(r => ({
        id: r.id,
        source: r.source as 'facebook' | 'google',
        storeName: r.store_name,
        campaignId: r.campaign_id,
        campaignName: r.campaign_name,
        spend: r.spend,
        impressions: r.impressions ?? 0,
        clicks: r.clicks ?? 0,
        dateStart: r.date_start,
        dateEnd: r.date_end,
        fetchedAt: r.fetched_at,
        ctr: (r.impressions ?? 0) > 0 ? (r.clicks / r.impressions) * 100 : 0,
      })),
      error: null,
    }
  },

  async getLastSync(store: string): Promise<ServiceResult<AdsSyncLog>> {
    const { data, error } = await supabase
      .from('ads_sync_log')
      .select('*')
      .eq('store_name', store)
      .order('synced_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') return { data: null, error: error.message }
    if (!data) return { data: null, error: null }

    return {
      data: {
        id: data.id,
        source: data.source as 'facebook' | 'google',
        storeName: data.store_name,
        status: data.status as 'success' | 'error' | 'partial',
        records: data.records,
        errorMsg: data.error_msg,
        syncedAt: data.synced_at,
      },
      error: null,
    }
  },

  async triggerSync(): Promise<ServiceResult<{ synced: number }>> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { data: null, error: 'Sessão inválida' }

    try {
      const response = await fetch('/api/ads/facebook-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await response.json()
      if (!response.ok) return { data: null, error: json.error ?? 'Sync falhou' }
      return { data: { synced: json.synced ?? 0 }, error: null }
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  },
}
