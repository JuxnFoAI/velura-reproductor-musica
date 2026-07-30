/** Parser de archivos .lrc y .txt para letras sincronizadas en reproducción. */

import { DEFAULT_LINE_DURATION_SECONDS } from '../lib/lyricsConstants'

import type { LyricsLine, ParsedLyrics } from '../types/lyrics'



const LRC_METADATA_PREFIXES = ['ar', 'ti', 'al', 'by', 'offset', 'length', 're', 've', 'au', 'lr', 'tool']

const LRC_LINE_TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g



/**

 * Convierte minutos, segundos y fracción a segundos totales.

 */

function parseTimestamp(minutes: string, seconds: string, fraction?: string): number {

  const totalMinutes = Number.parseInt(minutes, 10)

  const totalSeconds = Number.parseInt(seconds, 10)



  if (!fraction) {

    return totalMinutes * 60 + totalSeconds

  }



  const normalizedFraction = fraction.length <= 2

    ? Number.parseInt(fraction.padEnd(2, '0'), 10) / 100

    : Number.parseInt(fraction, 10) / 1000



  return totalMinutes * 60 + totalSeconds + normalizedFraction

}



function isMetadataLine(line: string): boolean {

  const metadataMatch = line.match(/^\[([a-z]+):/i)



  if (!metadataMatch) {

    return false

  }



  return LRC_METADATA_PREFIXES.includes(metadataMatch[1].toLowerCase())

}



/**

 * Extrae el primer timestamp y el texto restante de una línea LRC.

 */

function extractLineTimestampAndText(rawLine: string): { startTime: number; text: string } | null {

  const timestampMatch = rawLine.match(/^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/)



  if (!timestampMatch) {

    return null

  }



  const startTime = parseTimestamp(timestampMatch[1], timestampMatch[2], timestampMatch[3])

  const text = rawLine.slice(timestampMatch[0].length).trim()



  return { startTime, text }

}



function resolveLineEndTime(lines: LyricsLine[], index: number, trackDuration?: number): number {

  const nextLine = lines[index + 1]



  if (nextLine) {

    return nextLine.startTime

  }



  if (trackDuration && trackDuration > lines[index].startTime) {

    return trackDuration

  }



  return lines[index].startTime + DEFAULT_LINE_DURATION_SECONDS

}



function parseLrcContent(content: string): ParsedLyrics {

  const rawLines = content.split(/\r?\n/)

  const parsedLines: LyricsLine[] = []



  for (const rawLine of rawLines) {

    const trimmedLine = rawLine.trim()



    if (!trimmedLine || isMetadataLine(trimmedLine)) {

      continue

    }



    const extracted = extractLineTimestampAndText(trimmedLine)



    if (!extracted || !extracted.text) {

      continue

    }



    parsedLines.push({

      text: extracted.text,

      startTime: extracted.startTime,

    })

  }



  parsedLines.sort((left, right) => left.startTime - right.startTime)



  return {

    lines: parsedLines,

    isSynced: parsedLines.length > 0,

  }

}



function parsePlainTextContent(content: string, trackDuration?: number): ParsedLyrics {

  const textLines = content

    .split(/\r?\n/)

    .map((line) => line.trim())

    .filter(Boolean)



  if (textLines.length === 0) {

    return { lines: [], isSynced: false }

  }



  const effectiveDuration = trackDuration && trackDuration > 0

    ? trackDuration

    : textLines.length * DEFAULT_LINE_DURATION_SECONDS



  const segmentDuration = effectiveDuration / textLines.length



  const parsedLines: LyricsLine[] = textLines.map((text, index) => ({

    text,

    startTime: index * segmentDuration,

  }))



  return {

    lines: parsedLines,

    isSynced: false,

  }

}



function contentHasLrcTimestamps(content: string): boolean {

  LRC_LINE_TIMESTAMP_PATTERN.lastIndex = 0

  return LRC_LINE_TIMESTAMP_PATTERN.test(content)

}



/**

 * Parsea contenido de letra según extensión o detección de timestamps LRC.

 */

export function parseLyricsContent(

  content: string,

  extension: '.txt' | '.lrc' | null,

  trackDuration?: number,

): ParsedLyrics {

  const trimmedContent = content.trim()



  if (!trimmedContent) {

    return { lines: [], isSynced: false }

  }



  const shouldParseAsLrc = extension === '.lrc' || contentHasLrcTimestamps(content)



  if (shouldParseAsLrc) {

    return parseLrcContent(trimmedContent)

  }



  return parsePlainTextContent(trimmedContent, trackDuration)

}



/**

 * Encuentra el índice de la línea activa según el tiempo de reproducción.

 * Devuelve -1 si aún no se alcanza el timestamp de la primera línea.

 */

export function findActiveLineIndex(

  lines: LyricsLine[],

  currentTime: number,

  trackDuration?: number,

): number {

  if (lines.length === 0) {

    return -1

  }



  if (currentTime < lines[0].startTime) {

    return -1

  }



  for (let index = 0; index < lines.length; index += 1) {

    const startTime = lines[index].startTime

    const endTime = resolveLineEndTime(lines, index, trackDuration)



    if (currentTime >= startTime && currentTime < endTime) {

      return index

    }

  }



  return lines.length - 1

}



function getVisibleLyricsLines(

  lines: LyricsLine[],

  activeIndex: number,

  count: number,

): { line: LyricsLine; sourceIndex: number }[] {

  if (lines.length === 0) {

    return []

  }



  const startIndex = activeIndex >= 0 ? activeIndex : 0

  const visibleLines: { line: LyricsLine; sourceIndex: number }[] = []



  for (let offset = 0; offset < count; offset += 1) {

    const sourceIndex = startIndex + offset



    if (sourceIndex >= lines.length) {

      break

    }



    visibleLines.push({

      line: lines[sourceIndex],

      sourceIndex,

    })

  }



  return visibleLines

}



/**

 * Devuelve una ventana de líneas centrada en la activa, con contexto anterior y posterior.

 */

export function getCenteredVisibleLyricsLines(

  lines: LyricsLine[],

  activeIndex: number,

  pastCount: number,

  futureCount: number,

): { line: LyricsLine; sourceIndex: number }[] {

  if (lines.length === 0) {

    return []

  }



  const startIndex =

    activeIndex >= 0 ? Math.max(0, activeIndex - pastCount) : 0



  const desiredCount =

    activeIndex >= 0 ? pastCount + 1 + futureCount : futureCount + 1



  return getVisibleLyricsLines(lines, startIndex, desiredCount)

}


