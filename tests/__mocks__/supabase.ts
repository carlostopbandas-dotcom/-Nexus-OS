import { vi } from 'vitest'

export type MockResponse = {
  data: unknown
  error: { message: string } | null
}

/**
 * Creates a chainable Supabase query builder mock.
 *
 * All chaining methods (select, insert, update, delete, eq, is, gte, order)
 * return `this`, making the builder itself the awaitable terminal.
 * The builder is thenable: `await builder` resolves with `response`.
 *
 * Works for all query patterns used in this codebase:
 * - .from().select().is().order()       → await resolves
 * - .from().insert().select().single()  → await resolves
 * - .from().update().eq()               → await resolves (soft delete)
 * - .from().delete().eq()               → await resolves (hard delete)
 * - .from().select().gte().order()      → await resolves
 */
export const createMockBuilder = (response: MockResponse) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then(
      onFulfilled: ((value: MockResponse) => unknown) | null | undefined,
      onRejected?: ((reason: unknown) => unknown) | null | undefined
    ) {
      return Promise.resolve(response).then(onFulfilled, onRejected)
    },
  }
  return builder
}
