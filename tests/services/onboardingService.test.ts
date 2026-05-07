import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}))

import { supabase } from '@/lib/supabase'
import { onboardingService } from '@/services/onboardingService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)
const mockGetSession = vi.mocked(supabase.auth.getSession)

const SESSION = { data: { session: { user: { id: 'user-uuid-1' }, access_token: 'tok' } } } as never
const NO_SESSION = { data: { session: null } } as never

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isOnboarded', () => {
    it('retorna true quando onboarded_at está preenchido', async () => {
      mockGetSession.mockResolvedValueOnce(SESSION)
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: { onboarded_at: '2026-05-07T10:00:00Z' }, error: null })
      )

      const { data, error } = await onboardingService.isOnboarded()

      expect(error).toBeNull()
      expect(data).toBe(true)
    })

    it('retorna false quando onboarded_at é null', async () => {
      mockGetSession.mockResolvedValueOnce(SESSION)
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: { onboarded_at: null }, error: null })
      )

      const { data, error } = await onboardingService.isOnboarded()

      expect(error).toBeNull()
      expect(data).toBe(false)
    })

    it('retorna false quando sem sessão ativa', async () => {
      mockGetSession.mockResolvedValueOnce(NO_SESSION)

      const { data, error } = await onboardingService.isOnboarded()

      expect(data).toBe(false)
      expect(error).toBeNull()
    })
  })

  describe('markOnboarded', () => {
    it('retorna { data: null, error: null } em caso de sucesso', async () => {
      mockGetSession.mockResolvedValueOnce(SESSION)
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: null, error: null })
      )

      const { data, error } = await onboardingService.markOnboarded()

      expect(data).toBeNull()
      expect(error).toBeNull()
    })

    it('retorna { data: null, error: "Sessão inválida" } quando sem sessão', async () => {
      mockGetSession.mockResolvedValueOnce(NO_SESSION)

      const { data, error } = await onboardingService.markOnboarded()

      expect(data).toBeNull()
      expect(error).toBe('Sessão inválida')
    })
  })
})
