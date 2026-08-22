/** Tests de type guards de payloads HTTP de la biblioteca musical. */

import { describe, expect, it } from 'vitest'

import {
  isDeleteTrackRequest,
  isMusicFileEntry,
  isMusicLibraryErrorPayload,
  isMusicLibraryResponse,
  isRenameTrackRequest,
  isRenameTrackResponse,
  isSaveTrackCoverRequest,
  isSaveTrackCoverResponse,
  isSaveTrackLyricsRequest,
  isSaveTrackLyricsResponse,
} from './payloadGuards'
import type { MusicFileEntry } from './types'

const VALID_TRACK: MusicFileEntry = {
  id: 'track-1',
  filename: 'Artista - Titulo.mp3',
  title: 'Titulo',
  artist: 'Artista',
  relativePath: 'Artista - Titulo.mp3',
  duration: 180,
  fileSizeBytes: 4096,
  coverRelativePath: 'portadas/cover.jpg',
  lyricsRelativePath: null,
  replayGainTrackDb: -7.5,
}

const INVALID_VALUES = [null, undefined, 12, 'texto', [], true] as const

describe('isMusicFileEntry', () => {
  it('acepta una pista con todos los campos válidos', () => {
    expect(isMusicFileEntry(VALID_TRACK)).toBe(true)
    expect(isMusicFileEntry({ ...VALID_TRACK, replayGainTrackDb: null })).toBe(true)
  })

  it.each(INVALID_VALUES)('rechaza el valor %s', (value) => {
    expect(isMusicFileEntry(value)).toBe(false)
  })

  it('rechaza duration o replayGain no finitos', () => {
    expect(isMusicFileEntry({ ...VALID_TRACK, duration: Number.NaN })).toBe(false)
    expect(isMusicFileEntry({ ...VALID_TRACK, replayGainTrackDb: Number.POSITIVE_INFINITY })).toBe(
      false,
    )
  })
})

describe('isMusicLibraryResponse', () => {
  it('acepta una biblioteca vacía o con pistas válidas', () => {
    expect(isMusicLibraryResponse({ musicDirectory: null, tracks: [] })).toBe(true)
    expect(
      isMusicLibraryResponse({ musicDirectory: '/mi-musica', tracks: [VALID_TRACK] }),
    ).toBe(true)
  })

  it('rechaza una pista malformada dentro del listado', () => {
    expect(
      isMusicLibraryResponse({
        musicDirectory: '/mi-musica',
        tracks: [{ ...VALID_TRACK, id: 1 }],
      }),
    ).toBe(false)
  })
})

describe('isSaveTrackCoverRequest', () => {
  const validRequest = {
    trackRelativePath: 'cancion.mp3',
    coverRelativePath: null,
    imageDataUrl: 'data:image/jpeg;base64,abc',
  }

  it('acepta coverRelativePath nulo o string', () => {
    expect(isSaveTrackCoverRequest(validRequest)).toBe(true)
    expect(isSaveTrackCoverRequest({ ...validRequest, coverRelativePath: 'cover.jpg' })).toBe(true)
  })

  it.each(INVALID_VALUES)('rechaza el valor %s', (value) => {
    expect(isSaveTrackCoverRequest(value)).toBe(false)
  })
})

describe('isSaveTrackCoverResponse', () => {
  it('exige coverRelativePath string', () => {
    expect(isSaveTrackCoverResponse({ coverRelativePath: 'portadas/cover.jpg' })).toBe(true)
    expect(isSaveTrackCoverResponse({ coverRelativePath: null })).toBe(false)
  })
})

describe('isSaveTrackLyricsRequest', () => {
  const validRequest = {
    trackRelativePath: 'cancion.mp3',
    lyricsContent: '[00:01.00]Hola',
    lyricsExtension: '.lrc',
  }

  it('acepta extensión .txt o .lrc y campos opcionales', () => {
    expect(isSaveTrackLyricsRequest(validRequest)).toBe(true)
    expect(
      isSaveTrackLyricsRequest({
        ...validRequest,
        lyricsExtension: '.txt',
        existingLyricsRelativePath: 'letras/cancion.txt',
        sourceLyricsFilename: 'otra.txt',
      }),
    ).toBe(true)
  })

  it('rechaza una extensión de letra no permitida', () => {
    expect(isSaveTrackLyricsRequest({ ...validRequest, lyricsExtension: '.md' })).toBe(false)
  })
})

describe('isSaveTrackLyricsResponse', () => {
  it('exige lyricsRelativePath string', () => {
    expect(isSaveTrackLyricsResponse({ lyricsRelativePath: 'letras/cancion.lrc' })).toBe(true)
    expect(isSaveTrackLyricsResponse({})).toBe(false)
  })
})

describe('isRenameTrackRequest', () => {
  it('acepta el payload de renombrado', () => {
    expect(
      isRenameTrackRequest({
        trackRelativePath: 'cancion.mp3',
        title: 'Titulo',
        artist: 'Artista',
        coverRelativePath: null,
      }),
    ).toBe(true)
  })

  it('rechaza title o artist que no son string', () => {
    expect(
      isRenameTrackRequest({
        trackRelativePath: 'cancion.mp3',
        title: 1,
        artist: 'Artista',
        coverRelativePath: null,
      }),
    ).toBe(false)
  })
})

describe('isRenameTrackResponse', () => {
  it('acepta la respuesta de renombrado', () => {
    expect(
      isRenameTrackResponse({
        id: 'track-2',
        relativePath: 'Artista - Titulo.mp3',
        filename: 'Artista - Titulo.mp3',
        title: 'Titulo',
        artist: 'Artista',
        coverRelativePath: null,
        lyricsRelativePath: null,
      }),
    ).toBe(true)
  })
})

describe('isDeleteTrackRequest', () => {
  it('acepta rutas de assets nulas o string', () => {
    expect(
      isDeleteTrackRequest({
        trackRelativePath: 'cancion.mp3',
        coverRelativePath: null,
        lyricsRelativePath: 'letras/cancion.lrc',
      }),
    ).toBe(true)
  })

  it('rechaza payloads sin trackRelativePath', () => {
    expect(
      isDeleteTrackRequest({
        coverRelativePath: null,
        lyricsRelativePath: null,
      }),
    ).toBe(false)
  })
})

describe('isMusicLibraryErrorPayload', () => {
  it('acepta un objeto con message string', () => {
    expect(isMusicLibraryErrorPayload({ message: 'Portada no encontrada.' })).toBe(true)
    expect(isMusicLibraryErrorPayload({ message: 400 })).toBe(false)
    expect(isMusicLibraryErrorPayload(null)).toBe(false)
  })
})
