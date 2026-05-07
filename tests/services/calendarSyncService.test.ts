import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}))

import { supabase } from '@/lib/supabase'
import { calendarSyncService } from '@/services/calendarSyncService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)
const mockGetSession = vi.mocked(supabase.auth.getSession)

const MOCK_LOG = {
  id: 'log-uuid-1',
  status: 'success',
  imported: 5,
  exported: 2,
  error_msg: null,
  synced_at: '2026-05-07T14:00:00Z',
}

describe('calendarSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSyncStatus', () => {
    it('retorna último log de sincronização quando há histórico', async () => {
      mockFrom.mockReturnValueOnce(createMockBuilder({ data: MOCK_LOG, error: null }))

      const { data, error } = await calendarSyncService.getSyncStatus()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!.status).toBe('success')
      expect(data!.imported).toBe(5)
      expect(data!.exported).toBe(2)
      expect(data!.errorMsg).toBeNull()
    })

    it('retorna { data: null, error: null } quando não há histórico (PGRST116)', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: null, error: { message: 'no rows', code: 'PGRST116' } })
      )

      const { data, error } = await calendarSyncService.getSyncStatus()

      expect(data).toBeNull()
      expect(error).toBeNull()
    })

    it('retorna { data: null, error } em caso de erro de rede', async () => {
      mockFrom.mockReturnValueOnce(
        createMockBuilder({ data: null, error: { message: 'connection refused' } })
      )

      const { data, error } = await calendarSyncService.getSyncStatus()

      expect(data).toBeNull()
      expect(error).toBe('connection refused')
    })
  })

  describe('triggerSync', () => {
    it('retorna { imported, exported } em caso de sucesso', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'tok-abc' } },
      } as never)

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imported: 8, exported: 3, synced_at: '2026-05-07T14:00:00Z' }),
      } as never)

      const { data, error } = await calendarSyncService.triggerSync()

      expect(error).toBeNull()
      expect(data!.imported).toBe(8)
      expect(data!.exported).toBe(3)
    })

    it('retorna { data: null, error } quando Edge Function retorna erro HTTP', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'tok-abc' } },
      } as never)

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Google Calendar não configurado' }),
      } as never)

      const { data, error } = await calendarSyncService.triggerSync()

      expect(data).toBeNull()
      expect(error).toContain('Google Calendar não configurado')
    })

    it('retorna { data: null, error: "Sessão inválida" } quando sem sessão ativa', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
      } as never)

      const { data, error } = await calendarSyncService.triggerSync()

      expect(data).toBeNull()
      expect(error).toBe('Sessão inválida')
    })
  })
})
