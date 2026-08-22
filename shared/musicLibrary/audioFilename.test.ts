/** Tests de parseo y construcción de nombres `"Artista - Título.mp3"`. */
import { describe, expect, it } from 'vitest'
import { buildAudioFilename } from './buildAudioFilename'
import { parseAudioFilename } from './parseAudioFilename'

const FALLBACK_ARTIST = 'Desconocido'
const MAX_FILENAME_PART_LENGTH = 200

describe('parseAudioFilename', () => {
  it('separa artista y título con el formato convencionado', () => {
    expect(parseAudioFilename('Duodedos - AFTER.mp3')).toEqual({
      artist: 'Duodedos',
      title: 'AFTER',
    })
  })

  it('usa el primer separador cuando el título también contiene " - "', () => {
    expect(parseAudioFilename('Artista - Título - Remix.mp3')).toEqual({
      artist: 'Artista',
      title: 'Título - Remix',
    })
  })

  it('asigna artista desconocido si falta el separador', () => {
    expect(parseAudioFilename('SoloTitulo.mp3')).toEqual({
      artist: FALLBACK_ARTIST,
      title: 'SoloTitulo',
    })
  })

  it('asigna artista desconocido si el artista o el título quedan vacíos', () => {
    expect(parseAudioFilename(' - Título.mp3')).toEqual({
      artist: FALLBACK_ARTIST,
      title: ' - Título',
    })
    expect(parseAudioFilename('Artista - .mp3')).toEqual({
      artist: FALLBACK_ARTIST,
      title: 'Artista - ',
    })
  })

  it('conserva el nombre completo si no hay extensión', () => {
    expect(parseAudioFilename('Artista - Título')).toEqual({
      artist: 'Artista',
      title: 'Título',
    })
  })
})

describe('buildAudioFilename', () => {
  it('genera un nombre MP3 con artista y título', () => {
    expect(buildAudioFilename('Duodedos', 'AFTER')).toBe('Duodedos - AFTER.mp3')
  })

  it('elimina caracteres no válidos en Windows y comprime espacios', () => {
    expect(buildAudioFilename('Art/ista', 'Tít*ulo  extra')).toBe('Artista - Título extra.mp3')
  })

  it('trunca cada parte al máximo permitido', () => {
    const oversizedPart = 'a'.repeat(MAX_FILENAME_PART_LENGTH + 20)
    const truncatedPart = 'a'.repeat(MAX_FILENAME_PART_LENGTH)
    const filename = buildAudioFilename(oversizedPart, oversizedPart)

    expect(filename).toBe(`${truncatedPart} - ${truncatedPart}.mp3`)
  })

  it('lanza si artista o título quedan vacíos tras sanitizar', () => {
    expect(() => buildAudioFilename('   ', 'Título')).toThrow(
      'Artista y título son necesarios para renombrar el archivo.',
    )
    expect(() => buildAudioFilename('Artista', '???')).toThrow(
      'Artista y título son necesarios para renombrar el archivo.',
    )
  })
})
