/** Atajos de teclado globales para controlar el reproductor. */
import { useEffect } from 'react'
import { playerStore } from '../store/playerStore'

const VOLUME_STEP = 0.1

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Registra atajos de teclado globales para las acciones principales del reproductor.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (shouldIgnoreShortcut(event)) {
        return
      }

      const storeState = playerStore.getState()
      const { play, pause, next, previous, setVolume, toggleMute, toggleShuffle } = storeState
      const { status, volume, currentTrack } = storeState
      const hasActiveTrack = currentTrack !== null

      switch (event.code) {
        case 'Space':
          if (!hasActiveTrack) {
            return
          }

          event.preventDefault()
          if (status === 'playing') {
            pause()
          } else {
            play()
          }
          break
        case 'ArrowRight':
          if (!hasActiveTrack) {
            return
          }

          event.preventDefault()
          next({ wrapQueue: true })
          break
        case 'ArrowLeft':
          if (!hasActiveTrack) {
            return
          }

          event.preventDefault()
          previous()
          break
        case 'ArrowUp':
          if (!hasActiveTrack) {
            return
          }

          event.preventDefault()
          setVolume(volume + VOLUME_STEP)
          break
        case 'ArrowDown':
          if (!hasActiveTrack) {
            return
          }

          event.preventDefault()
          setVolume(volume - VOLUME_STEP)
          break
        case 'KeyM':
          if (!hasActiveTrack) {
            return
          }

          toggleMute()
          break
        case 'KeyS':
          if (!hasActiveTrack) {
            return
          }

          toggleShuffle()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}

function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  const target = event.target

  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (INPUT_TAGS.has(target.tagName)) {
    return true
  }

  return target.isContentEditable
}
