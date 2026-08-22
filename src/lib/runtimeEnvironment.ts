/** Detección del entorno de ejecución (navegador vs app de escritorio). */

/**
 * Indica si la UI corre dentro de la app de escritorio empaquetada.
 * El preload debe asignar `window.__REPRODUCTOR_DESKTOP__ = true`.
 */
export function isDesktopApp(): boolean {
  return window.__REPRODUCTOR_DESKTOP__ === true
}
