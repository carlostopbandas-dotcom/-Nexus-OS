import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { financialEntriesService } from '@/services/financialEntriesService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const PERIOD = { start: '2026-05-01', end: '2026-05-31' }

const MOCK_ENTRY = {
  id: 'entry-uuid-1',
  business_unit: 'vcchic',
  entry_type: 'expense' as const,
  category: 'Frete',
  amount: 500,
  description: 'Frete de mercadorias',
  entry_date: '2026-05-10',
  created_at: '2026-05-10T12:00:00Z',
  updated_at: '2026-05-10T12:00:00Z',
}

describe('financialEntriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEntries', () => {
    it('retorna lista de entradas quando há lançamentos no período', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: [MOCK_ENTRY], error: null })
      )

      const { data, error } = await financialEntriesService.getEntries({
        businessUnit: 'vcchic',
        period: PERIOD,
      })

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].amount).toBe(500)
      expect(data![0].entry_type).toBe('expense')
    })

    it('retorna array vazio quando não há lançamentos no período', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: [], error: null })
      )

      const { data, error } = await financialEntriesService.getEntries({
        businessUnit: 'vcchic',
        period: PERIOD,
      })

      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('retorna { data: null, error } em caso de erro de rede', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: null, error: { message: 'connection refused' } })
      )

      const { data, error } = await financialEntriesService.getEntries({
        businessUnit: 'vcchic',
        period: PERIOD,
      })

      expect(data).toBeNull()
      expect(error).toBe('connection refused')
    })
  })

  describe('createEntry', () => {
    it('retorna a entrada criada com campos corretos', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: MOCK_ENTRY, error: null })
      )

      const { data, error } = await financialEntriesService.createEntry({
        business_unit: 'vcchic',
        entry_type: 'expense',
        category: 'Frete',
        amount: 500,
        description: 'Frete de mercadorias',
        entry_date: '2026-05-10',
      })

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!.id).toBe('entry-uuid-1')
      expect(data!.amount).toBe(500)
      expect(data!.entry_type).toBe('expense')
    })

    it('retorna { data: null, error } quando criação falha por RLS', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: null, error: { message: 'new row violates row-level security policy' } })
      )

      const { data, error } = await financialEntriesService.createEntry({
        business_unit: 'vcchic',
        entry_type: 'expense',
        amount: 200,
        entry_date: '2026-05-10',
      })

      expect(data).toBeNull()
      expect(error).toContain('row-level security')
    })
  })

  describe('updateEntry', () => {
    it('retorna a entrada atualizada', async () => {
      const updated = { ...MOCK_ENTRY, amount: 750, category: 'Embalagem' }
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: updated, error: null })
      )

      const { data, error } = await financialEntriesService.updateEntry('entry-uuid-1', {
        amount: 750,
        category: 'Embalagem',
      })

      expect(error).toBeNull()
      expect(data!.amount).toBe(750)
      expect(data!.category).toBe('Embalagem')
    })
  })

  describe('deleteEntry', () => {
    it('retorna { data: null, error: null } em caso de sucesso', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: null, error: null })
      )

      const { data, error } = await financialEntriesService.deleteEntry('entry-uuid-1')

      expect(data).toBeNull()
      expect(error).toBeNull()
    })
  })
})
