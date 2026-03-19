import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { okrsService } from '@/services/okrsService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawOkr = {
  id: '1',
  unit: 'Sales',
  objective: 'Dobrar receita Q1',
  progress: 45,
  key_results: [
    { text: 'Fechar 10 contratos', completed: false },
    { text: 'Atingir R$100k MRR', completed: false },
  ],
}

describe('okrsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('maps key_results to keyResults on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawOkr], error: null }))

      const result = await okrsService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].objective).toBe('Dobrar receita Q1')
      expect(result.data![0].keyResults).toHaveLength(2)
      expect(result.data![0].progress).toBe(45)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await okrsService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('create', () => {
    it('returns mapped OKR on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawOkr, error: null }))

      const result = await okrsService.create({
        unit: 'Sales',
        objective: 'Dobrar receita Q1',
        progress: 0,
        keyResults: [{ text: 'Fechar 10 contratos', completed: false }],
      })

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('1')
      expect(result.data!.keyResults).toHaveLength(2)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await okrsService.create({
        unit: 'Sales',
        objective: 'X',
        progress: 0,
        keyResults: [],
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })

  describe('updateKeyResult', () => {
    it('delegates to update and returns mapped OKR', async () => {
      const updatedOkr = { ...rawOkr, key_results: [{ text: 'Fechar 10 contratos', completed: true }] }
      mockFrom.mockReturnValue(createMockBuilder({ data: updatedOkr, error: null }))

      const result = await okrsService.updateKeyResult('1', [
        { text: 'Fechar 10 contratos', completed: true },
      ])

      expect(result.error).toBeNull()
      expect(result.data!.keyResults[0].completed).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('okrs')
    })
  })
})
