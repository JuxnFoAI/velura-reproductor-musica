/** Bloquea navegación externa y apertura de ventanas no autorizadas en el renderer. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WebContents } from 'electron'

const ALLOWED_DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1'])
const DEFAULT_DEV_SERVER_URL = 'http://localhost:5173'

export interface NavigationGuardOptions {
  isDevMode: boolean
  devServerUrl: string
  productionIndexPath: string
}

function parseAllowedDevServerOrigin(devServerUrl: string): string | null {
  try {
    const parsedUrl = new URL(devServerUrl)

    if (!ALLOWED_DEV_HOSTNAMES.has(parsedUrl.hostname)) {
      return null
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null
    }

    return parsedUrl.origin
  } catch {
    return null
  }
}

/** Valida y normaliza la URL del servidor Vite usada en modo desarrollo. */
export function resolveSafeDevServerUrl(rawUrl: string | undefined): string {
  if (rawUrl && parseAllowedDevServerOrigin(rawUrl)) {
    return rawUrl
  }

  return DEFAULT_DEV_SERVER_URL
}

function isAllowedDevNavigation(url: string, allowedOrigin: string): boolean {
  try {
    return new URL(url).origin === allowedOrigin
  } catch {
    return false
  }
}

function isAllowedProductionNavigation(url: string, productionIndexPath: string): boolean {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol !== 'file:') {
      return false
    }

    const indexDirectory = path.dirname(productionIndexPath)
    const targetPath = path.resolve(fileURLToPath(parsedUrl.href))
    const relativePath = path.relative(indexDirectory, targetPath)

    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
  } catch {
    return false
  }
}

function isAllowedNavigationUrl(url: string, options: NavigationGuardOptions): boolean {
  if (options.isDevMode) {
    const allowedOrigin = parseAllowedDevServerOrigin(options.devServerUrl)

    if (!allowedOrigin) {
      return false
    }

    return isAllowedDevNavigation(url, allowedOrigin)
  }

  return isAllowedProductionNavigation(url, options.productionIndexPath)
}

function preventUnauthorizedNavigation(
  event: Electron.Event,
  url: string,
  options: NavigationGuardOptions,
): void {
  if (!isAllowedNavigationUrl(url, options)) {
    event.preventDefault()
  }
}

/** Registra guardas contra navegación externa y ventanas emergentes del renderer. */
export function registerNavigationGuards(
  webContents: WebContents,
  options: NavigationGuardOptions,
): void {
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  webContents.on('will-navigate', (event, url) => {
    preventUnauthorizedNavigation(event, url, options)
  })

  webContents.on('will-redirect', (event, url) => {
    preventUnauthorizedNavigation(event, url, options)
  })
}
