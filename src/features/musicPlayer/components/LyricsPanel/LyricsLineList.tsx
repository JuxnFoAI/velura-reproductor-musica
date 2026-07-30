/** Lista de letras con scroll centrado estilo Apple Music al avanzar. */
import { memo, useCallback, useLayoutEffect, useRef } from 'react'
import {
  LINE_SLIDE_MS,
  LYRICS_FUTURE_VISIBLE_LINES,
  LYRICS_PAST_VISIBLE_LINES,
} from '../../lib/lyricsConstants'
import { findActiveLineIndex, getCenteredVisibleLyricsLines } from '../../services/lrcParser'
import type { LyricsLine } from '../../types/lyrics'
import { LyricsParagraph, type LyricsLineSlot } from './LyricsParagraph'

interface LyricsLineListProps {
  lines: LyricsLine[]
  currentTime: number
  trackDuration: number
}

function resolveLineSlot(
  sourceIndex: number,
  activeLineIndex: number,
  hasActiveLine: boolean,
): LyricsLineSlot {
  if (!hasActiveLine) {
    return sourceIndex === 0 ? 'next' : 'preview'
  }

  const distance = sourceIndex - activeLineIndex

  if (distance === 0) {
    return 'active'
  }

  if (distance === -1) {
    return 'past'
  }

  if (distance === 1) {
    return 'next'
  }

  return 'preview'
}

function measureCenterOffset(viewport: HTMLDivElement, activeLineElement: HTMLElement): number {
  const viewportHeight = viewport.clientHeight
  const lineCenter = activeLineElement.offsetTop + activeLineElement.offsetHeight / 2

  return viewportHeight / 2 - lineCenter
}

function applyContainerOffset(
  container: HTMLDivElement,
  offsetPx: number,
  animate: boolean,
): void {
  if (animate) {
    container.style.transition = `transform ${LINE_SLIDE_MS}ms var(--lyrics-line-slide-easing)`
  } else {
    container.style.transition = 'none'
  }

  container.style.transform = `translate3d(0, ${offsetPx}px, 0)`
}

/**
 * Centra la línea activa verticalmente y desplaza suavemente al avanzar secuencialmente.
 */
export const LyricsLineList = memo(function LyricsLineList({
  lines,
  currentTime,
  trackDuration,
}: LyricsLineListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const linesContainerRef = useRef<HTMLDivElement>(null)
  const lineRefsMap = useRef<Map<number, HTMLParagraphElement>>(new Map())
  const prevActiveLineRef = useRef(-1)
  const prefersReducedMotionRef = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  const activeLineIndex = findActiveLineIndex(lines, currentTime, trackDuration)
  const hasActiveLine = activeLineIndex >= 0
  const visibleLines = getCenteredVisibleLyricsLines(
    lines,
    activeLineIndex,
    LYRICS_PAST_VISIBLE_LINES,
    LYRICS_FUTURE_VISIBLE_LINES,
  )

  const registerLineRef = useCallback(
    (sourceIndex: number) => (element: HTMLParagraphElement | null) => {
      if (element) {
        lineRefsMap.current.set(sourceIndex, element)
        return
      }

      lineRefsMap.current.delete(sourceIndex)
    },
    [],
  )

  const recenterActiveLine = useCallback((animate: boolean) => {
    const viewport = viewportRef.current
    const container = linesContainerRef.current

    if (!viewport || !container) {
      return
    }

    const anchorIndex = activeLineIndex >= 0 ? activeLineIndex : 0
    const activeLineElement = lineRefsMap.current.get(anchorIndex)

    if (!activeLineElement) {
      return
    }

    applyContainerOffset(container, measureCenterOffset(viewport, activeLineElement), animate)
  }, [activeLineIndex])

  useLayoutEffect(() => {
    const previousActive = prevActiveLineRef.current
    const shouldAnimate =
      !prefersReducedMotionRef.current &&
      hasActiveLine &&
      previousActive >= 0 &&
      activeLineIndex === previousActive + 1

    recenterActiveLine(shouldAnimate)
    prevActiveLineRef.current = activeLineIndex
  }, [activeLineIndex, hasActiveLine, lines, recenterActiveLine])

  useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      recenterActiveLine(false)
    })

    observer.observe(viewport)

    return () => {
      observer.disconnect()
    }
  }, [recenterActiveLine])

  return (
    <div ref={viewportRef} className="lyrics-panel__viewport">
      <div ref={linesContainerRef} className="lyrics-panel__lines">
        {visibleLines.map(({ line, sourceIndex }) => (
          <LyricsParagraph
            key={sourceIndex}
            line={line}
            slot={resolveLineSlot(sourceIndex, activeLineIndex, hasActiveLine)}
            isActive={sourceIndex === activeLineIndex}
            lineRef={registerLineRef(sourceIndex)}
          />
        ))}
      </div>
    </div>
  )
})
