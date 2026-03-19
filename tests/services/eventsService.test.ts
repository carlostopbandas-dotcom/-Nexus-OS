import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { eventsService } from '@/services/eventsService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawEvent = {
  id: '1',
  title: 'Daily Standup',
  start_time: '2026-01-15T09:00:00Z',
  end_time: '2026-01-15T09:30:00Z',
  type: 'meeting',
  attendees: ['Ana', 'Carlos'],
  day_offset: 0,
}

describe('eventsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('maps start_time to start on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawEvent], error: null }))

      const result = await eventsService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].start).toBe('2026-01-15T09:00:00Z')
      expect(result.data![0].title).toBe('Daily Standup')
      expect(result.data![0].dayOffset).toBe(0)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await eventsService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('create', () => {
    it('returns mapped event on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawEvent, error: null }))

      const result = await eventsService.create({
        title: 'Daily Standup',
        start: '2026-01-15T09:00:00Z',
        end: '2026-01-15T09:30:00Z',
        type: 'meeting',
        attendees: ['Ana', 'Carlos'],
        dayOffset: 0,
      })

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('1')
      expect(result.data!.start).toBe('2026-01-15T09:00:00Z')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await eventsService.create({
        title: 'X',
        start: '2026-01-01T08:00:00Z',
        end: '2026-01-01T09:00:00Z',
        type: 'call',
        dayOffset: 1,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })
})
