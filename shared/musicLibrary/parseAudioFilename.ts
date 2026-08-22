/** Extrae título y artista a partir del nombre de un archivo de audio. */

const UNKNOWN_ARTIST = 'Desconocido'
const FILENAME_SEPARATOR = ' - '

/**
 * Parsea nombres con formato `"Artista - Título.mp3"`.
 * @param filename - Nombre del archivo incluyendo extensión.
 */
export function parseAudioFilename(filename: string): { title: string; artist: string } {
  const nameWithoutExtension = removeFileExtension(filename)
  const separatorIndex = nameWithoutExtension.indexOf(FILENAME_SEPARATOR)

  if (separatorIndex === -1) {
    return {
      title: nameWithoutExtension,
      artist: UNKNOWN_ARTIST,
    }
  }

  const artist = nameWithoutExtension.slice(0, separatorIndex).trim()
  const title = nameWithoutExtension.slice(separatorIndex + FILENAME_SEPARATOR.length).trim()

  if (!artist || !title) {
    return {
      title: nameWithoutExtension,
      artist: UNKNOWN_ARTIST,
    }
  }

  return { title, artist }
}

function removeFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')

  if (lastDotIndex <= 0) {
    return filename
  }

  return filename.slice(0, lastDotIndex)
}
