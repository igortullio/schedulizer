import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@schedulizer/whatsapp': path.resolve(__dirname, '../whatsapp/src/index.ts'),
      '@schedulizer/email': path.resolve(__dirname, '../email/src/index.ts'),
      '@schedulizer/shared-types': path.resolve(__dirname, '../shared/types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/index.ts'],
    },
  },
})
