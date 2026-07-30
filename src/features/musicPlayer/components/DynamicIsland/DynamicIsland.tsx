/** Isla dinámica dentro de la ventana de la app; visible solo en escritorio empaquetado. */

import { ChevronDown } from 'lucide-react'
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDynamicIslandLayout } from '../../hooks/useDynamicIslandLayout'
import { useDynamicIslandVisibility } from '../../hooks/useDynamicIslandVisibility'
import { usePlayerStore } from '../../store/playerStore'
import { PlayPauseButton } from '../PlayerControls/PlayPauseButton'
import { PlayingWaveBars } from '../PlayingWaveBars'
import { DynamicIslandControls } from './DynamicIslandControls'

const COLLAPSE_DELAY_MS = 180
const RETRACT_TRANSITION_MS = 450
const ISLAND_TOGGLE_GAP_PX = 10
const MIN_ISLAND_HEIGHT_PX = 40

/**
 * Widget flotante en la parte superior que se expande al pasar el cursor.
 * La flecha inferior oculta o muestra la isla con un desplazamiento vertical.
 */
export const DynamicIsland = memo(function DynamicIsland() {
  const isVisible = useDynamicIslandVisibility()
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const status = usePlayerStore((state) => state.status)
  const isMounted = isVisible && currentTrack !== null
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRetracted, setIsRetracted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const collapseTimeoutRef = useRef<number | null>(null)
  const activeTransitionsRef = useRef(0)
  const collapsedRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  const islandRef = useRef<HTMLElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const retractTimeoutRef = useRef<number | null>(null)

  const size = useDynamicIslandLayout({
    isExpanded,
    isMounted,
    collapsedRef,
    expandedRef,
    trackId: currentTrack?.id ?? null,
  })

  const resetInteractionState = useCallback((): void => {
    setIsExpanded(false)
    setIsRetracted(false)
    setIsAnimating(false)
    activeTransitionsRef.current = 0
  }, [])

  const updateRetractOffset = useCallback((): void => {
    const island = islandRef.current
    const stack = stackRef.current

    if (!island || !stack) {
      return
    }

    const measuredHeight = Math.max(
      island.offsetHeight,
      island.getBoundingClientRect().height,
      MIN_ISLAND_HEIGHT_PX,
    )
    const offset = measuredHeight + ISLAND_TOGGLE_GAP_PX
    stack.style.setProperty('--dynamic-island-retract-offset', `${offset}px`)
  }, [])

  const clearRetractOffset = useCallback((): void => {
    stackRef.current?.style.removeProperty('--dynamic-island-retract-offset')
  }, [])

  const clearRetractTimeout = useCallback((): void => {
    if (retractTimeoutRef.current !== null) {
      window.clearTimeout(retractTimeoutRef.current)
      retractTimeoutRef.current = null
    }
  }, [])

  const clearCollapseTimeout = useCallback((): void => {
    if (collapseTimeoutRef.current !== null) {
      window.clearTimeout(collapseTimeoutRef.current)
      collapseTimeoutRef.current = null
    }
  }, [])

  const handleMouseEnter = useCallback((): void => {
    clearCollapseTimeout()
    setIsExpanded(true)
  }, [clearCollapseTimeout])

  const handleMouseLeave = useCallback((): void => {
    clearCollapseTimeout()
    collapseTimeoutRef.current = window.setTimeout(() => {
      setIsExpanded(false)
      collapseTimeoutRef.current = null
    }, COLLAPSE_DELAY_MS)
  }, [clearCollapseTimeout])

  const handleToggleClick = useCallback((): void => {
    clearCollapseTimeout()
    clearRetractTimeout()

    if (isRetracted) {
      clearRetractOffset()
      setIsRetracted(false)
      return
    }

    const startRetract = (): void => {
      updateRetractOffset()
      setIsRetracted(true)
    }

    if (isExpanded) {
      setIsExpanded(false)
      retractTimeoutRef.current = window.setTimeout(() => {
        startRetract()
        retractTimeoutRef.current = null
      }, RETRACT_TRANSITION_MS)
      return
    }

    startRetract()
  }, [
    clearCollapseTimeout,
    clearRetractTimeout,
    isExpanded,
    isRetracted,
    updateRetractOffset,
    clearRetractOffset,
  ])

  useLayoutEffect(() => {
    if (!isMounted) {
      clearCollapseTimeout()
      clearRetractTimeout()
      resetInteractionState()
      return
    }

    resetInteractionState()
    clearRetractOffset()
  }, [
    isMounted,
    clearCollapseTimeout,
    clearRetractTimeout,
    clearRetractOffset,
    resetInteractionState,
  ])

  useLayoutEffect(() => {
    if (!isMounted || !isRetracted) {
      return
    }

    updateRetractOffset()
  }, [isMounted, isRetracted, size.height, size.width, updateRetractOffset])

  useEffect(() => {
    const island = islandRef.current

    if (!island || !isMounted) {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      updateRetractOffset()
    })

    observer.observe(island)

    return () => {
      observer.disconnect()
    }
  }, [isMounted, updateRetractOffset])

  useEffect(() => {
    return () => {
      clearCollapseTimeout()
      clearRetractTimeout()
    }
  }, [clearCollapseTimeout, clearRetractTimeout])

  useEffect(() => {
    const island = islandRef.current

    if (!island || !isMounted) {
      return
    }

    const handleTransitionStart = (event: TransitionEvent): void => {
      if (event.target !== island) {
        return
      }

      if (event.propertyName !== 'width' && event.propertyName !== 'height') {
        return
      }

      activeTransitionsRef.current += 1
      setIsAnimating(true)
    }

    const handleTransitionEnd = (event: TransitionEvent): void => {
      if (event.target !== island) {
        return
      }

      if (event.propertyName !== 'width' && event.propertyName !== 'height') {
        return
      }

      activeTransitionsRef.current = Math.max(0, activeTransitionsRef.current - 1)

      if (activeTransitionsRef.current === 0) {
        setIsAnimating(false)
      }
    }

    island.addEventListener('transitionstart', handleTransitionStart)
    island.addEventListener('transitionend', handleTransitionEnd)

    return () => {
      island.removeEventListener('transitionstart', handleTransitionStart)
      island.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [isMounted])

  if (!isMounted) {
    return null
  }

  const isPlaying = status === 'playing'
  const islandClassName = [
    'dynamic-island',
    isExpanded ? 'dynamic-island--expanded' : '',
    isAnimating ? 'dynamic-island--animating' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const stackClassName = [
    'dynamic-island-stack',
    isRetracted ? 'dynamic-island-stack--retracted' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const anchorClassName = [
    'dynamic-island-anchor',
    isRetracted ? 'dynamic-island-anchor--retracted' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={anchorClassName}>
      <div ref={stackRef} className={stackClassName}>
        <div
          onMouseEnter={isRetracted ? undefined : handleMouseEnter}
          onMouseLeave={isRetracted ? undefined : handleMouseLeave}
        >
          <aside
            ref={islandRef}
            className={islandClassName}
            style={{
              width: size.width,
              height: size.height,
            }}
            aria-label="Reproductor flotante"
            aria-expanded={isExpanded}
            aria-hidden={isRetracted}
            {...(isRetracted ? { inert: true } : {})}
          >
            <div className="dynamic-island__layers">
              <div
                ref={collapsedRef}
                className={`dynamic-island__layer dynamic-island__layer--collapsed ${
                  isExpanded ? 'dynamic-island__layer--hidden' : 'dynamic-island__layer--visible'
                }`}
                aria-hidden={isExpanded}
                {...(isExpanded ? { inert: true } : {})}
              >
                <DynamicIslandCollapsedContent
                  coverUrl={currentTrack.coverUrl}
                  title={currentTrack.title}
                  isPlaying={isPlaying}
                  isDisabled={status === 'loading'}
                />
              </div>

              <div
                ref={expandedRef}
                className={`dynamic-island__layer dynamic-island__layer--expanded ${
                  isExpanded ? 'dynamic-island__layer--visible' : 'dynamic-island__layer--hidden'
                }`}
                aria-hidden={!isExpanded}
                {...(!isExpanded ? { inert: true } : {})}
              >
                <DynamicIslandControls />
              </div>
            </div>
          </aside>
        </div>

        <button
          type="button"
          onClick={handleToggleClick}
          aria-expanded={!isRetracted}
          aria-label={isRetracted ? 'Mostrar reproductor flotante' : 'Ocultar reproductor flotante'}
          className={`dynamic-island__toggle ${isRetracted ? 'dynamic-island__toggle--retracted' : ''}`}
        >
          <ChevronDown size={16} aria-hidden="true" className="dynamic-island__toggle-icon" />
        </button>
      </div>
    </div>
  )
})

interface DynamicIslandCollapsedContentProps {
  coverUrl?: string
  title: string
  isPlaying: boolean
  isDisabled: boolean
}

const DynamicIslandCollapsedContent = memo(function DynamicIslandCollapsedContent({
  coverUrl,
  title,
  isPlaying,
  isDisabled,
}: DynamicIslandCollapsedContentProps) {
  const play = usePlayerStore((state) => state.play)
  const pause = usePlayerStore((state) => state.pause)

  const handlePlay = useCallback((): void => {
    play()
  }, [play])

  const handlePause = useCallback((): void => {
    pause()
  }, [pause])

  return (
    <div className="dynamic-island__collapsed-inner">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          decoding="async"
          className="dynamic-island__cover"
          aria-hidden="true"
        />
      ) : (
        <div className="dynamic-island__cover dynamic-island__cover--placeholder" aria-hidden="true">
          <span className="text-xs text-white">♪</span>
        </div>
      )}

      <span className="dynamic-island__title montserrat-regular">{title}</span>

      <div className="dynamic-island__play-indicator">
        {isPlaying ? (
          <button
            type="button"
            onClick={handlePause}
            disabled={isDisabled}
            aria-label="Pausar"
            className="dynamic-island__wave-indicator"
          >
            <PlayingWaveBars className="h-5" variant="white" />
          </button>
        ) : (
          <PlayPauseButton isPlaying={false} disabled={isDisabled} onClick={handlePlay} />
        )}
      </div>
    </div>
  )
})
