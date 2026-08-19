/** Mide las dimensiones expandidas de la isla dinámica; el estado retraído usa tamaño fijo en CSS. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const COLLAPSED_WIDTH_FALLBACK_PX = 200
const COLLAPSED_HEIGHT_FALLBACK_PX = 52
const EXPANDED_WIDTH_FALLBACK_PX = 416
const EXPANDED_HEIGHT_FALLBACK_PX = 120
const VIEWPORT_HORIZONTAL_MARGIN_PX = 32

function restoreMeasuredStyles(
  element: HTMLElement,
  previous: { width: string; maxWidth: string; minWidth: string },
): void {
  element.style.width = previous.width
  element.style.maxWidth = previous.maxWidth
  element.style.minWidth = previous.minWidth
}

function measureUnconstrainedLayerSize(
  element: HTMLElement,
  widthFallback: number,
  heightFallback: number,
): { width: number; height: number } {
  const previous = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
  }

  element.style.width = 'max-content'
  element.style.maxWidth = 'none'
  element.style.minWidth = '0'

  const measuredWidth = Math.max(element.scrollWidth, element.offsetWidth, widthFallback)
  const measuredHeight = Math.max(element.scrollHeight, element.offsetHeight, heightFallback)

  restoreMeasuredStyles(element, previous)

  return {
    width: measuredWidth,
    height: measuredHeight,
  }
}

interface DynamicIslandSize {
  width: number
  height: number
}

interface UseDynamicIslandLayoutOptions {
  isExpanded: boolean
  expandedRef: RefObject<HTMLDivElement | null>
  trackId: string
}

const COLLAPSED_SIZE: DynamicIslandSize = {
  width: COLLAPSED_WIDTH_FALLBACK_PX,
  height: COLLAPSED_HEIGHT_FALLBACK_PX,
}

/**
 * Calcula el ancho y alto de la isla expandida antes de animar.
 * El estado retraído usa dimensiones fijas definidas en CSS.
 */
export function useDynamicIslandLayout({
  isExpanded,
  expandedRef,
  trackId,
}: UseDynamicIslandLayoutOptions): DynamicIslandSize {
  const [expandedSize, setExpandedSize] = useState<DynamicIslandSize>(() => ({
    width: EXPANDED_WIDTH_FALLBACK_PX,
    height: EXPANDED_HEIGHT_FALLBACK_PX,
  }))
  const measureFrameRef = useRef<number | null>(null)

  const measureExpanded = useCallback((): void => {
    const expanded = expandedRef.current

    if (!expanded) {
      return
    }

    const maxWidth = window.innerWidth - VIEWPORT_HORIZONTAL_MARGIN_PX
    const measured = measureUnconstrainedLayerSize(
      expanded,
      EXPANDED_WIDTH_FALLBACK_PX,
      EXPANDED_HEIGHT_FALLBACK_PX,
    )

    setExpandedSize({
      width: Math.min(measured.width, maxWidth),
      height: measured.height,
    })
  }, [expandedRef])

  const scheduleMeasure = useCallback((): void => {
    if (measureFrameRef.current !== null) {
      return
    }

    measureFrameRef.current = window.requestAnimationFrame(() => {
      measureFrameRef.current = null
      measureExpanded()
    })
  }, [measureExpanded])

  useLayoutEffect(() => {
    measureExpanded()
  }, [measureExpanded, trackId])

  useEffect(() => {
    const handleWindowResize = (): void => {
      if (isExpanded) {
        return
      }

      scheduleMeasure()
    }

    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)

      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current)
        measureFrameRef.current = null
      }
    }
  }, [isExpanded, scheduleMeasure])

  return isExpanded ? expandedSize : COLLAPSED_SIZE
}
