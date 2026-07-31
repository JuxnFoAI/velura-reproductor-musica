/** Resolución de rutas del renderer y recursos empaquetados en Electron. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'

/**
 * Ruta absoluta al HTML del renderer (dist/index.html).
 * - Desarrollo estático (`electron .`): dist/ junto al repo.
 * - Empaquetado (fase 10): dist/ dentro de app.getAppPath().
 */
export function resolveRendererIndexPath(): string {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), 'dist', 'index.html')
  }

  const desktopBundleDirectory = path.dirname(fileURLToPath(import.meta.url))
  return path.join(desktopBundleDirectory, '..', '..', 'dist', 'index.html')
}

/** Ruta al preload compilado (desktop/dist/preload.js). */
export function resolvePreloadPath(): string {
  const desktopBundleDirectory = path.dirname(fileURLToPath(import.meta.url))
  return path.join(desktopBundleDirectory, 'preload.js')
}
