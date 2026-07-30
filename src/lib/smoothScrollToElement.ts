/** Utilidad para desplazar la ventana hasta un elemento con animación suave. */

const DEFAULT_SCROLL_DURATION_MS = 500

interface SmoothScrollToElementOptions {
  durationMs?: number
}

/**
 * Anima el scroll vertical de la ventana hasta alinear el elemento en la parte superior.
 */
export function smoothScrollToElement(
  element: HTMLElement,
  options: SmoothScrollToElementOptions = {},
): void {
  const durationMs = options.durationMs ?? DEFAULT_SCROLL_DURATION_MS

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.scrollIntoView({ behavior: 'auto', block: 'start' })
    return
  }

  const targetScrollY = element.getBoundingClientRect().top + window.scrollY
  const startScrollY = window.scrollY
  const distance = targetScrollY - startScrollY

  if (Math.abs(distance) < 1) {
    return
  }

  const startTime = performance.now()

  const animate = (currentTime: number): void => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / durationMs, 1)
    const easedProgress = 1 - (1 - progress) ** 3

    window.scrollTo(0, startScrollY + distance * easedProgress)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}
