/** Detecta si este renderer es la ventana flotante de la isla dinámica. */

import {
  DESKTOP_ISLAND_QUERY_PARAM,
  DESKTOP_ISLAND_QUERY_VALUE,
} from '@shared/desktop'

export function isDesktopIslandWindow(): boolean {
  return (
    new URLSearchParams(window.location.search).get(DESKTOP_ISLAND_QUERY_PARAM) ===
    DESKTOP_ISLAND_QUERY_VALUE
  )
}
