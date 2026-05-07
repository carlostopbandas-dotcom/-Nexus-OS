import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { userProfilesService } from '@/services/userProfilesService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawProfile = {
  id: 'uuid-ceo',
  role: 'ceo',
  full_name: 'Carlos Eduardo',
  email: 'carlos@3ddigitalbusiness.com',
  onboarded_at: null,
  created_at: '2026-01-01T00:00:00Z',
}

const rawVendedor = {
  id: 'uuid-vendedor',
  role: 'vendedor_sdr',
  full_name: 'João Vendedor',
  email: 'joao@3ddigitalbusiness.com',
  onboarded_at: null,
  created_at: '2026-01-02T00:00:00Z',
}

describe('userProfilesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMyProfile', () => {
    it('returns mapped profile on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawProfile, error: null }))

      const result = await userProfilesService.getMyProfile()

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('uuid-ceo')
      expect(result.data!.role).toBe('ceo')
      expect(result.data!.fullName).toBe('Carlos Eduardo')
      expect(result.data!.onboardedAt).toBeNull()
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'Not found' } }))

      const result = await userProfilesService.getMyProfile()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not found')
    })
  })

  describe('getAll', () => {
    it('returns all profiles mapped', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: [rawProfile, rawVendedor], error: null })
      )

      const result = await userProfilesService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      expect(result.data![0].role).toBe('ceo')
      expect(result.data![1].role).toBe('vendedor_sdr')
    })
  })

  describe('create', () => {
    it('returns created profile on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawVendedor, error: null }))

      const result = await userProfilesService.create({
        id: 'uuid-vendedor',
        role: 'vendedor_sdr',
        fullName: 'João Vendedor',
        email: 'joao@3ddigitalbusiness.com',
      })

      expect(result.error).toBeNull()
      expect(result.data!.role).toBe('vendedor_sdr')
      expect(result.data!.fullName).toBe('João Vendedor')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await userProfilesService.create({
        id: 'uuid-new',
        role: 'assistente',
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })

  describe('updateRole', () => {
    it('returns updated profile on success', async () => {
      const updated = { ...rawVendedor, role: 'gestor_vcchic' }
      mockFrom.mockReturnValue(createMockBuilder({ data: updated, error: null }))

      const result = await userProfilesService.updateRole('uuid-vendedor', 'gestor_vcchic')

      expect(result.error).toBeNull()
      expect(result.data!.role).toBe('gestor_vcchic')
    })
  })

  describe('markOnboarded', () => {
    it('sets onboarded_at timestamp', async () => {
      const onboarded = { ...rawProfile, onboarded_at: '2026-03-22T10:00:00Z' }
      mockFrom.mockReturnValue(createMockBuilder({ data: onboarded, error: null }))

      const result = await userProfilesService.markOnboarded('uuid-ceo')

      expect(result.error).toBeNull()
      expect(result.data!.onboardedAt).toBe('2026-03-22T10:00:00Z')
    })
  })

  describe('delete', () => {
    it('returns null data on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: null }))

      const result = await userProfilesService.delete('uuid-vendedor')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Delete failed' } })
      )

      const result = await userProfilesService.delete('uuid-vendedor')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Delete failed')
    })
  })
})
