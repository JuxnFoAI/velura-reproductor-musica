/** Configuración de Vite con alias de paths y plugin React. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { musicLibraryPlugin } from './vite-plugins/musicLibraryPlugin'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), musicLibraryPlugin()],
  resolve: {
    alias: {
      '@assets': path.resolve(projectRoot, 'src/assets'),
      '@components': path.resolve(projectRoot, 'src/components'),
      '@features': path.resolve(projectRoot, 'src/features'),
      '@lib': path.resolve(projectRoot, 'src/lib'),
      '@types': path.resolve(projectRoot, 'src/types'),
    },
  },
})
