/** Mide y observa las dimensiones de la isla dinámica para animarlas sin saltos. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const COLLAPSED_WIDTH_FALLBACK_PX = 184
const COLLAPSED_HEIGHT_FALLBACK_PX = 40
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
  collapsedRef: RefObject<HTMLDivElement | null>
  expandedRef: RefObject<HTMLDivElement | null>
  trackId: string | null
}

/**
 * Calcula el ancho y alto objetivo de la isla según la capa activa.
 * Usa ResizeObserver para reaccionar a cambios de contenido sin lag.
 */
export function useDynamicIslandLayout({
  isExpanded,
  isMounted,
  collapsedRef,
  expandedRef,
  trackId,
}: UseDynamicIslandLayoutOptions): DynamicIslandSize {
  const [size, setSize] = useState<DynamicIslandSize>(() =>
    isExpanded
      ? { width: EXPANDED_WIDTH_FALLBACK_PX, height: EXPANDED_HEIGHT_FALLBACK_PX }
      : { width: COLLAPSED_WIDTH_FALLBACK_PX, height: COLLAPSED_HEIGHT_FALLBACK_PX },
  )
  const measureFrameRef = useRef<number | null>(null)

  const measure = useCallback((): void => {
    const collapsed = collapsedRef.current
    const expanded = expandedRef.current

    if (!collapsed || !expanded) {
      return
    }

    const maxWidth = window.innerWidth - VIEWPORT_HORIZONTAL_MARGIN_PX
    const collapsedSize = measureLayerSize(
      collapsed,
      COLLAPSED_WIDTH_FALLBACK_PX,
      COLLAPSED_HEIGHT_FALLBACK_PX,
    )
    const expandedSize = measureLayerSize(
      expanded,
      EXPANDED_WIDTH_FALLBACK_PX,
      EXPANDED_HEIGHT_FALLBACK_PX,
    )

    if (isExpanded) {
      setSize({
        width: Math.min(expandedSize.width, maxWidth),
        height: expandedSize.height,
      })
      return
    }

    setSize({
      width: Math.min(collapsedSize.width, maxWidth),
      height: collapsedSize.height,
    })
  }, [collapsedRef, expandedRef, isExpanded])

  const scheduleMeasure = useCallback((): void => {
    if (measureFrameRef.current !== null) {
      return
    }

    measureFrameRef.current = window.requestAnimationFrame(() => {
      measureFrameRef.current = null
      measure()
    })
  }, [measure])

  useLayoutEffect(() => {
    if (!isMounted) {
      return
    }

    scheduleMeasure()
  }, [isMounted, scheduleMeasure, trackId, isExpanded])

  useEffect(() => {
    if (!isMounted) {
      return undefined
    }

    const collapsed = collapsedRef.current
    const expanded = expandedRef.current

    if (!collapsed || !expanded) {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      scheduleMeasure()
    })

    observer.observe(collapsed)
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
  }, [collapsedRef, expandedRef, isMounted, scheduleMeasure])

  return size
}
