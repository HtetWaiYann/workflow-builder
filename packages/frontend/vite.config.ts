import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const rootPkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8')
) as { version: string }

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
  },
  optimizeDeps: {
    include: ['@triggr/shared'],
  },
  server: {
    // Bind to 0.0.0.0 so the Vite dev server is reachable from the host
    // when running inside a Docker container
    host: true,
    proxy: {
      '/api': {
        // In Docker the backend is reachable via its service name; locally it's localhost.
        target: process.env.BACKEND_URL ?? 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
