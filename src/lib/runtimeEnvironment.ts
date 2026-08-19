/** Detección del entorno de ejecución (navegador vs app de escritorio). */

/**
 * Indica si la UI corre dentro de la app de escritorio empaquetada.
 * El preload debe asignar `window.__REPRODUCTOR_DESKTOP__ = true`.
 */
export function isDesktopApp(): boolean {
  return window.__REPRODUCTOR_DESKTOP__ === true
}

/**
 * En el navegador, la isla de vista previa solo aparece en viewport de escritorio y en desarrollo.
 * En la app empaquetada la isla vive en su propia ventana.
 */
export function isDynamicIslandRuntimeEnabled(isDesktopViewport: boolean): boolean {
  return isDesktopViewport && import.meta.env.DEV
}
