import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const rootPkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8')
) as { version: string }

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/types/**',
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/components/ui/**',
        'src/vite-env.d.ts',
      ],
    },
  },
})
