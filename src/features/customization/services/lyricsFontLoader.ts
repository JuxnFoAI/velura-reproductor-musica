/** Carga dinámica de fuentes de Google Fonts para el modo letra. */

import type { LyricsFontOption } from '../types/lyricsFonts'

const loadedFontIds = new Set<string>()
const loadingPromises = new Map<string, Promise<void>>()

const PREVIEW_FONT_SIZE_PX = 16

/**
 * Extrae el nombre tipográfico principal de una declaración font-family CSS.
 */
function extractFontFamilyName(fontFamily: string): string {
  const quotedMatch = /^'([^']+)'/.exec(fontFamily)

  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  return fontFamily.split(',')[0]?.trim() ?? fontFamily
}

/**
 * Construye la cadena de carga usada por la Font Loading API del navegador.
 */
function buildFontLoadSpec(font: LyricsFontOption): string {
  const familyName = extractFontFamilyName(font.fontFamily)
  return `${PREVIEW_FONT_SIZE_PX}px "${familyName}"`
}

/**
 * Espera a que la fuente esté realmente disponible para renderizar, no solo el CSS.
 */
async function waitForFontFace(font: LyricsFontOption): Promise<void> {
  if (!('fonts' in document)) {
    return
  }

  const loadSpec = buildFontLoadSpec(font)

  try {
    await document.fonts.load(loadSpec)
    await document.fonts.ready
  } catch {
    // Si falla la API de fuentes, el navegador usará fallback sin bloquear la UI.
  }
}

function createFontStylesheet(font: LyricsFontOption): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontsQuery}&display=swap`
    link.onload = () => {
      void waitForFontFace(font).finally(() => {
        loadedFontIds.add(font.id)
        resolve()
      })
    }
    link.onerror = () => {
      reject(new Error(`No se pudo cargar la fuente ${font.label}.`))
    }

    document.head.appendChild(link)
  })
}

/**
 * Garantiza que la fuente solicitada esté disponible en el documento.
 */
export function loadLyricsFont(font: LyricsFontOption): Promise<void> {
  if (font.isPreloaded) {
    return waitForFontFace(font)
  }

  if (loadedFontIds.has(font.id)) {
    return Promise.resolve()
  }

  const pendingLoad = loadingPromises.get(font.id)

  if (pendingLoad) {
    return pendingLoad
  }

  const loadPromise = createFontStylesheet(font).finally(() => {
    loadingPromises.delete(font.id)
  })

  loadingPromises.set(font.id, loadPromise)

  return loadPromise
}

/**
 * Precarga todas las fuentes de una categoría para que la vista previa sea inmediata.
 */
export function preloadLyricsFonts(fonts: readonly LyricsFontOption[]): Promise<void[]> {
  return Promise.all(fonts.map((font) => loadLyricsFont(font)))
}
