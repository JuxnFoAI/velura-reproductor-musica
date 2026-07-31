/** Carga asociaciones manuales MP3 → portada desde mi-musica/cover-overrides.json. */
import fs from 'node:fs'
import path from 'node:path'
import { sanitizeCoverOverrideFilename, sanitizeCoverOverrideKey } from './safePaths'

export const COVER_OVERRIDES_FILENAME = 'cover-overrides.json'

const coverOverridesCache = new Map<string, Record<string, string>>()

function sanitizeCoverOverrides(rawOverrides: Record<string, unknown>): Record<string, string> {
  const sanitizedOverrides: Record<string, string> = {}

  for (const [rawKey, rawValue] of Object.entries(rawOverrides)) {
    const safeKey = sanitizeCoverOverrideKey(rawKey)
    const safeValue = sanitizeCoverOverrideFilename(rawValue)

    if (safeKey && safeValue) {
      sanitizedOverrides[safeKey] = safeValue
    }
  }

  return sanitizedOverrides
}

/**
 * Lee el mapa de portadas personalizadas de la biblioteca musical.
 * Si el archivo no existe o es inválido, devuelve un objeto vacío.
 */
export function loadCoverOverrides(musicDirectory: string): Record<string, string> {
  const cachedOverrides = coverOverridesCache.get(musicDirectory)

  if (cachedOverrides) {
    return cachedOverrides
  }

  const overridesPath = path.join(musicDirectory, COVER_OVERRIDES_FILENAME)
  let overrides: Record<string, string> = {}

  if (fs.existsSync(overridesPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(overridesPath, 'utf-8')) as unknown

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        overrides = sanitizeCoverOverrides(parsed as Record<string, unknown>)
      }
    } catch {
      overrides = {}
    }
  }

  coverOverridesCache.set(musicDirectory, overrides)

  return overrides
}
