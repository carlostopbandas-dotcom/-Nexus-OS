import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['services/**/*.ts'],
      exclude: ['services/shopifyService.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 40 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('.'),
    },
  },
})
