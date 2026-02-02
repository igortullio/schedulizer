/// <reference types='vitest' />

import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/landing',
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
      '@schedulizer/env/client': path.resolve(import.meta.dirname, '../../libs/shared/env/src/client.ts'),
      '@schedulizer/env/server': path.resolve(import.meta.dirname, '../../libs/shared/env/src/server.ts'),
      '@schedulizer/shared-types': path.resolve(import.meta.dirname, '../../libs/shared/types/src/index.ts'),
      '@schedulizer/ui': path.resolve(import.meta.dirname, '../../libs/ui/src/index.ts'),
    },
    preserveSymlinks: false,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [path.resolve(import.meta.dirname, './src/test-setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    env: {
      NODE_ENV: 'test',
    },
    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: ['@testing-library/react', '@testing-library/user-event', '@testing-library/jest-dom', 'happy-dom'],
        },
      },
      moduleDirectories: ['node_modules', path.resolve(import.meta.dirname, '../../node_modules')],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/apps/landing',
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
})
