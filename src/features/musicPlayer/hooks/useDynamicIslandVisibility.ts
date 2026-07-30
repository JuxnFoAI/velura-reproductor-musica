/** Hook que determina si la Isla dinámica debe renderizarse según entorno, viewport y preferencia del usuario. */

import { useEffect, useState } from 'react'
import { useCustomizationStore } from '@features/customization'
import { DYNAMIC_ISLAND_MIN_VIEWPORT_WIDTH_PX } from '@lib/dynamicIslandPolicy'
import { isDynamicIslandRuntimeEnabled } from '@lib/runtimeEnvironment'

const DESKTOP_MEDIA_QUERY = `(min-width: ${DYNAMIC_ISLAND_MIN_VIEWPORT_WIDTH_PX}px)`

function readRuntimeVisibility(): boolean {
  return isDynamicIslandRuntimeEnabled(window.matchMedia(DESKTOP_MEDIA_QUERY).matches)
}

/**
 * Expone si la Isla dinámica debe mostrarse (escritorio + app empaquetada, o dev web).
 * También respeta la preferencia del usuario para activarla o desactivarla.
 */
export function useDynamicIslandVisibility(): boolean {
  const isDynamicIslandEnabled = useCustomizationStore((state) => state.isDynamicIslandEnabled)
  const [isRuntimeVisible, setIsRuntimeVisible] = useState(readRuntimeVisibility)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const syncVisibility = (): void => {
      setIsRuntimeVisible(readRuntimeVisibility())
    }

    syncVisibility()
    mediaQuery.addEventListener('change', syncVisibility)

    return () => {
      mediaQuery.removeEventListener('change', syncVisibility)
    }
  }, [])

  return isRuntimeVisible && isDynamicIslandEnabled
}
