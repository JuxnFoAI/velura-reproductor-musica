/** Interacción de desplegar, retraer y expandir la isla dinámica. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const COLLAPSE_DELAY_MS = 180
const RETRACT_HOVER_DELAY_MS = 220
const ISLAND_HANDLE_GAP_PX = 8
const MIN_ISLAND_HEIGHT_PX = 40

export function useDynamicIslandInteraction() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRetracted, setIsRetracted] = useState(true)
  const [isSizeTransitionEnabled, setIsSizeTransitionEnabled] = useState(false)
  const collapseTimeoutRef = useRef<number | null>(null)
  const retractTimeoutRef = useRef<number | null>(null)
  const islandRef = useRef<HTMLElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)

  const enableSizeTransition = useCallback((): void => {
    setIsSizeTransitionEnabled(true)
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
    stack.style.setProperty(
      '--dynamic-island-retract-offset',
      `${measuredHeight + ISLAND_HANDLE_GAP_PX}px`,
    )
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

  const deployIsland = useCallback((): void => {
    clearRetractTimeout()

    if (!isRetracted) {
      return
    }

    setIsExpanded(false)
    setIsSizeTransitionEnabled(false)
    clearRetractOffset()
    setIsRetracted(false)
  }, [clearRetractOffset, clearRetractTimeout, isRetracted])

  const scheduleRetractIsland = useCallback((): void => {
    clearRetractTimeout()
    retractTimeoutRef.current = window.setTimeout(() => {
      updateRetractOffset()
      setIsRetracted(true)
      setIsExpanded(false)
      setIsSizeTransitionEnabled(false)
      retractTimeoutRef.current = null
    }, RETRACT_HOVER_DELAY_MS)
  }, [clearRetractTimeout, updateRetractOffset])

  const handleIslandMouseEnter = useCallback((): void => {
    if (isRetracted) {
      return
    }

    clearCollapseTimeout()
    enableSizeTransition()
    setIsExpanded(true)
  }, [clearCollapseTimeout, enableSizeTransition, isRetracted])

  const handleIslandMouseLeave = useCallback((): void => {
    clearCollapseTimeout()
    collapseTimeoutRef.current = window.setTimeout(() => {
      enableSizeTransition()
      setIsExpanded(false)
      collapseTimeoutRef.current = null
    }, COLLAPSE_DELAY_MS)
  }, [clearCollapseTimeout, enableSizeTransition])

  useLayoutEffect(() => {
    if (!isRetracted) {
      return
    }

    updateRetractOffset()
  }, [isRetracted, updateRetractOffset])

  useEffect(() => {
    const island = islandRef.current

    if (!island) {
      return undefined
    }

    const observer = new ResizeObserver(updateRetractOffset)
    observer.observe(island)

    return () => {
      observer.disconnect()
    }
  }, [updateRetractOffset])

  useEffect(() => {
    const island = islandRef.current

    if (!island) {
      return undefined
    }

    const handleTransitionEnd = (event: TransitionEvent): void => {
      if (event.target !== island) {
        return
      }

      if (event.propertyName !== 'width' && event.propertyName !== 'height') {
        return
      }

      setIsSizeTransitionEnabled(false)
    }

    island.addEventListener('transitionend', handleTransitionEnd)

    return () => {
      island.removeEventListener('transitionend', handleTransitionEnd)
      clearCollapseTimeout()
      clearRetractTimeout()
    }
  }, [clearCollapseTimeout, clearRetractTimeout])

  return {
    isExpanded,
    isRetracted,
    isSizeTransitionEnabled,
    islandRef,
    stackRef,
    deployIsland,
    scheduleRetractIsland,
    handleIslandMouseEnter,
    handleIslandMouseLeave,
  }
}
