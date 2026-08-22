/** Type guards de payloads HTTP de la biblioteca musical. */

import { LYRICS_EXTENSIONS } from './constants'
import type {
  DeleteTrackRequest,
  LyricsExtension,
  MusicFileEntry,
  MusicLibraryResponse,
  RenameTrackRequest,
  RenameTrackResponse,
  SaveTrackCoverRequest,
  SaveTrackCoverResponse,
  SaveTrackLyricsRequest,
  SaveTrackLyricsResponse,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || isNullableString(value)
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value)
}

function isLyricsExtension(value: unknown): value is LyricsExtension {
  return typeof value === 'string' && LYRICS_EXTENSIONS.some((extension) => extension === value)
}

export function isMusicLibraryErrorPayload(value: unknown): value is { message: string } {
  return isRecord(value) && typeof value.message === 'string'
}

export function isMusicFileEntry(value: unknown): value is MusicFileEntry {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.filename === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    typeof value.relativePath === 'string' &&
    isFiniteNumber(value.duration) &&
    isFiniteNumber(value.fileSizeBytes) &&
    isNullableString(value.coverRelativePath) &&
    isNullableString(value.lyricsRelativePath) &&
    isNullableFiniteNumber(value.replayGainTrackDb)
  )
}

export function isMusicLibraryResponse(value: unknown): value is MusicLibraryResponse {
  return (
    isRecord(value) &&
    isNullableString(value.musicDirectory) &&
    Array.isArray(value.tracks) &&
    value.tracks.every(isMusicFileEntry)
  )
}

export function isSaveTrackCoverRequest(value: unknown): value is SaveTrackCoverRequest {
  return (
    isRecord(value) &&
    typeof value.trackRelativePath === 'string' &&
    isNullableString(value.coverRelativePath) &&
    typeof value.imageDataUrl === 'string'
  )
}

export function isSaveTrackCoverResponse(value: unknown): value is SaveTrackCoverResponse {
  return isRecord(value) && typeof value.coverRelativePath === 'string'
}

export function isSaveTrackLyricsRequest(value: unknown): value is SaveTrackLyricsRequest {
  return (
    isRecord(value) &&
    typeof value.trackRelativePath === 'string' &&
    typeof value.lyricsContent === 'string' &&
    isLyricsExtension(value.lyricsExtension) &&
    isOptionalNullableString(value.existingLyricsRelativePath) &&
    isOptionalNullableString(value.sourceLyricsFilename)
  )
}

export function isSaveTrackLyricsResponse(value: unknown): value is SaveTrackLyricsResponse {
  return isRecord(value) && typeof value.lyricsRelativePath === 'string'
}

export function isRenameTrackRequest(value: unknown): value is RenameTrackRequest {
  return (
    isRecord(value) &&
    typeof value.trackRelativePath === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    isNullableString(value.coverRelativePath)
  )
}

export function isRenameTrackResponse(value: unknown): value is RenameTrackResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.relativePath === 'string' &&
    typeof value.filename === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    isNullableString(value.coverRelativePath) &&
    isNullableString(value.lyricsRelativePath)
  )
}

export function isDeleteTrackRequest(value: unknown): value is DeleteTrackRequest {
  return (
    isRecord(value) &&
    typeof value.trackRelativePath === 'string' &&
    isNullableString(value.coverRelativePath) &&
    isNullableString(value.lyricsRelativePath)
  )
}
