/** Detección del entorno de ejecución (navegador vs app de escritorio). */

declare global {
  interface Window {
    /** Marcador inyectado por el preload de la app de escritorio (Electron/Tauri). */
    __REPRODUCTOR_DESKTOP__?: boolean
  }
}

/**
 * Indica si la UI corre dentro de la app de escritorio empaquetada.
 * El preload debe asignar `window.__REPRODUCTOR_DESKTOP__ = true`.
 */
export function isDesktopApp(): boolean {
  return window.__REPRODUCTOR_DESKTOP__ === true
}

/**
 * La Isla dinámica solo se habilita en viewport de escritorio y dentro de la app empaquetada.
 * En desarrollo web se mantiene visible para poder probar la UI en el navegador.
 */
export function isDynamicIslandRuntimeEnabled(isDesktopViewport: boolean): boolean {
  if (!isDesktopViewport) {
    return false
  }

  if (isDesktopApp()) {
    return true
  }

  return import.meta.env.DEV
}
