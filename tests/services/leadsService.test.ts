import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { leadsService } from '@/services/leadsService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawLead = {
  id: '1',
  name: 'Ana Silva',
  email: 'ana@test.com',
  source: 'Organic',
  status: 'New',
  value: 1000,
  product: 'Nexus',
  created_at: '2026-01-01T00:00:00Z',
}

describe('leadsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns mapped leads on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawLead], error: null }))

      const result = await leadsService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name).toBe('Ana Silva')
      expect(result.data![0].createdAt).toBe('2026-01-01T00:00:00Z')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await leadsService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('create', () => {
    it('returns mapped lead on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawLead, error: null }))

      const result = await leadsService.create({
        name: 'Ana Silva',
        email: 'ana@test.com',
        source: 'Organic',
        status: 'New',
        value: 1000,
        product: 'Nexus',
      })

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('1')
      expect(result.data!.name).toBe('Ana Silva')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await leadsService.create({
        name: 'Ana',
        email: 'ana@test.com',
        source: 'Organic',
        status: 'New',
        value: 500,
        product: 'Nexus',
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })

  describe('update', () => {
    it('returns updated lead on success', async () => {
      const updated = { ...rawLead, name: 'Ana Atualizada' }
      mockFrom.mockReturnValue(createMockBuilder({ data: updated, error: null }))

      const result = await leadsService.update('1', { name: 'Ana Atualizada' })

      expect(result.error).toBeNull()
      expect(result.data!.name).toBe('Ana Atualizada')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Update failed' } })
      )

      const result = await leadsService.update('1', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Update failed')
    })
  })

  describe('delete (soft)', () => {
    it('returns null data on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: null }))

      const result = await leadsService.delete('1')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Delete failed' } })
      )

      const result = await leadsService.delete('1')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Delete failed')
    })
  })
})
