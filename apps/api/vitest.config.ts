import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/api/src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.spec.ts', '**/*.test.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@schedulizer/types': path.resolve(__dirname, '../../libs/shared/types/src'),
      '@schedulizer/db': path.resolve(__dirname, '../../libs/db/src'),
      '@schedulizer/env/server': path.resolve(__dirname, '../../libs/shared/env/src/server'),
    },
  },
})
