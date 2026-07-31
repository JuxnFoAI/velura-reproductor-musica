/** Estado y toggle de pantalla completa vía IPC de Electron (solo escritorio). */
import { useCallback, useEffect, useState } from 'react'
import { isDesktopApp } from '@lib/runtimeEnvironment'

interface DesktopFullscreenState {
  isAvailable: boolean
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
}

/**
 * Expone pantalla completa en la app empaquetada; en web no hace nada.
 */
export function useDesktopFullscreen(): DesktopFullscreenState {
  const isAvailable = isDesktopApp()
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const desktopWindow = window.veluraDesktopWindow

    if (!isAvailable || !desktopWindow) {
      return undefined
    }

    let isDisposed = false

    void desktopWindow.getFullscreen().then((value) => {
      if (!isDisposed) {
        setIsFullscreen(value)
      }
    })

    const unsubscribe = desktopWindow.onFullscreenChange((value) => {
      setIsFullscreen(value)
    })

    return () => {
      isDisposed = true
      unsubscribe()
    }
  }, [isAvailable])

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    const desktopWindow = window.veluraDesktopWindow

    if (!isAvailable || !desktopWindow) {
      return
    }

    const nextFullscreen = await desktopWindow.toggleFullscreen()
    setIsFullscreen(nextFullscreen)
  }, [isAvailable])

  return {
    isAvailable,
    isFullscreen,
    toggleFullscreen,
  }
}
