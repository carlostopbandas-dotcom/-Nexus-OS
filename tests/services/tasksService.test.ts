import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { tasksService } from '@/services/tasksService'
import { createMockBuilder } from '@/tests/__mocks__/supabase'

const mockFrom = vi.mocked(supabase.from)

const rawTask = {
  id: '1',
  title: 'Revisar pipeline',
  type: 'Big Rock',
  completed: false,
  category: 'Sales',
}

describe('tasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns mapped tasks on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: [rawTask], error: null }))

      const result = await tasksService.getAll()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].title).toBe('Revisar pipeline')
      expect(result.data![0].completed).toBe(false)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))

      const result = await tasksService.getAll()

      expect(result.data).toBeNull()
      expect(result.error).toBe('DB error')
    })
  })

  describe('create', () => {
    it('returns created task on success', async () => {
      mockFrom.mockReturnValue(createMockBuilder({ data: rawTask, error: null }))

      const result = await tasksService.create({
        title: 'Revisar pipeline',
        type: 'Big Rock',
        completed: false,
        category: 'Sales',
      })

      expect(result.error).toBeNull()
      expect(result.data!.id).toBe('1')
      expect(result.data!.type).toBe('Big Rock')
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Insert failed' } })
      )

      const result = await tasksService.create({
        title: 'Task X',
        type: 'Small',
        completed: false,
        category: 'Sales',
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insert failed')
    })
  })

  describe('update', () => {
    it('returns updated task on success', async () => {
      const updated = { ...rawTask, completed: true }
      mockFrom.mockReturnValue(createMockBuilder({ data: updated, error: null }))

      const result = await tasksService.update('1', { completed: true })

      expect(result.error).toBeNull()
      expect(result.data!.completed).toBe(true)
    })

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(
        createMockBuilder({ data: null, error: { message: 'Update failed' } })
      )

      const result = await tasksService.update('1', { completed: true })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Update failed')
    })
  })

  describe('toggleCompleted', () => {
    it('delegates to update with completed flag', async () => {
      const completed = { ...rawTask, completed: true }
      mockFrom.mockReturnValue(createMockBuilder({ data: completed, error: null }))

      const result = await tasksService.toggleCompleted('1', true)

      expect(result.error).toBeNull()
      expect(result.data!.completed).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('tasks')
    })
  })
})
