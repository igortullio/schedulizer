import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: [
			{
				extends: './apps/api/vitest.config.ts',
				test: {
					name: 'api',
					include: ['apps/api/src/**/*.{test,spec}.ts'],
				},
			},
			{
				extends: './apps/landing/vitest.config.ts',
				test: {
					name: 'landing',
					include: ['apps/landing/src/**/*.{test,spec}.{ts,tsx}'],
				},
			},
			{
				extends: './libs/ui/vite.config.ts',
				test: {
					name: 'ui',
					include: ['libs/ui/src/**/*.{test,spec}.{ts,tsx}'],
				},
			},
			{
				test: {
					name: 'db',
					include: ['libs/db/src/**/*.{test,spec}.ts'],
				},
			},
			{
				test: {
					name: 'shared-types',
					include: ['libs/shared/types/src/**/*.{test,spec}.ts'],
				},
			},
		],
	},
})
