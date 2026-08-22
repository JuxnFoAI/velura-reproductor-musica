/** Configuración de Vitest para tests de lógica pura (Node, sin DOM). */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'shared/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@assets': path.resolve(projectRoot, 'src/assets'),
      '@components': path.resolve(projectRoot, 'src/components'),
      '@features': path.resolve(projectRoot, 'src/features'),
      '@hooks': path.resolve(projectRoot, 'src/hooks'),
      '@lib': path.resolve(projectRoot, 'src/lib'),
      '@shared': path.resolve(projectRoot, 'shared'),
      '@types': path.resolve(projectRoot, 'src/types'),
    },
  },
})
