/** Utilidades para validar y leer archivos de letra (.txt / .lrc). */

const LYRICS_EXTENSIONS = ['.txt', '.lrc'] as const

export type LyricsFileExtension = (typeof LYRICS_EXTENSIONS)[number]

export const LYRICS_FILE_ACCEPT = '.txt,.lrc'
export const LYRICS_FORMAT_HINT = 'Te recomendamos que sean archivos .txt o .lrc'

/**
 * Comprueba si el archivo seleccionado es una letra admitida.
 */
export function isValidLyricsFile(file: File): boolean {
  const normalizedName = file.name.trim().toLowerCase()

  return LYRICS_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
}

/**
 * Obtiene la extensión admitida del archivo de letra.
 */
export function resolveLyricsExtension(filename: string): LyricsFileExtension | null {
  const normalizedName = filename.trim().toLowerCase()

  if (normalizedName.endsWith('.lrc')) {
    return '.lrc'
  }

  if (normalizedName.endsWith('.txt')) {
    return '.txt'
  }

  return null
}

/**
 * Lee el contenido textual de un archivo de letra en UTF-8.
 */
export function readLyricsFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo leer el archivo de letra seleccionado.'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo de letra seleccionado.'))
    }

    reader.readAsText(file, 'utf-8')
  })
}

/**
 * Devuelve el nombre de archivo a partir de una ruta relativa de letra.
 */
export function getLyricsFilename(relativePath: string): string {
  const normalizedPath = relativePath.replace(/\\/g, '/')
  const segments = normalizedPath.split('/')

  return segments.at(-1) ?? relativePath
}

/**
 * Obtiene la extensión de letra a partir de una ruta relativa en disco.
 */
export function resolveLyricsExtensionFromRelativePath(
  relativePath: string,
): LyricsFileExtension | null {
  return resolveLyricsExtension(getLyricsFilename(relativePath))
}
