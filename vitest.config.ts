/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only collect coverage for core code during Phase 0; UI is covered by E2E
      include: ['lib/**/*.ts', 'db/**/*.ts', 'core/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        'public/',
        '.next/',
        'coverage/',
        '**/*.test.*',
        '**/*.spec.*',
        'app/**',
        'components/**',
        'electron/**',
        'dist/**',
        'dist-electron/**',
        'out/**'
      ]
      // Thresholds are enforced in CI's "Enforce coverage" step per directory
    },
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.itest.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'e2e/',
      '.next/',
      'coverage/'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/db': path.resolve(__dirname, './db'),
      '@/app': path.resolve(__dirname, './app')
    }
  }
})
