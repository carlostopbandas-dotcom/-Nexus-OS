import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { storeMetricsService } from '@/services/storeMetricsService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawMetric = {
  id: '1',
  store_name: 'Loja Principal',
  sales: 15000,
  spend: 3000,
  roas: 5,
  date: '2026-01-15',
  created_at: '2026-01-15T00:00:00Z',
}

describe('storeMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns metrics on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawMetric], error: null }))

      const result = await storeMetricsService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].store_name).toBe('Loja Principal')
      expect(result.data![0].roas).toBe(5)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await storeMetricsService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('getByDateRange', () => {
    it('returns metrics from start date on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawMetric], error: null }))

      const result = await storeMetricsService.getByDateRange('2026-01-01')

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].date).toBe('2026-01-15')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Range query failed' } })
      )

      const result = await storeMetricsService.getByDateRange('2026-01-01')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Range query failed')
    })
  })

  describe('create', () => {
    it('returns created metric on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawMetric, error: null }))

      const result = await storeMetricsService.create({
        store_name: 'Loja Principal',
        sales: 15000,
        spend: 3000,
        roas: 5,
        date: '2026-01-15',
      })

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('1')
      expect(result.data!.sales).toBe(15000)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await storeMetricsService.create({
        store_name: 'X',
        sales: 0,
        spend: 0,
        roas: 0,
        date: '2026-01-01',
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })
})
