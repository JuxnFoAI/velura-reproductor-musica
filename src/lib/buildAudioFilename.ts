/** Construye nombres de archivo de audio seguros a partir de artista y título. */

const FILENAME_SEPARATOR = ' - '
const MP3_EXTENSION = '.mp3'
const INVALID_FILENAME_CHAR_PATTERN = /[\\/:*?"<>|]/g
const MAX_FILENAME_PART_LENGTH = 200

/**
 * Elimina caracteres no permitidos en nombres de archivo de Windows/macOS/Linux.
 */
function sanitizeFilenamePart(value: string): string {
  return value
    .replace(INVALID_FILENAME_CHAR_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FILENAME_PART_LENGTH)
}

/**
 * Genera un nombre de archivo con formato `"Artista - Título.mp3"`.
 */
export function buildAudioFilename(artist: string, title: string): string {
  const safeArtist = sanitizeFilenamePart(artist)
  const safeTitle = sanitizeFilenamePart(title)

  if (!safeArtist || !safeTitle) {
    throw new Error('Artista y título son necesarios para renombrar el archivo.')
  }

  return `${safeArtist}${FILENAME_SEPARATOR}${safeTitle}${MP3_EXTENSION}`
}
