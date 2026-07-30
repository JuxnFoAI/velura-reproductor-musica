/** Aplica el color de fondo seleccionado a la Isla dinámica mediante CSS variables. */

import type { DynamicIslandColorOption } from '../types/dynamicIslandColors'

const DYNAMIC_ISLAND_BACKGROUND_VARIABLE = '--dynamic-island-background'

/**
 * Actualiza la variable CSS usada como fondo de la Isla dinámica.
 */
export function applyDynamicIslandColor(color: DynamicIslandColorOption): void {
  document.documentElement.style.setProperty(
    DYNAMIC_ISLAND_BACKGROUND_VARIABLE,
    color.background,
  )
}
