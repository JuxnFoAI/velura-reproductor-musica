/** Tests de la frontera de rutas relativas dentro de mi-musica. */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  isRelativePathWithinMusicDirectory,
  resolveAbsolutePathWithinMusicDirectory,
  resolveSafeAudioPath,
  resolveSafeCoverPath,
  resolveSafeLyricsPath,
  resolveValidatedCoverRelativePath,
  resolveValidatedLyricsRelativePath,
  sanitizeCoverOverrideFilename,
  sanitizeCoverOverrideKey,
} from './safePaths'

const MUSIC_DIRECTORY = path.resolve('/virtual-mi-musica')
const ABSOLUTE_OUTSIDE_PATH = path.resolve('/tmp/outside.mp3')
const TRAVERSAL_PATHS = ['../secret.mp3', '../../secret.mp3', 'carpeta/../../fuera.mp3'] as const

function writeLibraryFile(musicDirectory: string, relativePath: string): string {
  const absolutePath = path.join(musicDirectory, relativePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, 'fixture')
  return absolutePath
}

describe('isRelativePathWithinMusicDirectory', () => {
  it('acepta rutas relativas dentro de la raíz', () => {
    expect(isRelativePathWithinMusicDirectory(MUSIC_DIRECTORY, 'cancion.mp3')).toBe(true)
    expect(isRelativePathWithinMusicDirectory(MUSIC_DIRECTORY, 'sub/cancion.mp3')).toBe(true)
  })

  it('acepta un .. que permanece dentro de la raíz', () => {
    expect(isRelativePathWithinMusicDirectory(MUSIC_DIRECTORY, 'sub/../cancion.mp3')).toBe(true)
  })

  it.each(TRAVERSAL_PATHS)('rechaza traversal %s', (requestedPath) => {
    expect(isRelativePathWithinMusicDirectory(MUSIC_DIRECTORY, requestedPath)).toBe(false)
  })

  it('rechaza rutas absolutas', () => {
    expect(isRelativePathWithinMusicDirectory(MUSIC_DIRECTORY, ABSOLUTE_OUTSIDE_PATH)).toBe(false)
  })
})

describe('resolveAbsolutePathWithinMusicDirectory', () => {
  it('resuelve una ruta relativa válida', () => {
    expect(resolveAbsolutePathWithinMusicDirectory(MUSIC_DIRECTORY, 'cancion.mp3')).toBe(
      path.resolve(MUSIC_DIRECTORY, 'cancion.mp3'),
    )
  })

  it('devuelve null ante traversal o ruta absoluta', () => {
    expect(resolveAbsolutePathWithinMusicDirectory(MUSIC_DIRECTORY, '../secret.mp3')).toBeNull()
    expect(resolveAbsolutePathWithinMusicDirectory(MUSIC_DIRECTORY, ABSOLUTE_OUTSIDE_PATH)).toBeNull()
  })
})

describe('resolveValidatedCoverRelativePath', () => {
  it('acepta extensiones de portada permitidas', () => {
    expect(resolveValidatedCoverRelativePath(MUSIC_DIRECTORY, 'portadas/cover.jpg')).toBe(
      path.normalize('portadas/cover.jpg'),
    )
    expect(resolveValidatedCoverRelativePath(MUSIC_DIRECTORY, 'cover.PNG')).toBe('cover.PNG')
  })

  it.each(['cover.gif', 'cover.bmp', 'cover.svg', 'cover.mp3', 'cover'])(
    'rechaza extensión no permitida %s',
    (requestedPath) => {
      expect(resolveValidatedCoverRelativePath(MUSIC_DIRECTORY, requestedPath)).toBeNull()
    },
  )

  it('rechaza traversal y rutas absolutas aunque la extensión sea válida', () => {
    expect(resolveValidatedCoverRelativePath(MUSIC_DIRECTORY, '../cover.jpg')).toBeNull()
    expect(
      resolveValidatedCoverRelativePath(MUSIC_DIRECTORY, path.resolve('/tmp/cover.jpg')),
    ).toBeNull()
  })
})

describe('resolveValidatedLyricsRelativePath', () => {
  it('acepta extensiones de letra permitidas', () => {
    expect(resolveValidatedLyricsRelativePath(MUSIC_DIRECTORY, 'letras/tema.lrc')).toBe(
      path.normalize('letras/tema.lrc'),
    )
    expect(resolveValidatedLyricsRelativePath(MUSIC_DIRECTORY, 'tema.TXT')).toBe('tema.TXT')
  })

  it.each(['tema.md', 'tema.srt', 'tema.mp3', 'tema'])(
    'rechaza extensión no permitida %s',
    (requestedPath) => {
      expect(resolveValidatedLyricsRelativePath(MUSIC_DIRECTORY, requestedPath)).toBeNull()
    },
  )
})

describe('resolveSafe existing files', () => {
  let libraryRoot = ''
  let musicDirectory = ''

  beforeEach(() => {
    libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'velura-safe-paths-'))
    musicDirectory = path.join(libraryRoot, 'mi-musica')
    fs.mkdirSync(musicDirectory)
  })

  afterEach(() => {
    fs.rmSync(libraryRoot, { recursive: true, force: true })
  })

  it('resuelve un MP3 existente dentro de la raíz', () => {
    const audioPath = writeLibraryFile(musicDirectory, 'cancion.mp3')

    expect(resolveSafeAudioPath(musicDirectory, 'cancion.mp3')).toBe(audioPath)
  })

  it('rechaza un archivo existente con extensión de audio no permitida', () => {
    writeLibraryFile(musicDirectory, 'cancion.flac')

    expect(resolveSafeAudioPath(musicDirectory, 'cancion.flac')).toBeNull()
  })

  it('rechaza portadas y letras con extensión no permitida aunque el archivo exista', () => {
    writeLibraryFile(musicDirectory, 'cover.gif')
    writeLibraryFile(musicDirectory, 'letra.md')

    expect(resolveSafeCoverPath(musicDirectory, 'cover.gif')).toBeNull()
    expect(resolveSafeLyricsPath(musicDirectory, 'letra.md')).toBeNull()
  })

  it('rechaza traversal hacia un MP3 existente fuera de la raíz', () => {
    const outsideAudioPath = path.join(libraryRoot, 'secret.mp3')
    fs.writeFileSync(outsideAudioPath, 'fixture')

    expect(resolveSafeAudioPath(musicDirectory, '../secret.mp3')).toBeNull()
    expect(resolveSafeAudioPath(musicDirectory, outsideAudioPath)).toBeNull()
  })

  it('resuelve portada y letra existentes con extensión permitida', () => {
    const coverPath = writeLibraryFile(musicDirectory, 'portadas/cover.webp')
    const lyricsPath = writeLibraryFile(musicDirectory, 'letras/tema.lrc')

    expect(resolveSafeCoverPath(musicDirectory, 'portadas/cover.webp')).toBe(coverPath)
    expect(resolveSafeLyricsPath(musicDirectory, 'letras/tema.lrc')).toBe(lyricsPath)
  })
})

describe('sanitizeCoverOverrideFilename', () => {
  it('acepta un nombre de portada plano con extensión permitida', () => {
    expect(sanitizeCoverOverrideFilename('cover.jpg')).toBe('cover.jpg')
  })

  it('rechaza traversal, rutas y extensiones no permitidas', () => {
    expect(sanitizeCoverOverrideFilename('../cover.jpg')).toBeNull()
    expect(sanitizeCoverOverrideFilename('carpeta/cover.jpg')).toBeNull()
    expect(sanitizeCoverOverrideFilename('cover.gif')).toBeNull()
  })
})

describe('sanitizeCoverOverrideKey', () => {
  it('acepta un nombre MP3 plano', () => {
    expect(sanitizeCoverOverrideKey('Artista - Titulo.mp3')).toBe('Artista - Titulo.mp3')
  })

  it('rechaza traversal, rutas y extensiones no permitidas', () => {
    expect(sanitizeCoverOverrideKey('../cancion.mp3')).toBeNull()
    expect(sanitizeCoverOverrideKey('carpeta/cancion.mp3')).toBeNull()
    expect(sanitizeCoverOverrideKey('cancion.flac')).toBeNull()
  })
})
