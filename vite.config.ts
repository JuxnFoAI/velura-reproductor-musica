/** Configuración de Vite con alias de paths y plugin React. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { contentSecurityPolicyPlugin } from './vite-plugins/contentSecurityPolicyPlugin'
import { musicLibraryPlugin } from './vite-plugins/musicLibraryPlugin'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command, mode }) => {
  const isViteDevServer = command === 'serve' && mode === 'development'

  return {
    /** Rutas relativas requeridas por Electron al cargar dist/ con file:// */
    base: './',
    plugins: [
      react(),
      contentSecurityPolicyPlugin(),
      ...(isViteDevServer ? [musicLibraryPlugin()] : []),
    ],
    server: {
      host: 'localhost',
    },
    preview: {
      host: 'localhost',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@assets': path.resolve(projectRoot, 'src/assets'),
        '@components': path.resolve(projectRoot, 'src/components'),
        '@features': path.resolve(projectRoot, 'src/features'),
        '@hooks': path.resolve(projectRoot, 'src/hooks'),
        '@lib': path.resolve(projectRoot, 'src/lib'),
        '@types': path.resolve(projectRoot, 'src/types'),
      },
    },
  }
})
