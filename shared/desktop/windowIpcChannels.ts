/** Canales IPC para acciones de ventana en la app de escritorio. */

export const DESKTOP_WINDOW_IPC_CHANNELS = {
  toggleFullscreen: 'velura:window:toggle-fullscreen',
  getFullscreen: 'velura:window:get-fullscreen',
  fullscreenChanged: 'velura:window:fullscreen-changed',
} as const
