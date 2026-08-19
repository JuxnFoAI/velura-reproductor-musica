/** Hook que determina si la Isla dinámica debe renderizarse según entorno, viewport y preferencia del usuario. */

import { useEffect, useState } from 'react'
import { useCustomizationStore } from '@features/customization'
import { DYNAMIC_ISLAND_MIN_VIEWPORT_WIDTH_PX } from '@lib/dynamicIslandPolicy'
import { isDesktopIslandWindow } from '@lib/desktopIslandWindow'
import { isDesktopApp, isDynamicIslandRuntimeEnabled } from '@lib/runtimeEnvironment'

const DESKTOP_MEDIA_QUERY = `(min-width: ${DYNAMIC_ISLAND_MIN_VIEWPORT_WIDTH_PX}px)`

function readWebRuntimeVisibility(): boolean {
  return isDynamicIslandRuntimeEnabled(window.matchMedia(DESKTOP_MEDIA_QUERY).matches)
}

/**
 * Expone si la Isla dinámica debe mostrarse.
 * En la app de escritorio vive en una ventana flotante; la visibilidad de esa ventana la controla el proceso principal.
 */
export function useDynamicIslandVisibility(): boolean {
  const isDynamicIslandEnabled = useCustomizationStore((state) => state.isDynamicIslandEnabled)
  const [isWebRuntimeVisible, setIsWebRuntimeVisible] = useState(() => {
    if (isDesktopApp()) {
      return false
    }

    return readWebRuntimeVisibility()
  })

  useEffect(() => {
    if (isDesktopApp()) {
      return undefined
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const syncVisibility = (): void => {
      setIsWebRuntimeVisible(readWebRuntimeVisibility())
    }

    syncVisibility()
    mediaQuery.addEventListener('change', syncVisibility)

    return () => {
      mediaQuery.removeEventListener('change', syncVisibility)
    }
  }, [])

  if (isDesktopIslandWindow()) {
    return true
  }

  if (isDesktopApp()) {
    return false
  }

  return isWebRuntimeVisible && isDynamicIslandEnabled
}
