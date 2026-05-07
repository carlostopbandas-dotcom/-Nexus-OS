import { financialService } from '@/services/financialService'
import { adsService, type AdsCampaign } from '@/services/adsService'

export const ROAS_TARGET = 3.0

export type ProfitabilityStatus = 'profitable' | 'warning' | 'no_data'

export interface StoreCampaignSummary {
  store: string
  roas: number | null
  status: ProfitabilityStatus
  campaigns: AdsCampaign[]
  adsConfigured: boolean
}

type ServiceResult<T> = { data: T | null; error: string | null }

const STORES = ['vcchic', 'moriel', 'sezo'] as const

function deriveStatus(roas: number | null): ProfitabilityStatus {
  if (roas === null) return 'no_data'
  if (roas >= ROAS_TARGET) return 'profitable'
  return 'warning'
}

export const campaignProfitabilityService = {
  async getStoreSummary(
    store: string,
    period: { start: string; end: string }
  ): Promise<ServiceResult<StoreCampaignSummary>> {
    const [financialsResult, campaignsResult] = await Promise.all([
      financialService.getStoreFinancials(store, period),
      adsService.getCampaigns(store, { start: period.start, end: period.end }),
    ])

    if (financialsResult.error) return { data: null, error: financialsResult.error }
    if (campaignsResult.error) return { data: null, error: campaignsResult.error }

    const { roas, adsConfigured } = financialsResult.data!
    const campaigns = campaignsResult.data ?? []

    return {
      data: {
        store,
        roas,
        status: deriveStatus(roas),
        campaigns,
        adsConfigured,
      },
      error: null,
    }
  },

  async getGroupSummary(
    period: { start: string; end: string }
  ): Promise<ServiceResult<StoreCampaignSummary[]>> {
    const results = await Promise.all(
      STORES.map(store => campaignProfitabilityService.getStoreSummary(store, period))
    )

    const firstError = results.find(r => r.error)
    if (firstError) return { data: null, error: firstError.error }

    return { data: results.map(r => r.data!), error: null }
  },
}
