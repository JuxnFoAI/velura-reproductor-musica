/** Tests del parser LRC/TXT y de la línea activa según el tiempo. */
import { describe, expect, it } from 'vitest'
import { DEFAULT_LINE_DURATION_SECONDS } from '../lib/lyricsConstants'
import { findActiveLineIndex, parseLyricsContent } from './lrcParser'

const SYNCED_LRC = `[ti:AFTER]
[ar:Duodedos]
[00:00.00]Intro
[00:12.50]Primera línea
[00:25.00]Segunda línea
`

describe('parseLyricsContent', () => {
  it('devuelve letra vacía si el contenido está en blanco', () => {
    expect(parseLyricsContent('   ', '.lrc')).toEqual({ lines: [], isSynced: false })
  })

  it('parsea timestamps LRC y omite metadatos', () => {
    const parsedLyrics = parseLyricsContent(SYNCED_LRC, '.lrc')

    expect(parsedLyrics.isSynced).toBe(true)
    expect(parsedLyrics.lines).toEqual([
      { text: 'Intro', startTime: 0 },
      { text: 'Primera línea', startTime: 12.5 },
      { text: 'Segunda línea', startTime: 25 },
    ])
  })

  it('ordena líneas aunque el archivo no venga cronológico', () => {
    const parsedLyrics = parseLyricsContent(
      `[00:20.00]Después\n[00:05.00]Antes`,
      '.lrc',
    )

    expect(parsedLyrics.lines.map((line) => line.text)).toEqual(['Antes', 'Después'])
  })

  it('acepta centésimas de un dígito y milisegundos de tres', () => {
    const parsedLyrics = parseLyricsContent(
      `[00:01.5]Corto\n[00:02.250]Largo`,
      '.lrc',
    )

    expect(parsedLyrics.lines[0].startTime).toBe(1.5)
    expect(parsedLyrics.lines[1].startTime).toBe(2.25)
  })

  it('detecta LRC en un .txt si hay timestamps', () => {
    const parsedLyrics = parseLyricsContent('[00:03.00]Línea', '.txt')

    expect(parsedLyrics.isSynced).toBe(true)
    expect(parsedLyrics.lines).toEqual([{ text: 'Línea', startTime: 3 }])
  })

  it('reparte un .txt plano a lo largo de la duración de la pista', () => {
    const trackDurationSeconds = 10
    const parsedLyrics = parseLyricsContent('Uno\nDos', '.txt', trackDurationSeconds)

    expect(parsedLyrics.isSynced).toBe(false)
    expect(parsedLyrics.lines).toEqual([
      { text: 'Uno', startTime: 0 },
      { text: 'Dos', startTime: 5 },
    ])
  })

  it('usa la duración por defecto por línea si el .txt no trae duración de pista', () => {
    const parsedLyrics = parseLyricsContent('Uno\nDos', '.txt')

    expect(parsedLyrics.lines[0].startTime).toBe(0)
    expect(parsedLyrics.lines[1].startTime).toBe(DEFAULT_LINE_DURATION_SECONDS)
  })
})

describe('findActiveLineIndex', () => {
  const lines = [
    { text: 'Intro', startTime: 0 },
    { text: 'Estrofa', startTime: 12.5 },
    { text: 'Cierre', startTime: 25 },
  ]

  it('devuelve -1 si aún no empieza la primera línea', () => {
    expect(findActiveLineIndex(lines, -0.1)).toBe(-1)
  })

  it('devuelve la línea cuyo rango contiene el tiempo actual', () => {
    expect(findActiveLineIndex(lines, 0)).toBe(0)
    expect(findActiveLineIndex(lines, 12.49)).toBe(0)
    expect(findActiveLineIndex(lines, 12.5)).toBe(1)
    expect(findActiveLineIndex(lines, 24.9)).toBe(1)
  })

  it('se queda en la última línea después de su inicio', () => {
    expect(findActiveLineIndex(lines, 40)).toBe(2)
  })

  it('devuelve -1 si no hay líneas', () => {
    expect(findActiveLineIndex([], 10)).toBe(-1)
  })
})
