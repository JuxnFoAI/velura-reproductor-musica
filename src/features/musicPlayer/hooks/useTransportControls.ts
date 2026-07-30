/** Hook compartido para los controles de transporte del reproductor. */
import { useCallback } from 'react'
import { Repeat, Repeat1 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RepeatMode } from '@types'
import { usePlayerStore } from '../store/playerStore'

const REPEAT_CYCLE: RepeatMode[] = ['none', 'all', 'one']

export const REPEAT_LABELS: Record<RepeatMode, string> = {
  none: 'Repetición desactivada',
  all: 'Repetir cola',
  one: 'Repetir pista actual',
}

interface TransportControlsState {
  isDisabled: boolean
  isPlaying: boolean
  isShuffle: boolean
  repeatMode: RepeatMode
  RepeatIcon: LucideIcon
  repeatLabel: string
  toggleShuffle: () => void
  previous: () => void
  next: () => void
  cycleRepeatMode: () => void
  handlePlayPause: () => void
}

/**
 * Centraliza el estado y las acciones de shuffle, repeat y play/pause.
 */
export function useTransportControls(): TransportControlsState {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const status = usePlayerStore((state) => state.status)
  const isShuffle = usePlayerStore((state) => state.isShuffle)
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const play = usePlayerStore((state) => state.play)
  const pause = usePlayerStore((state) => state.pause)
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
  const setRepeatMode = usePlayerStore((state) => state.setRepeatMode)

  const isDisabled = currentTrack === null
  const isPlaying = status === 'playing'
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  const cycleRepeatMode = useCallback((): void => {
    const currentIndex = REPEAT_CYCLE.indexOf(repeatMode)
    const nextMode = REPEAT_CYCLE[(currentIndex + 1) % REPEAT_CYCLE.length]
    setRepeatMode(nextMode)
  }, [repeatMode, setRepeatMode])

  const handlePlayPause = useCallback((): void => {
    if (isPlaying) {
      pause()
      return
    }

    play()
  }, [isPlaying, pause, play])

  const handleNext = useCallback((): void => {
    next({ wrapQueue: true })
  }, [next])

  return {
    isDisabled,
    isPlaying,
    isShuffle,
    repeatMode,
    RepeatIcon,
    repeatLabel: REPEAT_LABELS[repeatMode],
    toggleShuffle,
    previous,
    next: handleNext,
    cycleRepeatMode,
    handlePlayPause,
  }
}
