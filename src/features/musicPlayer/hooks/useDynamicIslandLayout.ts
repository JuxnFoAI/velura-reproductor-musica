/** Mide las dimensiones expandidas de la isla dinámica; el estado retraído usa tamaño fijo en CSS. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const COLLAPSED_WIDTH_FALLBACK_PX = 200
const COLLAPSED_HEIGHT_FALLBACK_PX = 52
const EXPANDED_WIDTH_FALLBACK_PX = 416
const EXPANDED_HEIGHT_FALLBACK_PX = 120
const VIEWPORT_HORIZONTAL_MARGIN_PX = 32

function measureLayerSize(
  element: HTMLElement,
  widthFallback: number,
  heightFallback: number,
): { width: number; height: number } {
  const measuredWidth = Math.max(element.scrollWidth, element.getBoundingClientRect().width)
  const measuredHeight = Math.max(
    element.offsetHeight,
    element.scrollHeight,
    element.getBoundingClientRect().height,
  )

  return {
    width: measuredWidth > 0 ? measuredWidth : widthFallback,
    height: measuredHeight > 0 ? measuredHeight : heightFallback,
  }
}

interface DynamicIslandSize {
  width: number
  height: number
}

interface UseDynamicIslandLayoutOptions {
  isExpanded: boolean
  isMounted: boolean
  expandedRef: RefObject<HTMLDivElement | null>
  trackId: string | null
}

const COLLAPSED_SIZE: DynamicIslandSize = {
  width: COLLAPSED_WIDTH_FALLBACK_PX,
  height: COLLAPSED_HEIGHT_FALLBACK_PX,
}

/**
 * Calcula el ancho y alto de la isla expandida.
 * El estado retraído usa dimensiones fijas definidas en CSS para evitar animaciones al cambiar pista.
 */
export function useDynamicIslandLayout({
  isExpanded,
  isMounted,
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
    const measured = measureLayerSize(
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
    if (!isMounted || !isExpanded) {
      return
    }

    scheduleMeasure()
  }, [isMounted, isExpanded, scheduleMeasure, trackId])

  useEffect(() => {
    if (!isMounted || !isExpanded) {
      return undefined
    }

    const expanded = expandedRef.current

    if (!expanded) {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      scheduleMeasure()
    })

    observer.observe(expanded)

    const handleWindowResize = (): void => {
      scheduleMeasure()
    }

    window.addEventListener('resize', handleWindowResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleWindowResize)

      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current)
        measureFrameRef.current = null
      }
    }
  }, [expandedRef, isExpanded, isMounted, scheduleMeasure])

  return isExpanded ? expandedSize : COLLAPSED_SIZE
}
