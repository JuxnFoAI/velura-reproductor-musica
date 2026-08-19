/** Tipos IPC de la isla dinámica flotante en el escritorio. */

export const DESKTOP_ISLAND_QUERY_PARAM = 'veluraWindow'
export const DESKTOP_ISLAND_QUERY_VALUE = 'dynamic-island'

export interface DesktopIslandWindowShapeRect {
  x: number
  y: number
  width: number
  height: number
}

export type DesktopIslandPlayerStatus = 'idle' | 'playing' | 'paused' | 'loading' | 'error'
export type DesktopIslandRepeatMode = 'none' | 'one' | 'all'

export interface DesktopIslandTrackSnapshot {
  id: string
  title: string
  artist: string
  duration: number
  coverUrl?: string
}

export interface DesktopIslandStateSnapshot {
  currentTrack: DesktopIslandTrackSnapshot | null
  status: DesktopIslandPlayerStatus
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffle: boolean
  repeatMode: DesktopIslandRepeatMode
  isEnabled: boolean
  backgroundColor: string
  textColor: string
  textMutedColor: string
  playButtonColor: string
}

export type DesktopIslandCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'seek'; time: number }
  | { type: 'setVolume'; volume: number }
  | { type: 'toggleMute' }
  | { type: 'toggleShuffle' }
  | { type: 'setRepeatMode'; mode: DesktopIslandRepeatMode }

function isRepeatMode(value: unknown): value is DesktopIslandRepeatMode {
  return value === 'none' || value === 'one' || value === 'all'
}

function isPlayerStatus(value: unknown): value is DesktopIslandPlayerStatus {
  return (
    value === 'idle' ||
    value === 'playing' ||
    value === 'paused' ||
    value === 'loading' ||
    value === 'error'
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTrackSnapshot(value: unknown): value is DesktopIslandTrackSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const track = value as Partial<DesktopIslandTrackSnapshot>

  return (
    isNonEmptyString(track.id) &&
    typeof track.title === 'string' &&
    typeof track.artist === 'string' &&
    isFiniteNumber(track.duration)
  )
}

export function isDesktopIslandStateSnapshot(
  value: unknown,
): value is DesktopIslandStateSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const snapshot = value as Partial<DesktopIslandStateSnapshot>
  const hasValidTrack = snapshot.currentTrack === null || isTrackSnapshot(snapshot.currentTrack)

  return (
    hasValidTrack &&
    isPlayerStatus(snapshot.status) &&
    isFiniteNumber(snapshot.currentTime) &&
    isFiniteNumber(snapshot.duration) &&
    isFiniteNumber(snapshot.volume) &&
    typeof snapshot.isMuted === 'boolean' &&
    typeof snapshot.isShuffle === 'boolean' &&
    isRepeatMode(snapshot.repeatMode) &&
    typeof snapshot.isEnabled === 'boolean' &&
    isNonEmptyString(snapshot.backgroundColor) &&
    isNonEmptyString(snapshot.textColor) &&
    isNonEmptyString(snapshot.textMutedColor) &&
    isNonEmptyString(snapshot.playButtonColor)
  )
}

export function isDesktopIslandCommand(value: unknown): value is DesktopIslandCommand {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false
  }

  const command = value as { type: string; time?: unknown; volume?: unknown; mode?: unknown }

  if (command.type === 'seek') {
    return isFiniteNumber(command.time)
  }

  if (command.type === 'setVolume') {
    return isFiniteNumber(command.volume)
  }

  if (command.type === 'setRepeatMode') {
    return isRepeatMode(command.mode)
  }

  return (
    command.type === 'play' ||
    command.type === 'pause' ||
    command.type === 'next' ||
    command.type === 'previous' ||
    command.type === 'toggleMute' ||
    command.type === 'toggleShuffle'
  )
}
