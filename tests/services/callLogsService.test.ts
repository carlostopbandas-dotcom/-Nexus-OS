import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { callLogsService } from '@/services/callLogsService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawCallLog = {
  id: '1',
  lead_name: 'Carlos Melo',
  date: '2026-01-15',
  duration: '32min',
  type: 'Discovery',
  status: 'Completed',
  sentiment: 'Positive',
  transcript_snippet: 'Olá, tudo bem?',
  summary: 'Reunião produtiva',
  recording_url: undefined,
}

describe('callLogsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns mapped call logs on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawCallLog], error: null }))

      const result = await callLogsService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].leadName).toBe('Carlos Melo')
      expect(result.data![0].transcriptSnippet).toBe('Olá, tudo bem?')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await callLogsService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('getByLeadId', () => {
    it('returns logs filtered by leadId', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawCallLog], error: null }))

      const result = await callLogsService.getByLeadId('lead-42')

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].leadName).toBe('Carlos Melo')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Not found' } })
      )

      const result = await callLogsService.getByLeadId('lead-42')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not found')
    })
  })

  describe('create', () => {
    it('maps camelCase to snake_case and returns mapped result', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawCallLog, error: null }))

      const result = await callLogsService.create({
        leadName: 'Carlos Melo',
        date: '2026-01-15',
        duration: '32min',
        type: 'Discovery',
        status: 'Completed',
        sentiment: 'Positive',
        transcriptSnippet: 'Olá, tudo bem?',
      })

      expect(result.error).toBeNull()
      expect(result.data!.leadName).toBe('Carlos Melo')
      expect(mockFrom).toHaveBeenCalledWith('call_logs')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await callLogsService.create({
        leadName: 'X',
        date: '2026-01-01',
        duration: '1min',
        type: 'Closing',
        status: 'Missed',
        sentiment: 'Neutral',
        transcriptSnippet: '',
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })
})
