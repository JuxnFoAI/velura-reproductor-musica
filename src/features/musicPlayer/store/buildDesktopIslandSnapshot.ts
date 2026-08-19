/** Construye el snapshot serializable de la isla dinámica para el overlay de escritorio. */

import {
  DEFAULT_DYNAMIC_ISLAND_COLOR_ID,
  DEFAULT_PLAYER_BUTTON_COLOR_ID,
  DEFAULT_PLAYER_LETTER_COLOR_ID,
  getDynamicIslandColorById,
  getPlayerButtonColorById,
  getPlayerLetterColorById,
  useCustomizationStore,
} from '@features/customization'
import type { DesktopIslandStateSnapshot } from '@shared/desktop'
import type { Track } from '../types'
import { playerStore } from './playerStore'

const FALLBACK_ISLAND_BACKGROUND = '#000000'
const FALLBACK_LETTER_TEXT = '#f1f5f9'
const FALLBACK_LETTER_TEXT_MUTED = '#cbd5e1'
const FALLBACK_PLAY_BUTTON = '#4bb8fa'

function resolveIslandCoverUrl(track: Track): string | undefined {
  const relativePath = track.coverRelativePath
  const musicLibrary = window.veluraMusicLibrary

  if (relativePath && musicLibrary) {
    return musicLibrary.buildCoverUrl(relativePath)
  }

  if (track.coverUrl && !track.coverUrl.startsWith('blob:')) {
    return track.coverUrl
  }

  return undefined
}

export function buildDesktopIslandSnapshot(): DesktopIslandStateSnapshot {
  const player = playerStore.getState()
  const customization = useCustomizationStore.getState()
  const islandColor =
    getDynamicIslandColorById(customization.appliedDynamicIslandColorId) ??
    getDynamicIslandColorById(DEFAULT_DYNAMIC_ISLAND_COLOR_ID)
  const letterColor =
    getPlayerLetterColorById(customization.appliedPlayerLetterColorId) ??
    getPlayerLetterColorById(DEFAULT_PLAYER_LETTER_COLOR_ID)
  const buttonColor =
    getPlayerButtonColorById(customization.appliedPlayerButtonColorId) ??
    getPlayerButtonColorById(DEFAULT_PLAYER_BUTTON_COLOR_ID)
  const currentTrack = player.currentTrack

  return {
    currentTrack: currentTrack
      ? {
          id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          duration: currentTrack.duration,
          coverUrl: resolveIslandCoverUrl(currentTrack),
        }
      : null,
    status: player.status,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffle: player.isShuffle,
    repeatMode: player.repeatMode,
    isEnabled: customization.isDynamicIslandEnabled,
    backgroundColor: islandColor?.background ?? FALLBACK_ISLAND_BACKGROUND,
    textColor: letterColor?.text ?? FALLBACK_LETTER_TEXT,
    textMutedColor: letterColor?.textMuted ?? FALLBACK_LETTER_TEXT_MUTED,
    playButtonColor: buttonColor?.value ?? FALLBACK_PLAY_BUTTON,
  }
}
