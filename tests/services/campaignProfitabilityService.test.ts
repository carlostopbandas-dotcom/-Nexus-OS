import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { campaignProfitabilityService, ROAS_TARGET } from '@/services/campaignProfitabilityService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const PERIOD = { start: '2026-05-01', end: '2026-05-31' }

const MOCK_CAMPAIGN = {
  id: 'camp-1',
  source: 'facebook',
  store_name: 'vcchic',
  campaign_id: 'fb-123',
  campaign_name: 'Campanha Verão',
  spend: 3000,
  impressions: 50000,
  clicks: 1500,
  date_start: '2026-05-01',
  date_end: '2026-05-31',
  fetched_at: '2026-05-07T00:00:00Z',
  created_at: '2026-05-07T00:00:00Z',
}

/**
 * getStoreSummary faz 3 queries via Promise.all:
 *   1) store_metrics (financialService interno)
 *   2) ads_campaigns_cache — spend agregado (financialService interno)
 *   3) ads_campaigns_cache — lista detalhada (adsService)
 */
function mockStoreSummary(
  metricsData: { sales: number }[],
  spendData: { spend: number }[],
  campaignsData: typeof MOCK_CAMPAIGN[],
  metricsError: { message: string } | null = null
) {
  mockFrom
    .mockReturnValueOnce(createMockBuilder({ data: metricsData, error: metricsError }))
    .mockReturnValueOnce(createMockBuilder({ data: spendData, error: null }))
    .mockReturnValueOnce(createMockBuilder({ data: campaignsData, error: null }))
}

describe('campaignProfitabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStoreSummary', () => {
    it('retorna status profitable quando ROAS >= meta', async () => {
      // receita 9000, adSpend 3000 → ROAS 3.0 = exatamente na meta
      mockStoreSummary(
        [{ sales: 9000 }],
        [{ spend: 3000 }],
        [MOCK_CAMPAIGN]
      )

      const { data, error } = await campaignProfitabilityService.getStoreSummary('vcchic', PERIOD)

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!.roas).toBeCloseTo(ROAS_TARGET, 5)
      expect(data!.status).toBe('profitable')
      expect(data!.adsConfigured).toBe(true)
      expect(data!.campaigns).toHaveLength(1)
      expect(data!.campaigns[0].campaignName).toBe('Campanha Verão')
    })

    it('retorna status warning quando ROAS > 0 e < meta', async () => {
      // receita 4000, adSpend 3000 → ROAS 1.33x
      mockStoreSummary(
        [{ sales: 4000 }],
        [{ spend: 3000 }],
        [MOCK_CAMPAIGN]
      )

      const { data, error } = await campaignProfitabilityService.getStoreSummary('vcchic', PERIOD)

      expect(error).toBeNull()
      expect(data!.status).toBe('warning')
      expect(data!.roas).toBeCloseTo(1.33, 1)
    })

    it('retorna status no_data quando não há campanhas no período', async () => {
      mockStoreSummary(
        [{ sales: 5000 }],
        [],   // nenhum gasto de ads → adsConfigured false, roas null
        []
      )

      const { data, error } = await campaignProfitabilityService.getStoreSummary('vcchic', PERIOD)

      expect(error).toBeNull()
      expect(data!.status).toBe('no_data')
      expect(data!.roas).toBeNull()
      expect(data!.adsConfigured).toBe(false)
      expect(data!.campaigns).toHaveLength(0)
    })

    it('retorna { data: null, error } quando financialService falha', async () => {
      mockFrom
        .mockReturnValueOnce(createMockBuilder({ data: [], error: { message: 'connection refused' } }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))

      const { data, error } = await campaignProfitabilityService.getStoreSummary('vcchic', PERIOD)

      expect(data).toBeNull()
      expect(error).toBe('connection refused')
    })
  })

  describe('getGroupSummary', () => {
    it('agrega 3 lojas com status distintos corretamente', async () => {
      // vcchic: ROAS 4.0 → profitable
      mockStoreSummary([{ sales: 12000 }], [{ spend: 3000 }], [MOCK_CAMPAIGN])
      // moriel: ROAS 1.5 → warning
      mockStoreSummary([{ sales: 3000 }], [{ spend: 2000 }], [MOCK_CAMPAIGN])
      // sezo: sem ads → no_data
      mockStoreSummary([{ sales: 2000 }], [], [])

      const { data, error } = await campaignProfitabilityService.getGroupSummary(PERIOD)

      expect(error).toBeNull()
      expect(data).toHaveLength(3)
      expect(data![0].status).toBe('profitable')
      expect(data![1].status).toBe('warning')
      expect(data![2].status).toBe('no_data')
    })

    it('retorna { data: null, error } quando qualquer loja falha', async () => {
      // vcchic falha
      mockFrom
        .mockReturnValueOnce(createMockBuilder({ data: [], error: { message: 'timeout' } }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))
      // moriel OK
      mockStoreSummary([{ sales: 3000 }], [], [])
      // sezo OK
      mockStoreSummary([{ sales: 2000 }], [], [])

      const { data, error } = await campaignProfitabilityService.getGroupSummary(PERIOD)

      expect(data).toBeNull()
      expect(error).toBe('timeout')
    })
  })
})
