/** Aplica la clase `desktop-app` al documento cuando corre la app empaquetada. */
import { useLayoutEffect } from 'react'
import { isDesktopApp } from '@lib/runtimeEnvironment'

const DESKTOP_APP_CLASS = 'desktop-app'

/**
 * Marca el `<html>` para estilos exclusivos de Electron (p. ej. scrollbars ocultas en la vista principal).
 */
export function useDesktopAppDocumentClass(): void {
  useLayoutEffect(() => {
    if (!isDesktopApp()) {
      return
    }

    document.documentElement.classList.add(DESKTOP_APP_CLASS)

    return () => {
      document.documentElement.classList.remove(DESKTOP_APP_CLASS)
    }
  }, [])
}
