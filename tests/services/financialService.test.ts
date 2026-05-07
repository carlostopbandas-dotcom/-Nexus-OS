import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { financialService } from '@/services/financialService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const PERIOD = { start: '2026-05-01', end: '2026-05-31' }

// Helper: mock store_metrics then ads_campaigns_cache
function mockStoreAndAds(
  metricsData: { sales: number }[],
  adsData: { spend: number }[],
  metricsError: { message: string } | null = null,
  adsError: { message: string } | null = null
) {
  mockFrom
    .mockReturnValueOnce(createMockBuilder({ data: metricsData, error: metricsError }))
    .mockReturnValueOnce(createMockBuilder({ data: adsData, error: adsError }))
}

describe('financialService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStoreFinancials', () => {
    it('calcula ROAS corretamente quando Shopify e Ads têm dados', async () => {
      mockStoreAndAds(
        [{ sales: 10000 }, { sales: 5000 }],
        [{ spend: 3000 }]
      )

      const { data, error } = await financialService.getStoreFinancials('vcchic', PERIOD)

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!.revenue).toBe(15000)
      expect(data!.adSpend).toBe(3000)
      expect(data!.roas).toBeCloseTo(5, 2) // 15000 / 3000 = 5
      expect(data!.grossProfit).toBe(12000)
      expect(data!.adsConfigured).toBe(true)
    })

    it('retorna roas null quando adSpend é zero', async () => {
      mockStoreAndAds(
        [{ sales: 8000 }],
        [] // nenhum dado de ads
      )

      const { data, error } = await financialService.getStoreFinancials('vcchic', PERIOD)

      expect(error).toBeNull()
      expect(data!.roas).toBeNull()
      expect(data!.adSpend).toBe(0)
      expect(data!.adsConfigured).toBe(false)
    })

    it('calcula grossProfit corretamente como receita menos adSpend', async () => {
      mockStoreAndAds(
        [{ sales: 20000 }],
        [{ spend: 4000 }, { spend: 1000 }]
      )

      const { data } = await financialService.getStoreFinancials('vcchic', PERIOD)

      expect(data!.revenue).toBe(20000)
      expect(data!.adSpend).toBe(5000)
      expect(data!.grossProfit).toBe(15000)
    })

    it('retorna adsConfigured false quando ads_campaigns_cache está vazio', async () => {
      mockStoreAndAds(
        [{ sales: 5000 }],
        []
      )

      const { data } = await financialService.getStoreFinancials('vcchic', PERIOD)

      expect(data!.adsConfigured).toBe(false)
      expect(data!.roas).toBeNull()
    })

    it('retorna { data: null, error } em caso de erro de rede', async () => {
      mockStoreAndAds(
        [],
        [],
        { message: 'connection refused' }
      )

      const { data, error } = await financialService.getStoreFinancials('vcchic', PERIOD)

      expect(data).toBeNull()
      expect(error).toBe('connection refused')
    })
  })
})
