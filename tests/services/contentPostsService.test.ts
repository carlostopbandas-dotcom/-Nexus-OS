import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { contentPostsService } from '@/services/contentPostsService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawPost = {
  id: '1',
  platform: 'linkedin',
  content: 'Texto de teste para LinkedIn',
  imagePrompt: undefined,
  status: 'Draft',
  date: '2026-01-15',
  stats: undefined,
}

describe('contentPostsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns posts on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawPost], error: null }))

      const result = await contentPostsService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].platform).toBe('linkedin')
      expect(result.data![0].status).toBe('Draft')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await contentPostsService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('create', () => {
    it('returns created post on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawPost, error: null }))

      const result = await contentPostsService.create({
        platform: 'linkedin',
        content: 'Texto de teste para LinkedIn',
        status: 'Draft',
        date: '2026-01-15',
      })

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('1')
      expect(result.data!.content).toBe('Texto de teste para LinkedIn')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await contentPostsService.create({
        platform: 'instagram',
        content: 'Post X',
        status: 'Draft',
        date: '2026-01-01',
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })
})
