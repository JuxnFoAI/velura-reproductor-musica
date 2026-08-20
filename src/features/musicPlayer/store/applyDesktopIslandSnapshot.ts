/** Aplica un snapshot de la isla flotante al store y a las variables CSS locales. */

import type { DesktopIslandStateSnapshot } from '@shared/desktop'
import type { Track } from '../types'
import { playerStore } from './playerStore'

function toOverlayTrack(snapshot: DesktopIslandStateSnapshot): Track | null {
  if (!snapshot.currentTrack) {
    return null
  }

  return {
    id: snapshot.currentTrack.id,
    title: snapshot.currentTrack.title,
    artist: snapshot.currentTrack.artist,
    duration: snapshot.currentTrack.duration,
    src: '',
    coverUrl: snapshot.currentTrack.coverUrl,
  }
}

export function applyDesktopIslandSnapshot(snapshot: DesktopIslandStateSnapshot): void {
  const root = document.documentElement

  root.style.setProperty('--dynamic-island-background', snapshot.backgroundColor)
  root.style.setProperty('--player-text', snapshot.textColor)
  root.style.setProperty('--player-text-muted', snapshot.textMutedColor)
  root.style.setProperty('--player-play-button', snapshot.playButtonColor)

  playerStore.setState({
    currentTrack: toOverlayTrack(snapshot),
    status: snapshot.status,
    currentTime: snapshot.currentTime,
    duration: snapshot.duration,
    volume: snapshot.volume,
    isMuted: snapshot.isMuted,
    isShuffle: snapshot.isShuffle,
    repeatMode: snapshot.repeatMode,
  })
}
