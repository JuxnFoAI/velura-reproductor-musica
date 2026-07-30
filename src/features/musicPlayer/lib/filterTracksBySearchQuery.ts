/** Filtra pistas por título, artista o álbum según la consulta de búsqueda. */

import type { Track } from '../types'

/**
 * Normaliza texto para comparaciones de búsqueda insensibles a mayúsculas y acentos.
 */
function normalizeSearchText(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function getTrackSearchableText(track: Track): string {
  return normalizeSearchText([track.title, track.artist, track.album ?? ''].join(' '))
}

/**
 * Filtra pistas cuyo título, artista o álbum coinciden con la consulta.
 * Soporta búsqueda por varias palabras: todas deben aparecer en los metadatos.
 */
export function filterTracksBySearchQuery(tracks: Track[], searchQuery: string): Track[] {
  const normalizedQuery = normalizeSearchText(searchQuery)

  if (normalizedQuery.length === 0) {
    return tracks
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean)

  return tracks.filter((track) => {
    const searchableText = getTrackSearchableText(track)
    return queryTokens.every((token) => searchableText.includes(token))
  })
}
