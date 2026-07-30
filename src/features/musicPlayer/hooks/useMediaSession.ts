/** Sincronización del reproductor con la Media Session API del navegador. */
import { useEffect } from 'react'
import { playerStore, usePlayerStore } from '../store/playerStore'

/**
 * Expone metadatos y controles del reproductor en la Media Session del sistema.
 */
export function useMediaSession(): void {
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    navigator.mediaSession.setActionHandler('play', () => {
      playerStore.getState().play()
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      playerStore.getState().pause()
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playerStore.getState().next({ wrapQueue: true })
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playerStore.getState().previous()
    })

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
    }
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    if (!currentTrack) {
      navigator.mediaSession.metadata = null
      return
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album ?? '',
      artwork: buildArtwork(currentTrack.coverUrl),
    })
  }, [currentTrack])
}

function buildArtwork(coverUrl?: string): MediaImage[] {
  if (!coverUrl) {
    return []
  }

  return [
    {
      src: coverUrl,
      sizes: '512x512',
      type: 'image/png',
    },
  ]
}
