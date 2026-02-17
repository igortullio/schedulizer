/// <reference types='vitest' />
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/landing',
  envDir: '../../',
  server: {
    port: 4300,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT_LANDING,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        deleteAfterUpload: true,
      },
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
      '@schedulizer/env/client': `${import.meta.dirname}/../../libs/shared/env/src/client.ts`,
      '@schedulizer/env/server': `${import.meta.dirname}/../../libs/shared/env/src/server.ts`,
      '@schedulizer/env': `${import.meta.dirname}/../../libs/shared/env/src/index.ts`,
      '@schedulizer/shared-types': `${import.meta.dirname}/../../libs/shared/types/src/index.ts`,
      '@schedulizer/db': `${import.meta.dirname}/../../libs/db/src/index.ts`,
      '@schedulizer/observability': `${import.meta.dirname}/../../libs/observability/src/index.ts`,
    },
  },
  build: {
    outDir: '../../dist/apps/landing',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    sourcemap: true,
  },
}))
