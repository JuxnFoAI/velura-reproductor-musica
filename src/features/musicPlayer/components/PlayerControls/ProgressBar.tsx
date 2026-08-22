/** Barra de progreso interactiva con arrastre, click y preview al hover. */
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { formatDuration } from '../../services/fileService'
import { usePlayerStore } from '../../store/playerStore'

interface ProgressBarProps {
  disabled?: boolean
  showTimeLabels?: boolean
  showHoverTime?: boolean
}

/**
 * Muestra el progreso de reproducción y permite buscar en la pista.
 */
export const ProgressBar = memo(function ProgressBar({
  disabled = false,
  showTimeLabels = true,
  showHoverTime = true,
}: ProgressBarProps) {
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const seek = usePlayerStore((state) => state.seek)

  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState(0)

  const displayedTime = isDragging ? dragTime : currentTime
  const progressRatio = duration > 0 ? displayedTime / duration : 0
  const isInteractive = !disabled && duration > 0

  const resolveTimeFromClientX = useCallback(
    (clientX: number): number => {
      const bar = barRef.current

      if (!bar || duration <= 0) {
        return 0
      }

      const { left, width } = bar.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width))
      return ratio * duration
    },
    [duration],
  )

  const updateHoverPreview = useCallback(
    (clientX: number): void => {
      const bar = barRef.current

      if (!bar || duration <= 0) {
        setHoverTime(null)
        return
      }

      const { left, width } = bar.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width))
      setHoverPosition(ratio * 100)
      setHoverTime(ratio * duration)
    },
    [duration],
  )

  const handlePointerDown = useCallback(
    (clientX: number): void => {
      if (!isInteractive) {
        return
      }

      const nextTime = resolveTimeFromClientX(clientX)
      setIsDragging(true)
      setDragTime(nextTime)
    },
    [isInteractive, resolveTimeFromClientX],
  )

  const handlePointerMove = useCallback(
    (clientX: number): void => {
      if (!isInteractive) {
        return
      }

      if (isDragging) {
        setDragTime(resolveTimeFromClientX(clientX))
        return
      }

      if (showHoverTime) {
        updateHoverPreview(clientX)
      }
    },
    [isDragging, isInteractive, resolveTimeFromClientX, showHoverTime, updateHoverPreview],
  )

  const handlePointerUp = useCallback(
    (clientX: number): void => {
      if (!isDragging) {
        return
      }

      const nextTime = resolveTimeFromClientX(clientX)
      setIsDragging(false)
      seek(nextTime)
    },
    [isDragging, resolveTimeFromClientX, seek],
  )

  useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleMouseMove = (event: MouseEvent): void => {
      handlePointerMove(event.clientX)
    }

    const handleMouseUp = (event: MouseEvent): void => {
      handlePointerUp(event.clientX)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handlePointerMove, handlePointerUp, isDragging])

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        ref={barRef}
        className={`group relative h-2 rounded-full bg-[var(--player-surface)] ${
          isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
        }`}
        onMouseDown={(event) => handlePointerDown(event.clientX)}
        onMouseMove={(event) => handlePointerMove(event.clientX)}
        onMouseLeave={() => setHoverTime(null)}
        role="slider"
        aria-label="Progreso de reproducción"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={displayedTime}
        aria-disabled={disabled}
        tabIndex={isInteractive ? 0 : -1}
        onKeyDown={(event) => {
          if (!isInteractive) {
            return
          }

          const STEP_SECONDS = 5

          if (event.key === 'ArrowRight') {
            event.preventDefault()
            seek(Math.min(duration, currentTime + STEP_SECONDS))
          }

          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            seek(Math.max(0, currentTime - STEP_SECONDS))
          }
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-75"
          style={{ width: `${progressRatio * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--player-text)] opacity-0 shadow transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${progressRatio * 100}% - 6px)` }}
        />

        {showHoverTime && hoverTime !== null && !isDragging ? (
          <div
            className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded-md bg-[var(--player-surface)] px-2 py-0.5 text-xs text-[var(--player-text)] shadow"
            style={{ left: `${hoverPosition}%` }}
          >
            {formatDuration(hoverTime)}
          </div>
        ) : null}
      </div>

      {showTimeLabels ? (
        <div className="flex justify-between text-xs text-[var(--player-text-muted)]">
          <span>{formatDuration(displayedTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      ) : null}
    </div>
  )
})
